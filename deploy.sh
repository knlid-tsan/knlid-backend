#!/usr/bin/env bash
# Деплой kn.lid на прод-сервере: git pull → сборка api+admin → миграции →
# рестарт сервисов → health-check. При любой ошибке — откат кода на прежний
# коммит, пересборка и рестарт. Миграции БД при откате НЕ отменяются
# (они пишутся обратно-совместимыми); перед рискованными релизами делайте
# дамп: pg_dump -Fc knlid_prod.
#
# Запуск на сервере: ~/knlid-backend/deploy.sh
set -euo pipefail

main() {
  cd "$HOME/knlid-backend"

  PREV=$(git rev-parse HEAD)
  echo "== Деплой kn.lid, текущий коммит: $(git log --oneline -1)"

  rollback() {
    echo "!!! ОШИБКА ДЕПЛОЯ — откатываюсь на $PREV"
    git reset --hard "$PREV"
    (cd api && npm ci && npm run build) || true
    (cd admin && npm ci && npm run build) || true
    sudo -n systemctl restart knlid-api knlid-admin || true
    sleep 10
    echo "Статус после отката: api=$(systemctl is-active knlid-api), admin=$(systemctl is-active knlid-admin)"
    echo "Откат кода выполнен. Миграции БД не отменялись — проверьте вручную."
    exit 1
  }
  trap rollback ERR

  git pull --ff-only

  echo "== API: зависимости, сборка, миграции"
  (cd api && npm ci && npm run build && npm run migration:run)

  echo "== Admin: зависимости, сборка"
  (cd admin && npm ci && npm run build)

  echo "== Рестарт сервисов"
  sudo -n systemctl restart knlid-api
  sudo -n systemctl restart knlid-admin

  echo "== Health-check"
  api_ok=""
  for _ in $(seq 1 12); do
    sleep 5
    code=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/banks || true)
    if [ "$code" = "200" ]; then api_ok=1; break; fi
  done
  if [ -z "$api_ok" ]; then
    echo "API не отвечает 200 на /banks за 60 сек"
    false
  fi

  code=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/login || true)
  if [ "$code" != "200" ]; then
    echo "Админка не отвечает 200 на /login (код $code)"
    false
  fi

  trap - ERR
  echo "✓ Деплой успешен: $(git log --oneline -1)"
}

main "$@"
exit $?
