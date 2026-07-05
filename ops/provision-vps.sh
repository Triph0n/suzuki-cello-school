#!/bin/sh
set -eu

if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  echo "Docker and Compose are already available."
  exit 0
fi

if command -v apt-get >/dev/null 2>&1; then
  sudo apt-get update
  sudo apt-get install -y ca-certificates curl gnupg
  sudo install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  sudo chmod a+r /etc/apt/keyrings/docker.gpg
  . /etc/os-release
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
  sudo apt-get update
  sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
elif command -v dnf >/dev/null 2>&1; then
  sudo dnf install -y dnf-plugins-core
  sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
  sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  sudo systemctl enable --now docker
else
  echo "Unsupported Linux distribution. Install Docker and Docker Compose manually." >&2
  exit 1
fi

sudo systemctl enable --now docker
sudo usermod -aG docker "$USER" || true

if command -v firewall-cmd >/dev/null 2>&1 && sudo systemctl is-active --quiet firewalld; then
  sudo firewall-cmd --permanent --add-service=http
  sudo firewall-cmd --permanent --add-service=https
  sudo firewall-cmd --reload
fi

echo "Docker is installed. You may need to reconnect SSH before running docker without sudo."
