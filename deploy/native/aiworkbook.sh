#!/usr/bin/env bash
# Runs AI Project Workbook on a server without Docker (see DEPLOY.md, "Server senza Docker").
#
#   aiworkbook.sh serve     migrations, then the web server on 0.0.0.0:${PORT:-8000} (systemd)
#   aiworkbook.sh cleanup   daily retention clean-up (cron)
#   aiworkbook.sh update    as root: git pull, dependencies, frontend build, restart
#
# Settings come from deploy/.env, which never goes into git.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ENV_FILE="$ROOT/deploy/.env"
[ -f "$ENV_FILE" ] || { echo "Missing $ENV_FILE (copy deploy/native/env.example)" >&2; exit 1; }
set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a
export APP_FRONTEND_DIST="${APP_FRONTEND_DIST:-$ROOT/frontend/dist}"
cd "$ROOT/backend"

case "${1:-}" in
  serve)
    uv run --frozen --no-dev alembic upgrade head
    # Nginx Proxy Manager runs in Docker: requests reach us from the Docker bridge, so we listen
    # on every interface (the port is closed from the internet by iptables) and trust the
    # visitor address only from Docker networks. No access log: ours masks shared-link tokens.
    exec uv run --frozen --no-dev uvicorn app.main:app \
      --host 0.0.0.0 --port "${PORT:-8000}" \
      --proxy-headers --forwarded-allow-ips "${TRUSTED_PROXIES:-172.16.0.0/12}" \
      --no-access-log
    ;;
  cleanup)
    exec uv run --frozen --no-dev python -m app.cli cleanup
    ;;
  update)
    [ "$(id -u)" -eq 0 ] || { echo "Run the update as root." >&2; exit 1; }
    as_app() { sudo -u aiworkbook -H "$@"; }
    as_app git -C "$ROOT" pull --ff-only
    as_app uv sync --frozen --no-dev
    # Node lives in root's conda environment, used only to build the frontend.
    cd "$ROOT/frontend"
    ${NPM:-conda run -n aiworkbook-node npm} ci --no-audit --no-fund
    ${NPM:-conda run -n aiworkbook-node npm} run build
    chown -R aiworkbook:aiworkbook "$ROOT"
    systemctl restart aiworkbook
    echo "Updated and restarted: journalctl -u aiworkbook -n 20"
    ;;
  *)
    echo "usage: $0 serve|cleanup|update" >&2
    exit 2
    ;;
esac
