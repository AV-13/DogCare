#!/usr/bin/env bash
# One-shot bootstrap from your local machine.
# Run once after creating the VMs; rerunning is safe (idempotent).
#
# Usage:
#   cp infra/.env.deploy.example infra/.env.deploy
#   # …edit infra/.env.deploy with real values
#   bash infra/deploy.sh
#
# Note: uses tar over ssh instead of rsync so it works in plain Git Bash on
# Windows without extra dependencies.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f infra/.env.deploy ]]; then
  echo "✗ infra/.env.deploy missing — copy from .env.deploy.example first." >&2
  exit 1
fi

# shellcheck disable=SC1091
set -a
. ./infra/.env.deploy
set +a

: "${BACKEND_HOST:?missing in .env.deploy}"
: "${FRONTEND_HOST:?missing in .env.deploy}"
: "${SSH_USER:?missing}"
: "${BACKEND_KEY:?missing}"
: "${FRONTEND_KEY:?missing}"
: "${JWT_SECRET:?missing}"
: "${DB_PASSWORD:?missing}"
: "${API_PORT:=3000}"

chmod 600 "$BACKEND_KEY" "$FRONTEND_KEY" 2>/dev/null || true

SSH_OPTS="-o StrictHostKeyChecking=accept-new -o IdentitiesOnly=yes"
SSH_BACK="ssh $SSH_OPTS -i $BACKEND_KEY $SSH_USER@$BACKEND_HOST"
SSH_FRONT="ssh $SSH_OPTS -i $FRONTEND_KEY $SSH_USER@$FRONTEND_HOST"
SCP_BACK="scp $SSH_OPTS -i $BACKEND_KEY"
SCP_FRONT="scp $SSH_OPTS -i $FRONTEND_KEY"

echo "════════ BACKEND VM ($BACKEND_HOST) ════════"

echo "▶ Pushing infra files…"
$SSH_BACK 'sudo mkdir -p /srv/dogcare-db && sudo chown $USER:$USER /srv/dogcare-db'
$SCP_BACK infra/docker-compose.prod.yml \
          infra/dogcare-api.service \
          server/src/db/init.sql \
          infra/provision-backend.sh \
          "$SSH_USER@$BACKEND_HOST:/srv/dogcare-db/"

echo "▶ Running provision-backend.sh on the VM…"
$SSH_BACK "DB_PASSWORD='$DB_PASSWORD' JWT_SECRET='$JWT_SECRET' API_PORT='$API_PORT' bash /srv/dogcare-db/provision-backend.sh"

echo "▶ Initial backend code sync (tar over ssh)…"
tar -czf - \
  --exclude='node_modules' \
  --exclude='uploads/dogs/*' \
  --exclude='uploads/sample-dogs' \
  --exclude='.env' --exclude='.env.test' \
  --exclude='tests' --exclude='scripts' --exclude='coverage' \
  -C server . \
  | $SSH_BACK 'sudo mkdir -p /srv/dogcare-api/uploads/dogs \
               && sudo chown -R $USER:$USER /srv/dogcare-api \
               && tar -xzf - -C /srv/dogcare-api'

echo "▶ Installing prod deps + (re)starting API…"
$SSH_BACK 'cd /srv/dogcare-api && npm ci --omit=dev && sudo systemctl restart dogcare-api && sleep 2 && sudo systemctl is-active dogcare-api'

echo
echo "════════ FRONTEND VM ($FRONTEND_HOST) ════════"

echo "▶ Substituting backend host in nginx template…"
TMP_NGINX=$(mktemp)
sed -e "s|{{BACKEND_HOST}}|$BACKEND_HOST|g" \
    -e "s|{{API_PORT}}|$API_PORT|g" \
    infra/nginx-frontend.conf.template > "$TMP_NGINX"

echo "▶ Pushing config + provisioner…"
$SCP_FRONT "$TMP_NGINX" "$SSH_USER@$FRONTEND_HOST:/tmp/nginx-frontend.conf"
$SCP_FRONT infra/provision-frontend.sh "$SSH_USER@$FRONTEND_HOST:/tmp/"
rm "$TMP_NGINX"

echo "▶ Running provision-frontend.sh on the VM…"
$SSH_FRONT "BACKEND_HOST='$BACKEND_HOST' API_PORT='$API_PORT' bash /tmp/provision-frontend.sh"

echo "▶ Building frontend locally…"
( cd client && npm ci && npm run build )

echo "▶ Initial frontend dist sync (tar over ssh)…"
tar -czf - -C client/dist . \
  | $SSH_FRONT 'sudo rm -rf /var/www/dogcare/dist/* \
                && sudo chown -R $USER:$USER /var/www/dogcare \
                && tar -xzf - -C /var/www/dogcare/dist'

$SSH_FRONT 'sudo systemctl reload nginx'

echo
echo "════════════════════════════════════════════"
echo "✓ Done."
echo "  Frontend  → http://$FRONTEND_HOST"
echo "  Backend   → http://$BACKEND_HOST:$API_PORT/api/auth/login (test)"
echo "════════════════════════════════════════════"
