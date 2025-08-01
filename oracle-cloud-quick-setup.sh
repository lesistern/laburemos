#!/bin/bash
# Quick Setup Script for Oracle Cloud Development Environment
# For Ubuntu 22.04 LTS

echo "🚀 Oracle Cloud Development Environment Setup"
echo "==========================================="

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install desktop environment
echo "🖥️ Installing XFCE desktop environment..."
sudo apt install -y xfce4 xfce4-goodies

# Install RDP
echo "🔌 Setting up Remote Desktop (RDP)..."
sudo apt install -y xrdp
sudo systemctl enable xrdp
sudo adduser xrdp ssl-cert
echo "xfce4-session" > ~/.xsession
sudo service xrdp restart

# Install development tools
echo "🛠️ Installing development tools..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git build-essential curl wget unzip software-properties-common

# Install Claude Code
echo "🤖 Installing Claude Code CLI..."
sudo npm install -g @anthropic-ai/claude-code

# Download and setup Cursor
echo "📝 Setting up Cursor IDE..."
mkdir -p ~/Downloads ~/.local/share/applications
cd ~/Downloads
wget https://downloader.cursor.sh/linux/appImage/x64 -O cursor.AppImage
chmod +x cursor.AppImage

# Create desktop entry for Cursor
cat > ~/.local/share/applications/cursor.desktop << EOF
[Desktop Entry]
Name=Cursor
Exec=$HOME/Downloads/cursor.AppImage
Icon=cursor
Type=Application
Categories=Development;
EOF

# Install XAMPP
echo "🌐 Installing XAMPP..."
cd ~/Downloads
wget -O xampp-installer.run "https://sourceforge.net/projects/xampp/files/XAMPP%20Linux/8.2.12/xampp-linux-x64-8.2.12-0-installer.run/download"
chmod +x xampp-installer.run
echo "Please run: sudo ./xampp-installer.run"

# Configure firewall
echo "🔒 Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 3389/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000:3010/tcp
sudo ufw allow 5000:5010/tcp
sudo ufw allow 8080:8090/tcp
echo "y" | sudo ufw enable

# Create development user
echo "👤 Creating development user..."
sudo adduser --gecos "" developer
sudo usermod -aG sudo developer
echo "xfce4-session" | sudo tee /home/developer/.xsession
sudo chown developer:developer /home/developer/.xsession

# Performance optimizations
echo "⚡ Applying performance optimizations..."
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
echo 'fs.inotify.max_user_watches=524288' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Run: sudo ~/Downloads/xampp-installer.run"
echo "2. Set password for developer user: sudo passwd developer"
echo "3. Connect via RDP to [YOUR-IP]:3389"
echo "4. Set ANTHROPIC_API_KEY environment variable"
echo ""
echo "To start XAMPP: sudo /opt/lampp/lampp start"
echo "To start Cursor: ~/Downloads/cursor.AppImage"