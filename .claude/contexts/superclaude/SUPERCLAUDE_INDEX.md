# SuperClaude Framework v3 - Complete Context Collection

This directory contains the complete SuperClaude Framework v3 for enhancing Claude Code capabilities.

## What is SuperClaude Framework?

SuperClaude is a configuration framework that provides:
- **16 specialized development commands** (prefixed with `sc:`)
- **Smart AI personas** for different development domains
- **MCP server integration** capabilities
- **Task management** and workflow optimization
- **Token optimization** for efficient processing

## Directory Structure

### 📁 commands/ (17 files)
Specialized command definitions for development workflows:

**Core Development Commands:**
- `analyze.md` - Code and project analysis
- `build.md` - Project building and compilation
- `design.md` - System design and architecture
- `implement.md` - Feature implementation (2.3KB - detailed)
- `improve.md` - Code improvement and optimization
- `test.md` - Testing strategies and execution

**Project Management:**
- `task.md` - Task management system (6.5KB - comprehensive)
- `workflow.md` - Workflow orchestration (13.3KB - most detailed)
- `estimate.md` - Time and effort estimation
- `document.md` - Documentation generation

**Development Tools:**
- `git.md` - Version control operations
- `cleanup.md` - Code cleanup and refactoring
- `troubleshoot.md` - Problem diagnosis and solving
- `explain.md` - Code explanation and teaching

**Advanced Features:**
- `load.md` - Resource loading and management
- `spawn.md` - Process and task spawning
- `index.md` - Command indexing and navigation

### 📁 core/ (9 files)
Framework foundation and configuration:

**AI Personas & Behavior:**
- `PERSONAS.md` (20.7KB) - Specialized AI personas (architect, frontend, backend, security, etc.)
- `PRINCIPLES.md` (9.5KB) - Core development principles
- `RULES.md` (2.5KB) - Framework operational rules
- `ORCHESTRATOR.md` (22.8KB) - Advanced orchestration system

**System Configuration:**
- `CLAUDE.md` - Claude Code specific settings
- `COMMANDS.md` (5.7KB) - Command system documentation
- `FLAGS.md` (8.9KB) - Command flags and options
- `MODES.md` (13.8KB) - Operating modes (development, production, etc.)
- `MCP.md` (11.6KB) - Model Context Protocol integration

### 📁 profiles/ (3 files)
Installation and usage profiles:
- `developer.json` - Full developer environment
- `minimal.json` - Minimal installation
- `quick.json` - Quick setup profile

### 📁 config/ (2 files)
Configuration templates:
- `features.json` - Available features configuration
- `requirements.json` - System requirements

### 📁 Documentation (3 files)
- `README.md` (12KB) - Complete framework documentation
- `CHANGELOG.md` - Version history and updates
- `CONTRIBUTING.md` - Contribution guidelines

## Key Features

### Smart Command System
All commands are prefixed with `sc:` (SuperClaude):
- `/sc:implement` - Smart implementation with persona routing
- `/sc:analyze` - Deep code analysis
- `/sc:build` - Intelligent build management
- `/sc:workflow` - Advanced workflow orchestration

### AI Personas
The framework includes specialized personas:
- **Architect** - System design and architecture
- **Frontend** - UI/UX and client-side development
- **Backend** - Server-side and API development
- **Security** - Security analysis and hardening
- **DevOps** - Infrastructure and deployment
- **QA** - Testing and quality assurance

### MCP Integration
Model Context Protocol support for:
- External tool integration
- Context7, Sequential, Magic, Playwright
- Custom server implementations

### Workflow Management
Advanced features for:
- Task orchestration and dependency management
- Multi-step development workflows
- Progress tracking and reporting
- Error handling and recovery

## Usage Examples

### As Slash Commands
Copy any command file to your `.claude/commands/` directory:
```bash
cp commands/implement.md ../../commands/sc-implement.md
```

### As Context References
Use the core files for context priming:
- Load `PERSONAS.md` for AI persona definitions
- Reference `PRINCIPLES.md` for development best practices
- Use `WORKFLOW.md` for complex project orchestration

### Profile-based Setup
Choose a profile that matches your needs:
- Use `developer.json` for full-featured development
- Use `minimal.json` for lightweight usage
- Use `quick.json` for rapid prototyping

## Integration with Laburar Project

For the Fiverr-like marketplace project, particularly useful commands:
- `/sc:design` - Design the marketplace architecture
- `/sc:implement` - Implement features with proper persona routing
- `/sc:workflow` - Manage the complex development workflow
- `/sc:task` - Break down large features into manageable tasks

The personas system can help with:
- **Architect**: Overall platform design
- **Backend**: API and database design
- **Frontend**: User interface for freelancers and clients
- **Security**: Payment security and user authentication

## Version Information
- **Version**: 3.0.0 (Initial Release)
- **License**: MIT
- **Python**: 3.8+ required
- **Status**: Some features in development, hooks system planned for v4

## Resources
- [SuperClaude Framework Repository](https://github.com/SuperClaude-Org/SuperClaude_Framework)
- [Installation Guide](README.md)
- [Contributing Guidelines](CONTRIBUTING.md)