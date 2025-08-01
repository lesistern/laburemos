# 🪄 Guía Completa: Obtener API Key de Magic (21st.dev)

Esta guía te ayudará paso a paso para obtener tu API key de Magic y completar la instalación de SuperClaude Framework.

## 📋 Proceso de Registro en 21st.dev

### Paso 1: Crear Cuenta
1. **Visita** [21st.dev](https://21st.dev)
2. **Busca** el botón "Sign Up" en la página principal
3. **Completa** el formulario simple:
   - ✉️ Email (usa tu email principal)
   - 🔐 Password (crea una contraseña segura)
4. **Envía** el formulario

### Paso 2: Verificación de Email
1. **Revisa** tu bandeja de entrada (llegará en segundos)
2. **Busca** email de confirmación de 21st.dev
3. **Haz clic** en el enlace de activación
4. ✅ Tu cuenta está activada

### Paso 3: Acceder al Dashboard
1. **Inicia sesión** en [21st.dev](https://21st.dev)
2. **Navega** al [Magic Console](https://21st.dev/magic/console)
3. 🎯 **Encuentra** tu API key en el dashboard principal
4. **Copia** la API key (aparece prominentemente en el centro)

## 💰 Plan Gratuito vs Pagado

### 🆓 Plan Gratuito (Beta)
- **5 requests gratuitos** para probar el servicio
- **Acceso completo** durante el período beta
- **Todas las funciones** disponibles sin costo
- **Ideal para** testing inicial

### 💳 Plan Pagado
- **$20 USD/mes** después del período beta
- **Uso ilimitado** de la API
- **Soporte prioritario**
- **Ideal para** desarrollo continuo

## 🔧 Instalación Paso a Paso

### Una vez que tengas tu API key:

1. **Abre terminal** en tu proyecto:
```bash
cd /mnt/c/xampp/htdocs/Laburar
```

2. **Instala Magic MCP** con tu API key:
```bash
claude mcp add-json "magic" '{"command":"npx","args":["-y","@smithery/cli@latest","run","@21st-dev/magic-mcp","--config","{\"TWENTY_FIRST_API_KEY\":\"TU_API_KEY_AQUI\"}"]}' 
```

3. **Reemplaza** `TU_API_KEY_AQUI` con tu API key real

4. **Verifica** la instalación:
```bash
claude mcp list
```

Deberías ver `magic` en la lista de servidores.

## ✨ Características de Magic AI Agent

### 🎨 Generación de Componentes UI
- **Botones modernos** con estilos personalizados
- **Formularios complejos** con validación
- **Barras de navegación** responsivas
- **Tarjetas de contenido** elegantes
- **Modales y popups** interactivos

### 🛠️ Compatibilidad
- ✅ **React** (Hooks, TypeScript, Context API)
- ✅ **Vue** (Composition API, Pinia)
- ✅ **Angular** (Component architecture, TypeScript)
- ✅ **Vanilla JS** (Web Components, CSS moderno)

### 🎯 Integración con SuperClaude
Una vez instalado, Magic trabajará automáticamente con:
- `/sc:design` - Diseño de componentes UI
- `/sc:implement` - Implementación con UI moderna
- Comandos que requieran generación de frontend

## 🚨 Solución de Problemas

### Error: "Invalid API Key"
```bash
# Verifica que tu API key esté correcta
echo $TWENTY_FIRST_API_KEY
# O revisa en el dashboard de 21st.dev
```

### Error: "Quota Exceeded" 
- Has usado tus 5 requests gratuitos
- Considera actualizar al plan pagado ($20/mes)
- O espera el reset mensual

### Error: "Server Not Found"
```bash
# Reinstala el servidor
claude mcp remove magic
# Luego instala de nuevo con la API key correcta
```

## 📱 Alternativas Durante Beta

Si prefieres no usar una API key aún, puedes:

1. **Usar Magic sin MCP** temporalmente:
   - Ir directamente a [21st.dev Magic Console](https://21st.dev/magic/console)
   - Generar componentes en la web
   - Copiar y pegar código

2. **Esperar funcionalidad reducida**:
   - SuperClaude funcionará al 75%
   - Solo faltará generación automática de UI
   - Todos los demás comandos funcionan perfectamente

## 📞 Soporte

Si tienes problemas:
- 📧 **Email**: Contacta soporte en 21st.dev
- 🐛 **GitHub**: [Issues en magic-mcp](https://github.com/21st-dev/magic-mcp/issues)
- 📖 **Docs**: [21st.dev Documentation](https://21st.dev/api-access)

## 🎯 Próximo Paso

Una vez que tengas tu API key:
1. ✅ Ejecuta el comando de instalación
2. ✅ Verifica con `claude mcp list`
3. 🚀 ¡SuperClaude estará 100% funcional!

**💡 Tip:** Guarda tu API key en un lugar seguro. La necesitarás si reinstalar o cambias de computadora.

---

### Estado Actual de SuperClaude:
- ✅ Context7 (Documentación)
- ✅ Sequential (Análisis)
- ✅ Playwright (Testing)
- ⚠️ Magic (Pendiente - esta guía)

**Una vez complete este paso, tendrás SuperClaude Framework al 100% para desarrollar tu plataforma tipo Fiverr para Argentina! 🇦🇷**