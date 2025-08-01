# 🛡️ CloudFlare WAF Setup Guide - QUICK WIN

## 🎯 **OBJETIVO**: +0.03 pts en Score de Seguridad (15 minutos)

### **PASO 1: REGISTRO CLOUDFLARE**
1. Ir a https://dash.cloudflare.com/sign-up
2. Registrar cuenta con email empresarial
3. Agregar dominio LaburAR
4. Cambiar nameservers según instrucciones CloudFlare

### **PASO 2: CONFIGURACIÓN WAF BÁSICA**

#### **Security Level: High**
```
Dashboard → Security → Settings
- Security Level: High
- Challenge Passage: 30 minutes
- Browser Integrity Check: ON
```

#### **WAF Managed Rules**
```
Dashboard → Security → WAF → Managed Rules
- CloudFlare Managed Ruleset: ON
- OWASP Core Ruleset: ON
- CloudFlare WordPress Ruleset: OFF (no WordPress)
```

#### **Rate Limiting Rules**
```javascript
// Rule 1: API Protection
Expression: (http.request.uri.path contains "/api/")
Rate: 100 requests per minute per IP
Action: Block for 10 minutes

// Rule 2: Login Protection  
Expression: (http.request.uri.path contains "/login" or http.request.uri.path contains "/api/login")
Rate: 5 requests per minute per IP
Action: Block for 30 minutes

// Rule 3: Global Rate Limit
Expression: (http.request.uri.path ne "/static/")
Rate: 500 requests per minute per IP
Action: Challenge (CAPTCHA)
```

### **PASO 3: BOT FIGHT MODE**
```
Dashboard → Security → Bots
- Bot Fight Mode: ON
- Super Bot Fight Mode: ON (paid plan)
- Static Resource Protection: ON
```

### **PASO 4: DDoS PROTECTION**
```
Dashboard → Security → DDoS
- HTTP DDoS Attack Protection: ON
- Network-layer DDoS Attack Protection: ON (automatic)
```

### **PASO 5: SSL/TLS CONFIGURATION**
```
Dashboard → SSL/TLS → Overview
- Encryption Mode: Full (strict)
- Minimum TLS Version: 1.2
- Opportunistic Encryption: ON
- TLS 1.3: ON
```

### **PASO 6: FIREWALL RULES CUSTOM**
```javascript
// Block known bad countries (optional - adjust for your needs)
(ip.geoip.country in {"CN" "RU" "KP"}) and not (http.request.uri.path contains "/api/public")

// Block suspicious user agents
(http.user_agent contains "sqlmap" or http.user_agent contains "nikto" or http.user_agent contains "nmap")

// Allow only specific methods
not (http.request.method in {"GET" "POST" "PUT" "DELETE" "OPTIONS"})
```

## 🎯 **CONFIGURACIÓN ESPECÍFICA LABURAR**

### **Page Rules para Performance**
```javascript
// Rule 1: Cache static assets
Pattern: laburar.com/assets/*
Settings:
- Cache Level: Cache Everything
- Edge Cache TTL: 1 month
- Browser Cache TTL: 1 month

// Rule 2: API no-cache
Pattern: laburar.com/api/*
Settings:
- Cache Level: Bypass
- Security Level: High
```

### **DNS Configuration**
```
A    laburar.com         → YOUR_SERVER_IP (Proxied: ON)
A    www.laburar.com     → YOUR_SERVER_IP (Proxied: ON)
A    api.laburar.com     → YOUR_SERVER_IP (Proxied: ON)
CNAME admin.laburar.com → laburar.com   (Proxied: ON)
```

## 📊 **MONITOREO Y ALERTAS**

### **Analytics para Verificar**
- **Dashboard → Analytics → Security**
- Verificar bloqueos de amenazas
- Monitorear tráfico vs. amenazas ratio
- Revisar países de origen de ataques

### **Alertas por Email**
```
Dashboard → Notifications
- Weekly Security Digest: ON  
- DoS Attack Alerts: ON
- SSL Certificate Alerts: ON
- Health Check Alerts: ON
```

## ✅ **VERIFICACIÓN DE ÉXITO**

### **Tests a Realizar**
```bash
# Test 1: Verificar WAF activo
curl -H "User-Agent: sqlmap" https://laburar.com/
# Debería retornar 403 Forbidden

# Test 2: Rate limiting
for i in {1..10}; do curl https://laburar.com/api/login; done
# Después de 5 requests debería bloquear

# Test 3: SSL Grade
https://www.ssllabs.com/ssltest/analyze.html?d=laburar.com
# Objetivo: A+ grade
```

### **Métricas de Éxito**
- **Amenazas bloqueadas**: >50/día esperado
- **SSL Grade**: A+ en SSL Labs
- **Response time**: <200ms con WAF
- **Availability**: 99.9%+ uptime

## 💰 **COSTO Y ROI**

### **Costo CloudFlare**
- **Free Plan**: $0/mes (básico, suficiente para quick win)
- **Pro Plan**: $20/mes (recomendado para empresa)
- **Business Plan**: $200/mes (enterprise features)

### **ROI Inmediato**
- **DDoS Protection**: $10K-$100K saved per attack
- **Bandwidth Savings**: 50-70% reduction
- **Performance**: +30% page load speed
- **Security Score**: +0.03 pts (of 1.5 needed for 10/10)

## ⚡ **QUICK SETUP (15 minutos)**

```bash
# 1. Registro (3 min)
# → Ir a cloudflare.com/sign-up

# 2. Add domain (2 min)  
# → Agregar laburar.com

# 3. DNS scan (5 min)
# → CloudFlare escanea DNS automático

# 4. Enable WAF (3 min)
# → Security → WAF → Enable all rulesets

# 5. SSL Config (2 min)
# → SSL/TLS → Full (strict)
```

---

**🎯 ESTADO: LISTO PARA IMPLEMENTAR**

Una vez completado CloudFlare WAF, habrás ganado **+0.03 pts** hacia el score 10/10.

**¿Necesitas que proceda con el siguiente quick win (MFA por email)?**