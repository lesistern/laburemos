# Available Contexts for Claude Code

This directory contains various context files and workflows collected from the awesome-claude-code repository.

## Directory Structure

### 📁 project-management/
Project management workflows from scopecraft/command:
- `01_brainstorm-feature.md` - Brainstorm features with structured approach
- `02_feature-proposal.md` - Create detailed feature proposals
- `03_feature-to-prd.md` - Convert features to Product Requirements Documents
- `04_feature-planning.md` - Plan feature implementation
- `05_implement.md` - Implementation workflow
- `create-command.md` - Create new custom commands

### 📁 workflows/
Context priming workflows from disler/just-prompt:
- `context_prime.md` - Basic context priming
- `context_prime_eza.md` - Enhanced context priming
- `context_prime_w_lead.md` - Context priming with lead
- `jprompt_ultra_diff_review.md` - Ultra diff review workflow
- `project_hello.md` - Project introduction workflow
- `project_hello_w_name.md` - Named project introduction

### 📁 claude-md/
Example CLAUDE.md files from various projects:
- `giselle-CLAUDE.md` - AI agent framework example
- `langgraphjs-CLAUDE.md` - LangGraph JavaScript example
- `edsl-CLAUDE.md` - Expected Parrot EDSL example
- `hash-CLAUDE.md` - Hash platform example

### 📁 blogging/
Blogging platform workflows:
- `view_commands.md` - View available commands

### 📁 superclaude/
Complete SuperClaude Framework v3 - Advanced Claude Code enhancement:
- `commands/` - 17 specialized development commands (sc:implement, sc:analyze, etc.)
- `core/` - Framework foundation (PERSONAS.md, ORCHESTRATOR.md, PRINCIPLES.md)
- `profiles/` - Installation profiles (developer, minimal, quick)
- `config/` - Configuration templates and requirements
- `SUPERCLAUDE_INDEX.md` - Complete framework documentation

### 📁 tooling/
(To be populated with additional tooling contexts)

## Usage

These context files can be used in several ways:

1. **As slash commands**: Copy relevant files to `.claude/commands/` to use as slash commands
2. **As reference**: Read these files to understand best practices for Claude Code
3. **As templates**: Use these as starting points for your own workflows
4. **For context priming**: Use the context_prime workflows to set up Claude with project context

## Quick Start

To use a workflow as a slash command:
```bash
cp workflows/context_prime.md ../.claude/commands/prime.md
```

Then in Claude Code, you can use:
```
/prime
```

## Resources

- [awesome-claude-code repository](https://github.com/hesreallyhim/awesome-claude-code)
- [SuperClaude Framework](https://github.com/SuperClaude-Org/SuperClaude_Framework)
- [Claude Code Documentation](https://docs.anthropic.com/en/docs/claude-code)