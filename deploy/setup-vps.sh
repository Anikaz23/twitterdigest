#!/bin/bash
set -e

echo "========================================="
echo "  Twitter Digest VPS Setup"
echo "========================================="

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    SUDO="sudo"
else
    SUDO=""
fi

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    echo "Cannot detect OS. Please install Docker manually."
    exit 1
fi

echo "Detected OS: $OS"

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."

    case $OS in
        ubuntu|debian)
            $SUDO apt-get update
            $SUDO apt-get install -y ca-certificates curl gnupg
            $SUDO install -m 0755 -d /etc/apt/keyrings
            curl -fsSL https://download.docker.com/linux/$OS/gpg | $SUDO gpg --dearmor -o /etc/apt/keyrings/docker.gpg
            $SUDO chmod a+r /etc/apt/keyrings/docker.gpg
            echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/$OS $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | $SUDO tee /etc/apt/sources.list.d/docker.list > /dev/null
            $SUDO apt-get update
            $SUDO apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
            ;;
        centos|rhel|fedora|ol)
            $SUDO yum install -y yum-utils
            $SUDO yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
            $SUDO yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
            $SUDO systemctl start docker
            $SUDO systemctl enable docker
            ;;
        *)
            echo "Unsupported OS: $OS"
            echo "Please install Docker manually: https://docs.docker.com/engine/install/"
            exit 1
            ;;
    esac

    # Add current user to docker group
    $SUDO usermod -aG docker $USER || true
    echo "Docker installed successfully!"
else
    echo "Docker is already installed."
fi

# Clone or update repository
REPO_DIR="$HOME/twitterdigest"

if [ -d "$REPO_DIR" ]; then
    echo "Updating existing installation..."
    cd "$REPO_DIR"
    git pull origin main || true
else
    echo "Cloning repository..."
    # Replace with your actual repo URL
    git clone https://github.com/YOUR_USERNAME/twitterdigest.git "$REPO_DIR" || {
        echo "Repository not found. Creating local directory..."
        mkdir -p "$REPO_DIR"
    }
fi

cd "$REPO_DIR/deploy"

# Check for .env file
if [ ! -f .env ]; then
    echo ""
    echo "========================================="
    echo "  IMPORTANT: Create your .env file"
    echo "========================================="
    echo ""
    echo "Copy .env.example to .env and add your Anthropic API key:"
    echo ""
    echo "  cp .env.example .env"
    echo "  nano .env"
    echo ""
    echo "Then run:"
    echo ""
    echo "  docker compose up -d"
    echo ""
    exit 0
fi

# Start containers
echo "Starting containers..."
docker compose up -d --build

echo ""
echo "========================================="
echo "  Setup Complete!"
echo "========================================="
echo ""
echo "Dashboard: http://$(hostname -I | awk '{print $1}'):3000"
echo ""
echo "Commands:"
echo "  View logs:    docker compose logs -f"
echo "  Stop:         docker compose down"
echo "  Restart:      docker compose restart"
echo ""
