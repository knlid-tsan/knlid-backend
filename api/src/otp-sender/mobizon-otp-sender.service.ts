import { Injectable, Logger } from '@nestjs/common';
import { OtpSenderService } from './otp-sender.service';

// Коды ответов Mobizon: https://mobizon.kz/help/api-docs/other#ApiCode
const MOBIZON_CODE_MESSAGES: Record<number, string> = {
  1: 'Ошибка валидации данных',
  2: 'Запись не найдена',
  3: 'Неопознанная ошибка приложения',
  4: 'Неверный параметр module',
  5: 'Неверный параметр method',
  6: 'Неверный параметр format',
  8: 'Ошибка авторизации (неверный apiKey?)',
  9: 'Нет доступа к методу API',
  10: 'Ошибка сохранения данных на сервере',
  11: 'Отсутствуют обязательные параметры',
  12: 'Параметр не удовлетворяет ограничениям',
  13: 'Запрос к серверу, не обслуживающему пользователя',
  14: 'Аккаунт заблокирован или удалён',
  30: 'Превышен лимит скорости запросов',
  98: 'Массовая операция выполнена частично',
  99: 'Массовая операция не обработана',
  999: 'Общая ошибка сервиса',
};

const REQUEST_TIMEOUT_MS = 10_000;

interface MobizonResponse {
  code: number;
  data: unknown;
  message: string;
}

@Injectable()
export class MobizonOtpSenderService extends OtpSenderService {
  private readonly logger = new Logger('OtpSender');

  async send(phone: string, code: string): Promise<void> {
    const apiKey = process.env.MOBIZON_API_KEY;
    if (!apiKey) {
      throw new Error('MOBIZON_API_KEY не задан — SMS не отправлена');
    }

    const baseUrl = (
      process.env.MOBIZON_API_URL || 'https://api.mobizon.kz'
    ).replace(/\/+$/, '');

    // Mobizon принимает номер в международном формате без «+» и разделителей
    const recipient = phone.replace(/\D/g, '');

    const url = new URL(`${baseUrl}/service/message/sendsmsmessage`);
    url.searchParams.set('apiKey', apiKey);
    url.searchParams.set('output', 'json');

    const body = new URLSearchParams({
      recipient,
      text: `Ваш код подтверждения KN.LID: ${code}`,
    });
    const sender = process.env.MOBIZON_SENDER;
    if (sender) body.set('from', sender);

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (err) {
      throw new Error(
        `Mobizon недоступен (${(err as Error)?.name === 'TimeoutError' ? 'таймаут' : 'сетевая ошибка'}): ${(err as Error)?.message}`,
      );
    }

    if (!response.ok) {
      throw new Error(`Mobizon HTTP ${response.status}`);
    }

    const result = (await response.json()) as MobizonResponse;

    if (result.code === 0) {
      this.logger.log(`SMS с кодом отправлена на ${phone} (Mobizon: OK)`);
      return;
    }
    if (result.code === 100) {
      this.logger.log(
        `SMS с кодом принята в фоновую отправку на ${phone} (Mobizon: 100)`,
      );
      return;
    }

    const meaning = MOBIZON_CODE_MESSAGES[result.code] ?? 'Неизвестный код';
    throw new Error(
      `Mobizon отклонил отправку на ${phone}: code=${result.code} (${meaning})${result.message ? `, message="${result.message}"` : ''}`,
    );
  }
}
