import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:image_picker/image_picker.dart';
import '../services/api_client.dart';
import '../theme/app_colors.dart';

// Состояния верификации, производные от status + rejection_reason
enum _VerifState { notStarted, pending, rejected, active }

_VerifState _parseState(String status, String? rejectionReason) {
  if (status == 'active') return _VerifState.active;
  if (status == 'pending') return _VerifState.pending;
  if (rejectionReason != null && rejectionReason.isNotEmpty) {
    return _VerifState.rejected;
  }
  return _VerifState.notStarted;
}

class VerificationScreen extends StatefulWidget {
  const VerificationScreen({super.key});

  @override
  State<VerificationScreen> createState() => _VerificationScreenState();
}

class _VerificationScreenState extends State<VerificationScreen> {
  final _client = ApiClient();
  final _picker = ImagePicker();

  _VerifState _state = _VerifState.notStarted;
  String? _rejectionReason;
  bool _loading = true;
  bool _uploading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadStatus();
  }

  Future<void> _loadStatus() async {
    setState(() { _loading = true; _error = null; });
    try {
      final res = await _client.dio.get('/users/me');
      final user = res.data as Map<String, dynamic>;
      final status = user['status'] as String? ?? 'new';
      final reason = user['verification_rejection_reason'] as String?;
      setState(() {
        _state = _parseState(status, reason);
        _rejectionReason = reason;
      });
    } on DioException catch (e) {
      final data = e.response?.data;
      final msg = data is Map ? data['message'] : null;
      setState(() => _error = msg is String ? msg : 'Ошибка загрузки статуса');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _pickAndUpload() async {
    final choice = await _showSourceSheet();
    if (choice == null) return;

    final XFile? file = await _picker.pickImage(
      source: choice,
      imageQuality: 85,
      maxWidth: 1920,
    );
    if (file == null) return;

    setState(() { _uploading = true; _error = null; });
    try {
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(file.path,
            filename: file.name),
      });
      await _client.dio.post(
        '/users/me/identity-document',
        data: formData,
        options: Options(contentType: 'multipart/form-data'),
      );
      // После успешной загрузки — обновляем статус (теперь должен быть pending)
      await _loadStatus();
    } on DioException catch (e) {
      final data = e.response?.data;
      final msg = data is Map ? data['message'] : null;
      setState(() => _error = msg is String ? msg : 'Ошибка загрузки файла');
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  Future<ImageSource?> _showSourceSheet() async {
    return showModalBottomSheet<ImageSource>(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 8),
            Container(
              width: 36, height: 4,
              decoration: BoxDecoration(
                color: AppColors.divider,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 16),
            ListTile(
              leading: const Icon(Icons.camera_alt_outlined),
              title: const Text('Камера'),
              onTap: () => Navigator.pop(ctx, ImageSource.camera),
            ),
            ListTile(
              leading: const Icon(Icons.photo_library_outlined),
              title: const Text('Галерея'),
              onTap: () => Navigator.pop(ctx, ImageSource.gallery),
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text(
          'Верификация',
          style: TextStyle(fontSize: 17, fontWeight: FontWeight.w600),
        ),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        surfaceTintColor: Colors.white,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _buildContent(),
    );
  }

  Widget _buildContent() {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 40),
      children: [
        // Иконка-иллюстрация
        Center(
          child: Container(
            width: 80, height: 80,
            decoration: BoxDecoration(
              color: _stateColor().withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(_stateIcon(), size: 40, color: _stateColor()),
          ),
        ),
        const SizedBox(height: 20),

        // Заголовок и описание
        Text(
          _stateTitle(),
          style: const TextStyle(
            fontSize: 20, fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 8),
        Text(
          _stateSubtitle(),
          style: const TextStyle(fontSize: 14, color: AppColors.textSecondary, height: 1.5),
          textAlign: TextAlign.center,
        ),

        // Причина отклонения
        if (_state == _VerifState.rejected && _rejectionReason != null) ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFFFEF2F2),
              border: Border.all(color: const Color(0xFFFECACA)),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.info_outline, size: 16, color: AppColors.brand),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Причина: $_rejectionReason',
                    style: const TextStyle(fontSize: 13, color: AppColors.brand),
                  ),
                ),
              ],
            ),
          ),
        ],

        // Пояснение (только для not_started и rejected)
        if (_state == _VerifState.notStarted || _state == _VerifState.rejected) ...[
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.04),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Как пройти верификацию',
                  style: TextStyle(
                    fontSize: 14, fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 10),
                _Step(number: '1', text: 'Возьмите удостоверение личности'),
                _Step(number: '2', text: 'Сфотографируйтесь рядом с ним так, чтобы было видно лицо и документ'),
                _Step(number: '3', text: 'Загрузите фото — модератор проверит его в течение 24 часов'),
              ],
            ),
          ),
        ],

        // Ошибка загрузки
        if (_error != null) ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFFEF2F2),
              border: Border.all(color: const Color(0xFFFECACA)),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              _error!,
              style: const TextStyle(fontSize: 13, color: AppColors.brand),
            ),
          ),
        ],

        const SizedBox(height: 28),

        // Кнопка действия
        if (_state == _VerifState.notStarted || _state == _VerifState.rejected)
          FilledButton.icon(
            onPressed: _uploading ? null : _pickAndUpload,
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.primary,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            icon: _uploading
                ? const SizedBox(
                    width: 18, height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : const Icon(Icons.camera_alt_outlined),
            label: Text(
              _uploading ? 'Загружаем...' : 'Загрузить фото',
              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
            ),
          ),
      ],
    );
  }

  Color _stateColor() {
    switch (_state) {
      case _VerifState.active:   return AppColors.success;
      case _VerifState.pending:  return const Color(0xFFF59E0B);
      case _VerifState.rejected: return AppColors.brand;
      case _VerifState.notStarted: return AppColors.textSecondary;
    }
  }

  IconData _stateIcon() {
    switch (_state) {
      case _VerifState.active:   return Icons.verified_outlined;
      case _VerifState.pending:  return Icons.hourglass_top_outlined;
      case _VerifState.rejected: return Icons.cancel_outlined;
      case _VerifState.notStarted: return Icons.badge_outlined;
    }
  }

  String _stateTitle() {
    switch (_state) {
      case _VerifState.active:   return 'Вы верифицированы';
      case _VerifState.pending:  return 'Фото на проверке';
      case _VerifState.rejected: return 'Верификация отклонена';
      case _VerifState.notStarted: return 'Подтвердите личность';
    }
  }

  String _stateSubtitle() {
    switch (_state) {
      case _VerifState.active:
        return 'Ваш аккаунт подтверждён — вы можете принимать лиды.';
      case _VerifState.pending:
        return 'Фото отправлено на проверку модератору.\nОжидайте — мы уведомим вас о результате.';
      case _VerifState.rejected:
        return 'Загрузите новое фото с удостоверением личности.';
      case _VerifState.notStarted:
        return 'Чтобы принимать лиды, подтвердите личность: сфотографируйтесь рядом с удостоверением.';
    }
  }
}

class _Step extends StatelessWidget {
  final String number;
  final String text;
  const _Step({required this.number, required this.text});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 20, height: 20,
            alignment: Alignment.center,
            decoration: const BoxDecoration(
              color: AppColors.textPrimary,
              shape: BoxShape.circle,
            ),
            child: Text(
              number,
              style: const TextStyle(
                fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white,
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(fontSize: 13, color: AppColors.textSecondary, height: 1.4),
            ),
          ),
        ],
      ),
    );
  }
}
