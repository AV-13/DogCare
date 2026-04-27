#!/usr/bin/env bash
# Bootstrap a fresh Ubuntu 24.04 VM as the DogCare frontend host.
# Idempotent.
#
# Required env vars (passed by deploy.sh):
#   BACKEND_HOST, API_PORT
set -euo pipefail

WEB_DIR="/var/www/dogcare/dist"

echo "▶ Updating apt caches…"
sudo apt-get update -qq
sudo apt-get install -y -qq nginx rsync

echo "▶ Preparing web root…"
sudo mkdir -p "$WEB_DIR"
sudo chown -R "$USER:$USER" /var/www/dogcare

echo "▶ Installing nginx site config…"
# /tmp/nginx-frontend.conf is uploaded by deploy.sh, with placeholders substituted.
sudo cp /tmp/nginx-frontend.conf /etc/nginx/sites-available/dogcare
sudo ln -sf /etc/nginx/sites-available/dogcare /etc/nginx/sites-enabled/dogcare
sudo rm -f /etc/nginx/sites-enabled/default

echo "▶ Validating nginx config…"
sudo nginx -t

echo "▶ Configuring UFW firewall (SSH + HTTP)…"
sudo ufw --force reset >/dev/null
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw --force enable

echo "▶ Starting nginx…"
sudo systemctl enable nginx
sudo systemctl reload nginx || sudo systemctl start nginx

echo "✓ Frontend VM provisioned."
echo "  Static site will appear once dist/ is rsynced — run the Jenkins frontend job or:"
echo "    rsync -av --delete client/dist/ azureuser@<host>:/var/www/dogcare/dist/"
