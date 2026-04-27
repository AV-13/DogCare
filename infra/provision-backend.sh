#!/usr/bin/env bash
# Bootstrap a fresh Ubuntu 24.04 VM as the DogCare backend host.
# Idempotent: rerunning is safe.
#
# Required env vars (passed by deploy.sh):
#   DB_PASSWORD, JWT_SECRET, API_PORT
set -euo pipefail

REPO_DIR="/srv/dogcare-api"
DB_DIR="/srv/dogcare-db"

echo "▶ Updating apt caches…"
sudo apt-get update -qq
sudo apt-get install -y -qq curl ca-certificates gnupg rsync

echo "▶ Installing Node.js 20…"
if ! command -v node >/dev/null || [[ "$(node -v)" != v20* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y -qq nodejs
fi

echo "▶ Installing Docker…"
if ! command -v docker >/dev/null; then
  sudo install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg --yes
  sudo chmod a+r /etc/apt/keyrings/docker.gpg
  CODENAME="$(. /etc/os-release && echo $VERSION_CODENAME)"
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
        https://download.docker.com/linux/ubuntu $CODENAME stable" \
    | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
  sudo apt-get update -qq
  sudo apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
  sudo usermod -aG docker "$USER"
fi

echo "▶ Preparing directories…"
sudo mkdir -p "$REPO_DIR" "$REPO_DIR/uploads/dogs" "$DB_DIR"
sudo chown -R "$USER:$USER" "$REPO_DIR" "$DB_DIR"

echo "▶ Writing API .env…"
cat > "$REPO_DIR/.env" <<EOF
PORT=${API_PORT}
NODE_ENV=production

DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=dogcare
DB_USER=postgres
DB_PASSWORD=${DB_PASSWORD}

JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=24h
EOF
chmod 600 "$REPO_DIR/.env"

echo "▶ Starting Postgres via docker compose…"
# init.sql + compose file are pushed by deploy.sh into $DB_DIR
cd "$DB_DIR"
DB_PASSWORD="${DB_PASSWORD}" sudo -E docker compose -f docker-compose.prod.yml up -d

echo "▶ Installing systemd unit dogcare-api.service…"
sudo cp "$DB_DIR/dogcare-api.service" /etc/systemd/system/dogcare-api.service
sudo systemctl daemon-reload
sudo systemctl enable dogcare-api.service

echo "▶ Configuring UFW firewall (SSH + API port)…"
sudo ufw --force reset >/dev/null
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow ${API_PORT}/tcp
sudo ufw --force enable

echo "✓ Backend VM provisioned."
echo "  API will start once code is rsynced — run the Jenkins backend job or:"
echo "    rsync -av server/ azureuser@<host>:/srv/dogcare-api/"
echo "    ssh azureuser@<host> 'cd /srv/dogcare-api && npm ci --omit=dev && sudo systemctl restart dogcare-api'"
