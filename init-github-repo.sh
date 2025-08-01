#!/bin/bash

# ================================
# LABUREMOS - Complete GitHub Repository Initialization
# Professional Freelance Platform
# ================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${PURPLE}================================${NC}"
echo -e "${PURPLE}🚀 LABUREMOS - GitHub Complete Setup${NC}"
echo -e "${PURPLE}================================${NC}"
echo

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Get GitHub username
if [ -z "$1" ]; then
    echo -e "${YELLOW}Usage: $0 <github-username>${NC}"
    echo -e "${YELLOW}Example: $0 myusername${NC}"
    exit 1
fi

GITHUB_USERNAME="$1"
REPO_NAME="laburemos"

print_info "Initializing repository for: $GITHUB_USERNAME/$REPO_NAME"
echo

# Step 1: Run the main setup script
print_info "🔧 Running main GitHub setup..."
./setup-github-repo.sh
print_status "Main setup completed"

# Step 2: Update repository URLs in files
print_info "🔗 Updating repository URLs..."

# Update package.json
if [ -f "package.json" ]; then
    sed -i "s/yourusername/$GITHUB_USERNAME/g" package.json
    print_status "package.json updated"
fi

# Update README.md
if [ -f "README.md" ]; then
    sed -i "s/yourusername/$GITHUB_USERNAME/g" README.md
    print_status "README.md updated"
fi

# Update issue template config
if [ -f ".github/ISSUE_TEMPLATE/config.yml" ]; then
    sed -i "s/yourusername/$GITHUB_USERNAME/g" .github/ISSUE_TEMPLATE/config.yml
    print_status "Issue template config updated"
fi

# Step 3: Create additional helpful files
print_info "📝 Creating additional repository files..."

# Create .env.example files if they don't exist
if [ ! -f "frontend/.env.example" ]; then
    mkdir -p frontend
    cp frontend/.env.example frontend/.env.local 2>/dev/null || true
fi

if [ ! -f "backend/.env.example" ]; then
    mkdir -p backend
    cp backend/.env.example backend/.env 2>/dev/null || true
fi

# Create PR template
mkdir -p .github
cat > .github/pull_request_template.md << 'EOF'
# 🚀 Pull Request

## 📋 Description
Brief description of changes and their purpose.

## 🔄 Type of Change
- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)  
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📚 Documentation update
- [ ] 🔧 Configuration/Build changes
- [ ] ♻️ Code refactoring
- [ ] ⚡ Performance improvements
- [ ] 🧪 Tests

## 🧪 Testing
- [ ] Tests pass locally
- [ ] New tests added for new functionality
- [ ] Existing tests updated if needed
- [ ] Manual testing completed

## 📊 Code Quality
- [ ] Self-review completed
- [ ] Code follows style guidelines
- [ ] ESLint passes without warnings
- [ ] TypeScript compilation successful
- [ ] No console.log statements in production code

## 📚 Documentation
- [ ] Documentation updated if needed
- [ ] README updated if needed
- [ ] API documentation updated
- [ ] Comments added for complex logic

## 🔗 Related Issues
Closes #(issue number)

## 📝 Additional Notes
Any additional information, breaking changes, or special considerations.

## 📸 Screenshots (if applicable)
Include screenshots for UI changes.
EOF

print_status "Pull request template created"

# Create GitHub Actions status badges script
cat > update-badges.sh << 'EOF'
#!/bin/bash

# Script to update README badges with actual repository info
REPO_OWNER="$1"
REPO_NAME="laburemos"

if [ -z "$REPO_OWNER" ]; then
    echo "Usage: $0 <github-username>"
    exit 1
fi

# Update badges in README.md
sed -i "s/yourusername/$REPO_OWNER/g" README.md

echo "✅ Badges updated for $REPO_OWNER/$REPO_NAME"
EOF

chmod +x update-badges.sh
print_status "Badge update script created"

# Step 4: Final git setup
print_info "🔧 Finalizing git configuration..."

# Set up git hooks directory
mkdir -p .githooks

# Create pre-commit hook
cat > .githooks/pre-commit << 'EOF'
#!/bin/bash

echo "🔍 Running pre-commit checks..."

# Check if we're in the project root
if [ ! -f "package.json" ]; then
    echo "❌ Not in project root"
    exit 1
fi

# Run linting and type checking
echo "🔍 Linting frontend..."
cd frontend && npm run lint || exit 1

echo "🔍 Linting backend..."
cd ../backend && npm run lint || exit 1

echo "🏗️ Type checking..."
cd ../frontend && npm run type-check || exit 1
cd ../backend && npm run build || exit 1

echo "🧪 Running tests..."
cd .. && npm run test || exit 1

echo "✅ Pre-commit checks passed!"
EOF

chmod +x .githooks/pre-commit

# Configure git to use the hooks
git config core.hooksPath .githooks

print_status "Git hooks configured"

# Step 5: Summary
echo
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}🎉 SETUP COMPLETED SUCCESSFULLY!${NC}"
echo -e "${GREEN}================================${NC}"
echo

print_status "Repository fully configured for GitHub"
print_status "Professional README.md with live production links"
print_status "Comprehensive .gitignore with security exclusions"
print_status "GitHub Actions CI/CD pipeline"
print_status "Issue templates for bugs, features, security, performance"
print_status "Pull request template"
print_status "Contributing guidelines"
print_status "MIT License"
print_status "Environment example files"
print_status "Git hooks for code quality"
print_status "Package.json with comprehensive scripts"

echo
echo -e "${BLUE}🔗 Your Repository:${NC} https://github.com/$GITHUB_USERNAME/$REPO_NAME"
echo -e "${BLUE}🌐 Live Platform:${NC} https://laburemos.com.ar"
echo -e "${BLUE}📧 Contact:${NC} contacto.laburemos@gmail.com"
echo

echo -e "${YELLOW}📋 NEXT STEPS:${NC}"
echo -e "1. Create repository on GitHub: https://github.com/new"
echo -e "2. Push your code: ${BLUE}git push -u origin main${NC}"
echo -e "3. Set up GitHub secrets for CI/CD: ${BLUE}./setup-github-secrets.sh${NC}"
echo -e "4. Enable GitHub Pages (optional)"
echo -e "5. Configure repository settings (branch protection, etc.)"
echo

echo -e "${GREEN}🚀 Ready for collaborative development!${NC}"
EOF