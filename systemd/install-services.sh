#!/usr/bin/env bash
# Installs and enables the dggi-cms + cloudflare-tunnel systemd services.
# Run this on the Ubuntu server (with sudo) from anywhere, e.g.:
#   sudo bash /home/acer/dggi-cms/systemd/install-services.sh
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "Run this with sudo." >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cp "$SCRIPT_DIR/dggi-cms.service" /etc/systemd/system/dggi-cms.service
cp "$SCRIPT_DIR/cloudflare-tunnel.service" /etc/systemd/system/cloudflare-tunnel.service

systemctl daemon-reload
systemctl enable --now dggi-cms.service
systemctl enable --now cloudflare-tunnel.service

echo "Done. Check status with:"
echo "  systemctl status dggi-cms.service"
echo "  systemctl status cloudflare-tunnel.service"
echo "Logs:"
echo "  journalctl -u dggi-cms.service -f"
echo "  journalctl -u cloudflare-tunnel.service -f"
