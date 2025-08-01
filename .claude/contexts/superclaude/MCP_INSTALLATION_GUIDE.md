# SuperClaude MCP Servers Installation Guide

Esta guía te ayudará a instalar todos los servidores MCP requeridos por SuperClaude Framework v3.

## ✅ Verificación de Prerequisitos

**Estado actual:**
- Claude CLI: v1.0.53 ✅
- Node.js: v20.19.3 ✅ (requerido: 16.0.0+)
- npm: v11.4.2 ✅

## 🎯 Servidores MCP Requeridos

SuperClaude Framework requiere estos 4 servidores MCP:

1. **Context7** - Documentación oficial de librerías en tiempo real
2. **Sequential** - Análisis complejo y pensamiento sistemático
3. **Magic** - Generación de componentes UI modernos (21st.dev)
4. **Playwright** - Automatización de navegador y testing E2E

## 📦 Instalación Paso a Paso

### 1. Context7 MCP Server

**Propósito:** Documentación oficial actualizada de librerías y frameworks.

**Instalación:**
```bash
# Método recomendado para Claude Code
claude mcp add --transport http context7 https://mcp.context7.com/mcp
```

**Uso:**
- Incluye `use context7` en cualquier prompt donde necesites documentación actualizada
- Ejemplo: "Create a Next.js 14 project with routing. use context7"

**Verificación:**
```bash
claude mcp list
```

---

### 2. Sequential MCP Server

**Propósito:** Análisis sistemático y resolución de problemas complejos paso a paso.

**Instalación:**
```bash
# Instalar el paquete globalmente
npm install -g @modelcontextprotocol/server-sequential-thinking

# Registrar en Claude Code
claude mcp add sequential-thinking -s user -- npx -y @modelcontextprotocol/server-sequential-thinking
```

**Características:**
- Pensamiento estructurado para problemas complejos
- Análisis arquitectónico sistemático
- Debugging paso a paso

---

### 3. Magic MCP Server (21st.dev)

**Propósito:** Generación de componentes UI modernos con IA.

**Prerequisitos:**
1. Crear cuenta en [21st.dev](https://21st.dev)
2. Obtener API key

**Instalación:**
```bash
# Reemplaza "your-api-key" con tu clave real de 21st.dev
claude mcp add-json "magic" '{"command":"npx","args":["-y","@smithery/cli@latest","run","@21st-dev/magic-mcp","--config","{\"TWENTY_FIRST_API_KEY\":\"your-api-key\"}"]}' 
```

**Características:**
- Generación de componentes React/Vue/Angular
- Integración con design systems
- Preview en tiempo real

---

### 4. Playwright MCP Server

**Propósito:** Automatización de navegadores y testing E2E.

**Instalación:**
```bash
# Método oficial de Microsoft
claude mcp add @playwright/mcp@latest
```

**Características:**
- Automatización de navegadores (Chrome, Firefox, Safari, Edge)
- Testing E2E visual
- Métricas de rendimiento
- Snapshots de accesibilidad

**Uso:**
- "Use playwright mcp to open browser to example.com"
- "Test the login flow with playwright mcp"

## 🔧 Comandos de Verificación

Después de instalar todos los servidores:

```bash
# Listar todos los servidores MCP instalados
claude mcp list

# Verificar configuración específica
cat ~/.claude.json

# Test básico de cada servidor
claude --help mcp
```

## 📋 Configuración Avanzada

### Variables de Entorno Opcionales

```bash
# Para Context7 (opcional)
export CONTEXT7_API_KEY="your-context7-key"

# Para Magic (requerido)
export TWENTY_FIRST_API_KEY="your-21st-dev-key"

# Para configuraciones específicas
export CLAUDE_MCP_CONFIG_DIR="~/.claude/mcp"
```

### Configuración Manual (Alternativa)

Si prefieres configurar manualmente, edita `~/.claude.json`:

```json
{
  "projects": {
    "/mnt/c/xampp/htdocs/Laburar": {
      "mcpServers": {
        "context7": {
          "transport": "http",
          "url": "https://mcp.context7.com/mcp"
        },
        "sequential-thinking": {
          "command": "npx",
          "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
        },
        "magic": {
          "command": "npx",
          "args": ["-y", "@smithery/cli@latest", "run", "@21st-dev/magic-mcp", "--config", "{\"TWENTY_FIRST_API_KEY\":\"your-api-key\"}"]
        },
        "playwright": {
          "command": "npx",
          "args": ["@playwright/mcp@latest"]
        }
      }
    }
  }
}
```

## 🎮 Uso con SuperClaude

Una vez instalados, los comandos de SuperClaude harán uso automático de estos servidores:

- `/sc:implement` - Usará Context7 para patrones, Magic para UI, Sequential para planificación
- `/sc:analyze` - Usará Sequential para análisis profundo, Context7 para mejores prácticas
- `/sc:test` - Usará Playwright para testing automatizado
- `/sc:design` - Usará Magic para componentes UI, Sequential para arquitectura

## 🚨 Solución de Problemas

### Error: "MCP server not found"
```bash
# Reinstalar el servidor problemático
claude mcp remove <server-name>
claude mcp add <server-name> <configuration>
```

### Error: "API key invalid"
```bash
# Verificar variables de entorno
echo $TWENTY_FIRST_API_KEY
echo $CONTEXT7_API_KEY
```

### Error: "Node.js version"
```bash
# Verificar versión de Node.js
node --version
# Debe ser >= 16.0.0
```

### Error: "Permission denied"
```bash
# Dar permisos al directorio de configuración
chmod -R 755 ~/.claude/
```

## 📊 Estado de Funcionalidad

| Servidor | Estado | Funcionalidad | Comandos Afectados |
|----------|--------|---------------|-------------------|
| Context7 | ✅ **INSTALADO** | Documentación actualizada | implement, analyze, improve |
| Sequential | ✅ **INSTALADO** | Análisis sistemático | analyze, workflow, task |
| Magic | ✅ **INSTALADO** | Generación UI | design, implement (UI) |
| Playwright | ✅ **INSTALADO** | Testing automatizado | test, troubleshoot |

**🎉 PROGRESO: 4/4 servidores instalados (100% COMPLETO)**

## 🎯 Estado de Instalación - ¡COMPLETADO!

1. ✅ **Context7 INSTALADO** - Documentación en tiempo real disponible
2. ✅ **Sequential INSTALADO** - Análisis sistemático disponible  
3. ✅ **Playwright INSTALADO** - Testing automatizado disponible
4. ✅ **Magic INSTALADO** - Generación de UI con IA disponible

**🚀 SuperClaude Framework está 100% FUNCIONAL** y completamente listo para desarrollar tu plataforma tipo Fiverr para Argentina con todas las capacidades avanzadas:

- 📚 **Documentación automática** (Context7)
- 🧠 **Análisis sistemático** (Sequential)
- 🎨 **Generación de UI moderna** (Magic)
- 🧪 **Testing automatizado** (Playwright)

### 🎉 ¡Instalación Completada Exitosamente!
Todos los servidores MCP de SuperClaude están operativos. Puedes comenzar a usar comandos como:
- `/sc:implement` - Implementación inteligente con UI
- `/sc:design` - Diseño automático de componentes
- `/sc:analyze` - Análisis profundo del código
- `/sc:test` - Testing automatizado completo

## 📚 Recursos

- [Context7 Documentation](https://github.com/upstash/context7)
- [Sequential MCP Server](https://github.com/modelcontextprotocol/server-sequential-thinking)
- [Magic 21st.dev](https://github.com/21st-dev/magic-mcp)
- [Playwright MCP](https://github.com/microsoft/playwright-mcp)
- [Claude Code MCP Docs](https://docs.anthropic.com/en/docs/claude-code/mcp)