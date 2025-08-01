# 🎥 Guía Visual: Magic API Key - Paso a Paso

## 📸 Screenshots y Proceso Visual

### 🌐 Paso 1: Navegación a 21st.dev

```
🔗 URL: https://21st.dev
👀 Buscar: Botón "Sign Up" o "Get Started"
📍 Ubicación: Esquina superior derecha
```

### 📝 Paso 2: Formulario de Registro

**Lo que verás:**
```
┌─────────────────────────────────┐
│         Sign Up to 21st.dev     │
├─────────────────────────────────┤
│ Email: [___________________]    │
│ Password: [_______________]     │
│ [x] I agree to Terms of Service │
│                                 │
│        [ Sign Up ]              │
└─────────────────────────────────┘
```

**Completa:**
- ✉️ **Email**: tu-email@ejemplo.com
- 🔐 **Password**: MiPasswordSeguro123!
- ☑️ **Acepta** términos y condiciones

### 📧 Paso 3: Verificación de Email

**Email que recibirás:**
```
De: noreply@21st.dev
Asunto: Verify your 21st.dev account

Hola [tu-nombre],

Haz clic aquí para verificar tu cuenta:
[Verify Account] ← CLIC AQUÍ

Este enlace expira en 24 horas.
```

### 🏠 Paso 4: Dashboard Principal

**Después de verificar, verás:**
```
┌─────────────────────────────────────────────┐
│  21st.dev - Magic Console                   │
├─────────────────────────────────────────────┤
│                                             │
│  🎯 Your API Key:                           │
│  ┌─────────────────────────────────────────┐ │
│  │ sk-21st-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx │ │ ← ESTA ES TU API KEY
│  │                              [Copy]     │ │
│  └─────────────────────────────────────────┘ │
│                                             │
│  📊 Usage: 0/5 requests used               │
│  💰 Plan: Free Beta                        │
│                                             │
└─────────────────────────────────────────────┘
```

### 🔑 Paso 5: Copiar API Key

**Identificar tu API Key:**
- 🎯 **Formato**: `sk-21st-` seguido de letras y números
- 📏 **Longitud**: Aproximadamente 50-60 caracteres
- 📍 **Ubicación**: Centro prominente del dashboard
- 🖱️ **Acción**: Clic en botón "Copy" 

### 💻 Paso 6: Instalación en Terminal

**Comando exacto a ejecutar:**
```bash
claude mcp add-json "magic" '{"command":"npx","args":["-y","@smithery/cli@latest","run","@21st-dev/magic-mcp","--config","{\"TWENTY_FIRST_API_KEY\":\"sk-21st-TU_API_KEY_AQUI\"}"]}' 
```

**🔄 Reemplazar:**
- `sk-21st-TU_API_KEY_AQUI` → Tu API key real copiada

### ✅ Paso 7: Verificación Exitosa

**Comando de verificación:**
```bash
claude mcp list
```

**Output esperado:**
```
sequential-thinking: npx -y @modelcontextprotocol/server-sequential-thinking
context7: https://mcp.context7.com/mcp (HTTP)
playwright: npx @playwright/mcp@latest
magic: npx -y @smithery/cli@latest run @21st-dev/magic-mcp ← DEBE APARECER
```

## 🚀 Ejemplo de Uso Inmediato

Una vez instalado, puedes probar:

```bash
# En Claude Code, usar:
/sc:design "Create a modern login form for my Fiverr-like platform"
```

Magic generará automáticamente:
- 📱 Formulario responsivo
- 🎨 Estilos modernos
- ✅ Validación incluida
- 🔐 Campos seguros

## 🎯 Indicadores Visuales de Éxito

### ✅ Registro Exitoso
- Email de confirmación recibido
- Redirección al dashboard
- API key visible en pantalla

### ✅ Instalación Exitosa  
- Comando ejecutado sin errores
- `magic` aparece en `claude mcp list`
- No hay mensajes de error

### ✅ Funcionamiento Correcto
- Comandos `/sc:design` funcionan
- Se generan componentes UI
- No aparecen errores de API key

## 🆘 Indicadores de Problemas

### ❌ Problemas de Registro
```
Error: Email already exists
Solución: Usar otro email o intentar login
```

### ❌ Problemas de API Key
```
Error: Invalid API key format
Solución: Verificar que copiaste completa la key
```

### ❌ Problemas de Instalación
```
Error: Command failed
Solución: Verificar sintaxis del comando
```

## 📞 Contactos de Emergencia

Si algo no funciona:

1. **Revisar email** - Verificación puede tomar unos minutos
2. **Refrescar página** - Dashboard puede tardar en cargar
3. **Borrar cache** - Limpiar cookies del navegador
4. **Intentar incógnito** - Usar ventana privada

## 🎉 ¡Felicitaciones!

Una vez completado este proceso:
- 🏆 **SuperClaude al 100%** 
- 🚀 **Todos los comandos funcionando**
- 🎨 **Generación automática de UI**
- 🇦🇷 **Listo para tu Fiverr argentino**

**Total de tiempo estimado: 5-10 minutos** ⏱️