#!/bin/bash

# LaburAR Monitoring and Logging Setup for OCI ARM Instance
# Comprehensive monitoring, logging, and alerting system
# Usage: ./monitoring-setup.sh

set -e

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_header() {
    echo -e "\n${BLUE}========== $1 ==========${NC}\n"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as ubuntu user
if [ "$USER" != "ubuntu" ]; then
    print_error "This script must be run as ubuntu user"
    exit 1
fi

print_header "LaburAR Monitoring Setup Starting"

# Install monitoring tools
print_header "Installing System Monitoring Tools"
print_status "Installing system monitoring packages..."

sudo apt update
sudo apt install -y \
    htop \
    iotop \
    nethogs \
    nmon \
    sysstat \
    vnstat \
    tree \
    jq \
    curl \
    wget \
    ncdu \
    glances

# Setup Node.js monitoring tools
print_status "Installing Node.js monitoring tools..."
sudo npm install -g \
    pm2 \
    clinic \
    autocannon \
    0x

# Create monitoring directories
print_status "Creating monitoring directory structure..."
sudo mkdir -p /opt/laburar/monitoring/{scripts,configs,dashboards,alerts,reports}
sudo chown -R ubuntu:ubuntu /opt/laburar/monitoring

# System monitoring script
print_header "Creating System Monitoring Scripts"
print_status "Creating system resource monitor..."

cat > /opt/laburar/monitoring/scripts/system-monitor.sh << 'EOF'
#!/bin/bash

# LaburAR System Resource Monitor
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
LOG_FILE="/opt/laburar/logs/system-monitor.log"
ALERT_FILE="/opt/laburar/logs/system-alerts.log"

# Thresholds
CPU_THRESHOLD=80
MEMORY_THRESHOLD=85
DISK_THRESHOLD=85
LOAD_THRESHOLD=8.0

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

# Function to log and optionally alert
log_metric() {
    local metric="$1"
    local value="$2"
    local threshold="$3"
    local unit="$4"
    
    echo "[$TIMESTAMP] $metric: $value$unit" >> "$LOG_FILE"
    
    # Check if alerting is needed
    if (( $(echo "$value > $threshold" | bc -l) )); then
        echo -e "${RED}ALERT${NC}: $metric is $value$unit (threshold: $threshold$unit)"
        echo "[$TIMESTAMP] ALERT: $metric is $value$unit (threshold: $threshold$unit)" >> "$ALERT_FILE"
        return 1
    elif (( $(echo "$value > $threshold * 0.8" | bc -l) )); then
        echo -e "${YELLOW}WARNING${NC}: $metric is $value$unit (threshold: $threshold$unit)"
        return 0
    else
        echo -e "${GREEN}OK${NC}: $metric is $value$unit"
        return 0
    fi
}

echo "=== LaburAR System Monitor - $TIMESTAMP ==="

# CPU Usage
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
log_metric "CPU Usage" "$CPU_USAGE" "$CPU_THRESHOLD" "%"

# Memory Usage
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.2f", $3*100/$2}')
log_metric "Memory Usage" "$MEMORY_USAGE" "$MEMORY_THRESHOLD" "%"

# Disk Usage
DISK_USAGE=$(df / | awk 'NR==2{print $5}' | sed 's/%//')
log_metric "Disk Usage" "$DISK_USAGE" "$DISK_THRESHOLD" "%"

# Load Average (1 minute)
LOAD_AVG=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
log_metric "Load Average (1m)" "$LOAD_AVG" "$LOAD_THRESHOLD" ""

# Network connections
CONNECTIONS=$(netstat -an | grep ESTABLISHED | wc -l)
echo "Active connections: $CONNECTIONS"

# Check critical services
echo
echo "=== Service Status ==="
services=("postgresql" "mysql" "redis-server" "nginx")
for service in "${services[@]}"; do
    if systemctl is-active --quiet "$service"; then
        echo -e "${GREEN}✓${NC} $service is running"
    else
        echo -e "${RED}✗${NC} $service is not running"
        echo "[$TIMESTAMP] ALERT: Service $service is not running" >> "$ALERT_FILE"
    fi
done

# Check application status via PM2
echo
echo "=== Application Status ==="
if command -v pm2 &> /dev/null; then
    pm2 jlist | jq -r '.[] | "\(.name): \(.pm2_env.status)"' 2>/dev/null || echo "PM2 status unavailable"
else
    echo "PM2 not installed"
fi

# Check application endpoints
echo
echo "=== Application Health Checks ==="
if curl -f -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✓${NC} Frontend (port 3000) is responding"
else
    echo -e "${RED}✗${NC} Frontend (port 3000) is not responding"
    echo "[$TIMESTAMP] ALERT: Frontend not responding" >> "$ALERT_FILE"
fi

if curl -f -s http://localhost:3001/health > /dev/null; then
    echo -e "${GREEN}✓${NC} Backend API (port 3001) is responding"
else
    echo -e "${RED}✗${NC} Backend API (port 3001) is not responding"
    echo "[$TIMESTAMP] ALERT: Backend API not responding" >> "$ALERT_FILE"
fi

echo
echo "=== Disk Space Details ==="
df -h | grep -vE '^Filesystem|tmpfs|cdrom'

echo
echo "=== Memory Details ==="
free -h

echo
echo "=== Top Processes (CPU) ==="
ps aux --sort=-%cpu | head -10

echo
echo "=== Top Processes (Memory) ==="
ps aux --sort=-%mem | head -10

echo "=========================================="
EOF

chmod +x /opt/laburar/monitoring/scripts/system-monitor.sh

# Application monitoring script
print_status "Creating application performance monitor..."

cat > /opt/laburar/monitoring/scripts/app-monitor.sh << 'EOF'
#!/bin/bash

# LaburAR Application Performance Monitor
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
LOG_FILE="/opt/laburar/logs/app-monitor.log"
REPORT_FILE="/opt/laburar/monitoring/reports/performance-$(date +%Y%m%d).json"

echo "=== LaburAR Application Monitor - $TIMESTAMP ===" | tee -a "$LOG_FILE"

# Create performance report structure
cat > "$REPORT_FILE" << EOF
{
  "timestamp": "$TIMESTAMP",
  "metrics": {}
}
EOF

# Function to add metric to JSON report
add_metric() {
    local key="$1"
    local value="$2"
    jq --arg key "$key" --arg value "$value" '.metrics[$key] = $value' "$REPORT_FILE" > tmp.json && mv tmp.json "$REPORT_FILE"
}

# Frontend performance test
echo "Testing frontend performance..." | tee -a "$LOG_FILE"
FRONTEND_RESPONSE=$(curl -o /dev/null -s -w "%{time_total},%{http_code},%{size_download}" http://localhost:3000)
FRONTEND_TIME=$(echo $FRONTEND_RESPONSE | cut -d',' -f1)
FRONTEND_CODE=$(echo $FRONTEND_RESPONSE | cut -d',' -f2)
FRONTEND_SIZE=$(echo $FRONTEND_RESPONSE | cut -d',' -f3)

echo "Frontend - Response time: ${FRONTEND_TIME}s, Status: $FRONTEND_CODE, Size: $FRONTEND_SIZE bytes" | tee -a "$LOG_FILE"
add_metric "frontend_response_time" "$FRONTEND_TIME"
add_metric "frontend_status_code" "$FRONTEND_CODE"
add_metric "frontend_response_size" "$FRONTEND_SIZE"

# Backend API performance test
echo "Testing backend API performance..." | tee -a "$LOG_FILE"
BACKEND_RESPONSE=$(curl -o /dev/null -s -w "%{time_total},%{http_code},%{size_download}" http://localhost:3001/health)
BACKEND_TIME=$(echo $BACKEND_RESPONSE | cut -d',' -f1)
BACKEND_CODE=$(echo $BACKEND_RESPONSE | cut -d',' -f2)
BACKEND_SIZE=$(echo $BACKEND_RESPONSE | cut -d',' -f3)

echo "Backend API - Response time: ${BACKEND_TIME}s, Status: $BACKEND_CODE, Size: $BACKEND_SIZE bytes" | tee -a "$LOG_FILE"
add_metric "backend_response_time" "$BACKEND_TIME"
add_metric "backend_status_code" "$BACKEND_CODE"
add_metric "backend_response_size" "$BACKEND_SIZE"

# Database connection test
echo "Testing database connections..." | tee -a "$LOG_FILE"

# PostgreSQL test
PG_START=$(date +%s.%N)
if psql -U laburar -d laburar -c "SELECT 1;" > /dev/null 2>&1; then
    PG_END=$(date +%s.%N)
    PG_TIME=$(echo "$PG_END - $PG_START" | bc)
    echo "PostgreSQL - Connection successful in ${PG_TIME}s" | tee -a "$LOG_FILE"
    add_metric "postgresql_connection_time" "$PG_TIME"
    add_metric "postgresql_status" "connected"
else
    echo "PostgreSQL - Connection failed" | tee -a "$LOG_FILE"
    add_metric "postgresql_status" "failed"
fi

# MySQL test
MYSQL_START=$(date +%s.%N)
if mysql -u laburar -pLaburAR2024!@# -e "SELECT 1;" laburar_legacy > /dev/null 2>&1; then
    MYSQL_END=$(date +%s.%N)
    MYSQL_TIME=$(echo "$MYSQL_END - $MYSQL_START" | bc)
    echo "MySQL - Connection successful in ${MYSQL_TIME}s" | tee -a "$LOG_FILE"
    add_metric "mysql_connection_time" "$MYSQL_TIME"
    add_metric "mysql_status" "connected"
else
    echo "MySQL - Connection failed" | tee -a "$LOG_FILE"
    add_metric "mysql_status" "failed"
fi

# Redis test
REDIS_START=$(date +%s.%N)
if redis-cli ping > /dev/null 2>&1; then
    REDIS_END=$(date +%s.%N)
    REDIS_TIME=$(echo "$REDIS_END - $REDIS_START" | bc)
    echo "Redis - Connection successful in ${REDIS_TIME}s" | tee -a "$LOG_FILE"
    add_metric "redis_connection_time" "$REDIS_TIME"
    add_metric "redis_status" "connected"
else
    echo "Redis - Connection failed" | tee -a "$LOG_FILE"
    add_metric "redis_status" "failed"
fi

# PM2 process information
if command -v pm2 &> /dev/null; then
    echo "PM2 Process Information:" | tee -a "$LOG_FILE"
    PM2_INFO=$(pm2 jlist 2>/dev/null | jq -c '.[]' || echo "[]")
    
    if [ "$PM2_INFO" != "[]" ]; then
        echo "$PM2_INFO" | while IFS= read -r process; do
            NAME=$(echo "$process" | jq -r '.name')
            STATUS=$(echo "$process" | jq -r '.pm2_env.status')
            CPU=$(echo "$process" | jq -r '.monit.cpu // 0')
            MEMORY=$(echo "$process" | jq -r '.monit.memory // 0')
            UPTIME=$(echo "$process" | jq -r '.pm2_env.pm_uptime // 0')
            
            echo "$NAME - Status: $STATUS, CPU: $CPU%, Memory: ${MEMORY}B, Uptime: $UPTIME" | tee -a "$LOG_FILE"
            
            # Add to JSON report
            add_metric "${NAME}_status" "$STATUS"
            add_metric "${NAME}_cpu" "$CPU"
            add_metric "${NAME}_memory" "$MEMORY"
        done
    fi
fi

echo "Performance report saved to: $REPORT_FILE" | tee -a "$LOG_FILE"
echo "=========================================="
EOF

chmod +x /opt/laburar/monitoring/scripts/app-monitor.sh

# Security monitoring script
print_status "Creating security monitor..."

cat > /opt/laburar/monitoring/scripts/security-monitor.sh << 'EOF'
#!/bin/bash

# LaburAR Security Monitor
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
LOG_FILE="/opt/laburar/logs/security-monitor.log"
ALERT_FILE="/opt/laburar/logs/security-alerts.log"

echo "=== LaburAR Security Monitor - $TIMESTAMP ===" | tee -a "$LOG_FILE"

# Check failed login attempts
echo "Checking failed login attempts..." | tee -a "$LOG_FILE"
FAILED_LOGINS=$(grep "authentication failure" /var/log/auth.log | grep "$(date +%b\ %d)" | wc -l)
if [ "$FAILED_LOGINS" -gt 10 ]; then
    echo "WARNING: $FAILED_LOGINS failed login attempts today" | tee -a "$LOG_FILE" "$ALERT_FILE"
else
    echo "Failed login attempts today: $FAILED_LOGINS" | tee -a "$LOG_FILE"
fi

# Check for unusual network connections
echo "Checking network connections..." | tee -a "$LOG_FILE"
EXTERNAL_CONNECTIONS=$(netstat -an | grep ESTABLISHED | grep -v "127.0.0.1\|::1\|10.\|192.168." | wc -l)
echo "External connections: $EXTERNAL_CONNECTIONS" | tee -a "$LOG_FILE"

# Check open ports
echo "Checking open ports..." | tee -a "$LOG_FILE"
OPEN_PORTS=$(netstat -tlnp | grep LISTEN | awk '{print $4}' | cut -d: -f2 | sort -n | uniq)
echo "Open ports: $(echo $OPEN_PORTS | tr '\n' ' ')" | tee -a "$LOG_FILE"

# Check for processes listening on unexpected ports
UNEXPECTED_PORTS=$(netstat -tlnp | grep LISTEN | grep -v ":22\|:80\|:443\|:3000\|:3001\|:5432\|:3306\|:6379")
if [ -n "$UNEXPECTED_PORTS" ]; then
    echo "WARNING: Unexpected open ports detected:" | tee -a "$LOG_FILE" "$ALERT_FILE"
    echo "$UNEXPECTED_PORTS" | tee -a "$LOG_FILE" "$ALERT_FILE"
fi

# Check SSL certificate expiry
echo "Checking SSL certificate..." | tee -a "$LOG_FILE"
if [ -f "/etc/letsencrypt/live/your-domain.com/cert.pem" ]; then
    CERT_EXPIRY=$(openssl x509 -enddate -noout -in /etc/letsencrypt/live/your-domain.com/cert.pem | cut -d= -f2)
    CERT_EXPIRY_EPOCH=$(date -d "$CERT_EXPIRY" +%s)
    CURRENT_EPOCH=$(date +%s)
    DAYS_UNTIL_EXPIRY=$(( (CERT_EXPIRY_EPOCH - CURRENT_EPOCH) / 86400 ))
    
    if [ "$DAYS_UNTIL_EXPIRY" -lt 30 ]; then
        echo "WARNING: SSL certificate expires in $DAYS_UNTIL_EXPIRY days" | tee -a "$LOG_FILE" "$ALERT_FILE"
    else
        echo "SSL certificate expires in $DAYS_UNTIL_EXPIRY days" | tee -a "$LOG_FILE"
    fi
else
    echo "SSL certificate not found" | tee -a "$LOG_FILE"
fi

# Check fail2ban status
echo "Checking fail2ban status..." | tee -a "$LOG_FILE"
if systemctl is-active --quiet fail2ban; then
    BANNED_IPS=$(sudo fail2ban-client status sshd 2>/dev/null | grep "Banned IP list" | cut -d: -f2 | wc -w)
    echo "Fail2ban is active, banned IPs: $BANNED_IPS" | tee -a "$LOG_FILE"
else
    echo "WARNING: Fail2ban is not running" | tee -a "$LOG_FILE" "$ALERT_FILE"
fi

# Check firewall status
echo "Checking firewall status..." | tee -a "$LOG_FILE"
if sudo ufw status | grep -q "Status: active"; then
    echo "UFW firewall is active" | tee -a "$LOG_FILE"
else
    echo "WARNING: UFW firewall is not active" | tee -a "$LOG_FILE" "$ALERT_FILE"
fi

# Check for suspicious processes
echo "Checking for suspicious processes..." | tee -a "$LOG_FILE"
SUSPICIOUS_PROCESSES=$(ps aux | grep -E "(nc|netcat|ncat|socat|telnet)" | grep -v grep)
if [ -n "$SUSPICIOUS_PROCESSES" ]; then
    echo "WARNING: Suspicious processes detected:" | tee -a "$LOG_FILE" "$ALERT_FILE"
    echo "$SUSPICIOUS_PROCESSES" | tee -a "$LOG_FILE" "$ALERT_FILE"
fi

echo "=========================================="
EOF

chmod +x /opt/laburar/monitoring/scripts/security-monitor.sh

# Log analysis script
print_status "Creating log analysis script..."

cat > /opt/laburar/monitoring/scripts/log-analyzer.sh << 'EOF'
#!/bin/bash

# LaburAR Log Analyzer
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
REPORT_FILE="/opt/laburar/monitoring/reports/log-analysis-$(date +%Y%m%d).txt"

echo "=== LaburAR Log Analysis Report - $TIMESTAMP ===" > "$REPORT_FILE"

# Analyze application logs
echo "=== Application Logs Analysis ===" >> "$REPORT_FILE"

# Backend logs
if [ -f "/opt/laburar/logs/backend-error.log" ]; then
    echo "Backend Errors (last 24 hours):" >> "$REPORT_FILE"
    grep "$(date +%Y-%m-%d)" /opt/laburar/logs/backend-error.log | tail -20 >> "$REPORT_FILE" || echo "No recent backend errors" >> "$REPORT_FILE"
fi

# Frontend logs
if [ -f "/opt/laburar/logs/frontend-error.log" ]; then
    echo "Frontend Errors (last 24 hours):" >> "$REPORT_FILE"
    grep "$(date +%Y-%m-%d)" /opt/laburar/logs/frontend-error.log | tail -20 >> "$REPORT_FILE" || echo "No recent frontend errors" >> "$REPORT_FILE"
fi

# Nginx logs
echo "=== Nginx Logs Analysis ===" >> "$REPORT_FILE"
if [ -f "/var/log/nginx/access.log" ]; then
    echo "Top 10 IP addresses (today):" >> "$REPORT_FILE"
    grep "$(date +%d/%b/%Y)" /var/log/nginx/access.log | awk '{print $1}' | sort | uniq -c | sort -nr | head -10 >> "$REPORT_FILE"
    
    echo "Top 10 requested URLs (today):" >> "$REPORT_FILE"
    grep "$(date +%d/%b/%Y)" /var/log/nginx/access.log | awk '{print $7}' | sort | uniq -c | sort -nr | head -10 >> "$REPORT_FILE"
    
    echo "HTTP status codes (today):" >> "$REPORT_FILE"
    grep "$(date +%d/%b/%Y)" /var/log/nginx/access.log | awk '{print $9}' | sort | uniq -c | sort -nr >> "$REPORT_FILE"
fi

if [ -f "/var/log/nginx/error.log" ]; then
    echo "Nginx Errors (today):" >> "$REPORT_FILE"
    grep "$(date +%Y/%m/%d)" /var/log/nginx/error.log | tail -10 >> "$REPORT_FILE" || echo "No nginx errors today" >> "$REPORT_FILE"
fi

# System logs
echo "=== System Logs Analysis ===" >> "$REPORT_FILE"
echo "System errors (today):" >> "$REPORT_FILE"
journalctl --since "$(date +%Y-%m-%d) 00:00:00" --priority=err --no-pager | tail -10 >> "$REPORT_FILE" || echo "No system errors today" >> "$REPORT_FILE"

# Database logs
echo "=== Database Logs Analysis ===" >> "$REPORT_FILE"

# PostgreSQL logs
if [ -f "/var/log/postgresql/postgresql-15-main.log" ]; then
    echo "PostgreSQL errors (today):" >> "$REPORT_FILE"
    grep "$(date +%Y-%m-%d)" /var/log/postgresql/postgresql-15-main.log | grep ERROR | tail -5 >> "$REPORT_FILE" || echo "No PostgreSQL errors today" >> "$REPORT_FILE"
fi

# MySQL logs
if [ -f "/var/log/mysql/error.log" ]; then
    echo "MySQL errors (today):" >> "$REPORT_FILE"
    grep "$(date +%Y-%m-%d)" /var/log/mysql/error.log | tail -5 >> "$REPORT_FILE" || echo "No MySQL errors today" >> "$REPORT_FILE"
fi

echo "Report generated: $REPORT_FILE"
EOF

chmod +x /opt/laburar/monitoring/scripts/log-analyzer.sh

# Performance testing script
print_status "Creating performance testing script..."

cat > /opt/laburar/monitoring/scripts/performance-test.sh << 'EOF'
#!/bin/bash

# LaburAR Performance Testing Script
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
REPORT_FILE="/opt/laburar/monitoring/reports/performance-test-$(date +%Y%m%d-%H%M).json"

echo "=== LaburAR Performance Test - $TIMESTAMP ==="

# Initialize JSON report
cat > "$REPORT_FILE" << EOF
{
  "timestamp": "$TIMESTAMP",
  "tests": {}
}
EOF

add_test_result() {
    local test_name="$1"
    local result="$2"
    jq --arg name "$test_name" --argjson result "$result" '.tests[$name] = $result' "$REPORT_FILE" > tmp.json && mv tmp.json "$REPORT_FILE"
}

# Frontend load test
echo "Running frontend load test..."
if command -v autocannon &> /dev/null; then
    FRONTEND_RESULT=$(autocannon -c 10 -d 30 -j http://localhost:3000)
    add_test_result "frontend_load_test" "$FRONTEND_RESULT"
    echo "Frontend load test completed"
else
    echo "autocannon not installed, skipping frontend load test"
fi

# Backend API load test
echo "Running backend API load test..."
if command -v autocannon &> /dev/null; then
    BACKEND_RESULT=$(autocannon -c 10 -d 30 -j http://localhost:3001/health)
    add_test_result "backend_load_test" "$BACKEND_RESULT"
    echo "Backend API load test completed"
else
    echo "autocannon not installed, skipping backend load test"
fi

# Database performance test
echo "Running database performance test..."
PG_PERF=$(time (for i in {1..100}; do psql -U laburar -d laburar -c "SELECT COUNT(*) FROM information_schema.tables;" > /dev/null; done) 2>&1 | grep real | awk '{print $2}')
MYSQL_PERF=$(time (for i in {1..100}; do mysql -u laburar -pLaburAR2024!@# -e "SELECT COUNT(*) FROM information_schema.tables;" laburar_legacy > /dev/null; done) 2>&1 | grep real | awk '{print $2}')

DB_RESULT="{\"postgresql_100_queries\": \"$PG_PERF\", \"mysql_100_queries\": \"$MYSQL_PERF\"}"
add_test_result "database_performance" "$DB_RESULT"

echo "Performance test completed. Report saved to: $REPORT_FILE"
EOF

chmod +x /opt/laburar/monitoring/scripts/performance-test.sh

# Automated alerting script
print_status "Creating alerting system..."

cat > /opt/laburar/monitoring/scripts/alerting.sh << 'EOF'
#!/bin/bash

# LaburAR Alerting System
ALERT_FILE="/opt/laburar/logs/system-alerts.log"
EMAIL_RECIPIENT="admin@laburar.com"  # Change this to your email
WEBHOOK_URL=""  # Set your Slack/Discord webhook URL

send_email_alert() {
    local subject="$1"
    local message="$2"
    
    if command -v mail &> /dev/null; then
        echo "$message" | mail -s "$subject" "$EMAIL_RECIPIENT"
    else
        echo "Mail command not available. Alert: $subject - $message"
    fi
}

send_webhook_alert() {
    local message="$1"
    
    if [ -n "$WEBHOOK_URL" ]; then
        curl -X POST "$WEBHOOK_URL" \
            -H 'Content-Type: application/json' \
            -d "{\"text\": \"🚨 LaburAR Alert: $message\"}" \
            --silent --output /dev/null
    fi
}

# Check for new alerts
if [ -f "$ALERT_FILE" ]; then
    # Get alerts from the last hour
    RECENT_ALERTS=$(grep "$(date +%Y-%m-%d\ %H)" "$ALERT_FILE" | tail -10)
    
    if [ -n "$RECENT_ALERTS" ]; then
        ALERT_COUNT=$(echo "$RECENT_ALERTS" | wc -l)
        ALERT_MESSAGE="$ALERT_COUNT new alerts detected:
$RECENT_ALERTS"
        
        send_email_alert "LaburAR System Alerts" "$ALERT_MESSAGE"
        send_webhook_alert "$ALERT_MESSAGE"
        
        echo "Sent alerts for $ALERT_COUNT new issues"
    fi
fi
EOF

chmod +x /opt/laburar/monitoring/scripts/alerting.sh

# Dashboard generator
print_status "Creating monitoring dashboard..."

cat > /opt/laburar/monitoring/scripts/generate-dashboard.sh << 'EOF'
#!/bin/bash

# LaburAR Monitoring Dashboard Generator
DASHBOARD_FILE="/opt/laburar/monitoring/dashboards/dashboard.html"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Create dashboard HTML
cat > "$DASHBOARD_FILE" << 'HTML'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LaburAR Monitoring Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: #2c3e50; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .metric-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .metric-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #2c3e50; }
        .metric-value { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
        .metric-status { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
        .status-ok { background: #d4edda; color: #155724; }
        .status-warning { background: #fff3cd; color: #856404; }
        .status-error { background: #f8d7da; color: #721c24; }
        .logs { background: white; padding: 20px; border-radius: 8px; margin-top: 20px; }
        .log-entry { font-family: monospace; font-size: 12px; padding: 2px 0; border-bottom: 1px solid #eee; }
        .refresh-info { text-align: center; color: #666; margin-top: 20px; }
    </style>
    <script>
        function refreshPage() {
            location.reload();
        }
        
        // Auto-refresh every 60 seconds
        setInterval(refreshPage, 60000);
        
        // Load metrics via AJAX (if available)
        function loadMetrics() {
            // This would typically load from an API endpoint
            console.log('Loading metrics...');
        }
    </script>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 LaburAR Monitoring Dashboard</h1>
            <p>Real-time system and application monitoring</p>
            <p>Last updated: TIMESTAMP_PLACEHOLDER</p>
        </div>
        
        <div class="metrics">
            <div class="metric-card">
                <div class="metric-title">System Status</div>
                <div class="metric-value">SYSTEM_STATUS</div>
                <div class="metric-status status-ok">All Services Running</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-title">CPU Usage</div>
                <div class="metric-value">CPU_USAGE%</div>
                <div class="metric-status STATUS_CPU">Normal</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-title">Memory Usage</div>
                <div class="metric-value">MEMORY_USAGE%</div>
                <div class="metric-status STATUS_MEMORY">Normal</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-title">Disk Usage</div>
                <div class="metric-value">DISK_USAGE%</div>
                <div class="metric-status STATUS_DISK">Normal</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-title">Frontend Response</div>
                <div class="metric-value">FRONTEND_TIME ms</div>
                <div class="metric-status STATUS_FRONTEND">Healthy</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-title">Backend API Response</div>
                <div class="metric-value">BACKEND_TIME ms</div>
                <div class="metric-status STATUS_BACKEND">Healthy</div>
            </div>
        </div>
        
        <div class="logs">
            <h3>Recent System Events</h3>
            <div id="log-entries">
                RECENT_LOGS_PLACEHOLDER
            </div>
        </div>
        
        <div class="refresh-info">
            <p>Dashboard auto-refreshes every 60 seconds | <a href="#" onclick="refreshPage()">Refresh Now</a></p>
        </div>
    </div>
</body>
</html>
HTML

# Populate dashboard with actual data
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}' | cut -d. -f1)
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
DISK_USAGE=$(df / | awk 'NR==2{print $5}' | sed 's/%//')

# Test response times
FRONTEND_RESPONSE=$(curl -o /dev/null -s -w "%{time_total}" http://localhost:3000 | awk '{printf "%.0f", $1*1000}')
BACKEND_RESPONSE=$(curl -o /dev/null -s -w "%{time_total}" http://localhost:3001/health | awk '{printf "%.0f", $1*1000}')

# Get recent logs
RECENT_LOGS=$(tail -10 /opt/laburar/logs/system-monitor.log | sed 's/</\&lt;/g' | sed 's/>/\&gt;/g' | sed 's/$/\\n/' | tr -d '\n')

# Determine status classes
STATUS_CPU="status-ok"
STATUS_MEMORY="status-ok"
STATUS_DISK="status-ok"
STATUS_FRONTEND="status-ok"
STATUS_BACKEND="status-ok"

[ "$CPU_USAGE" -gt 80 ] && STATUS_CPU="status-error"
[ "$CPU_USAGE" -gt 60 ] && STATUS_CPU="status-warning"

[ "$MEMORY_USAGE" -gt 85 ] && STATUS_MEMORY="status-error"
[ "$MEMORY_USAGE" -gt 70 ] && STATUS_MEMORY="status-warning"

[ "$DISK_USAGE" -gt 85 ] && STATUS_DISK="status-error"
[ "$DISK_USAGE" -gt 70 ] && STATUS_DISK="status-warning"

[ "$FRONTEND_RESPONSE" -gt 2000 ] && STATUS_FRONTEND="status-error"
[ "$FRONTEND_RESPONSE" -gt 1000 ] && STATUS_FRONTEND="status-warning"

[ "$BACKEND_RESPONSE" -gt 1000 ] && STATUS_BACKEND="status-error"
[ "$BACKEND_RESPONSE" -gt 500 ] && STATUS_BACKEND="status-warning"

# Replace placeholders
sed -i "s/TIMESTAMP_PLACEHOLDER/$TIMESTAMP/g" "$DASHBOARD_FILE"
sed -i "s/CPU_USAGE/$CPU_USAGE/g" "$DASHBOARD_FILE"
sed -i "s/MEMORY_USAGE/$MEMORY_USAGE/g" "$DASHBOARD_FILE"
sed -i "s/DISK_USAGE/$DISK_USAGE/g" "$DASHBOARD_FILE"
sed -i "s/FRONTEND_TIME/$FRONTEND_RESPONSE/g" "$DASHBOARD_FILE"
sed -i "s/BACKEND_TIME/$BACKEND_RESPONSE/g" "$DASHBOARD_FILE"
sed -i "s/STATUS_CPU/$STATUS_CPU/g" "$DASHBOARD_FILE"
sed -i "s/STATUS_MEMORY/$STATUS_MEMORY/g" "$DASHBOARD_FILE"
sed -i "s/STATUS_DISK/$STATUS_DISK/g" "$DASHBOARD_FILE"
sed -i "s/STATUS_FRONTEND/$STATUS_FRONTEND/g" "$DASHBOARD_FILE"
sed -i "s/STATUS_BACKEND/$STATUS_BACKEND/g" "$DASHBOARD_FILE"
sed -i "s/RECENT_LOGS_PLACEHOLDER/$RECENT_LOGS/g" "$DASHBOARD_FILE"

echo "Dashboard generated: $DASHBOARD_FILE"
EOF

chmod +x /opt/laburar/monitoring/scripts/generate-dashboard.sh

# Setup monitoring cron jobs
print_header "Setting Up Automated Monitoring"
print_status "Configuring cron jobs for automated monitoring..."

# Create cron jobs
(crontab -l 2>/dev/null; cat << EOF
# LaburAR Monitoring Cron Jobs

# System monitoring every 5 minutes
*/5 * * * * /opt/laburar/monitoring/scripts/system-monitor.sh >> /opt/laburar/logs/cron.log 2>&1

# Application monitoring every 10 minutes
*/10 * * * * /opt/laburar/monitoring/scripts/app-monitor.sh >> /opt/laburar/logs/cron.log 2>&1

# Security monitoring every 15 minutes
*/15 * * * * /opt/laburar/monitoring/scripts/security-monitor.sh >> /opt/laburar/logs/cron.log 2>&1

# Log analysis every hour
0 * * * * /opt/laburar/monitoring/scripts/log-analyzer.sh >> /opt/laburar/logs/cron.log 2>&1

# Performance testing every 6 hours
0 */6 * * * /opt/laburar/monitoring/scripts/performance-test.sh >> /opt/laburar/logs/cron.log 2>&1

# Dashboard generation every 5 minutes
*/5 * * * * /opt/laburar/monitoring/scripts/generate-dashboard.sh >> /opt/laburar/logs/cron.log 2>&1

# Alerting check every 10 minutes
*/10 * * * * /opt/laburar/monitoring/scripts/alerting.sh >> /opt/laburar/logs/cron.log 2>&1

# Cleanup old reports weekly
0 2 * * 0 find /opt/laburar/monitoring/reports -name "*.json" -o -name "*.txt" -mtime +30 -delete

EOF
) | crontab -

print_status "Cron jobs configured successfully"

# Create monitoring service
print_status "Creating monitoring systemd service..."

sudo tee /etc/systemd/system/laburar-monitoring.service > /dev/null << EOF
[Unit]
Description=LaburAR Monitoring Service
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/laburar/monitoring
ExecStart=/bin/bash -c 'while true; do /opt/laburar/monitoring/scripts/system-monitor.sh; sleep 300; done'
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable laburar-monitoring.service

# Create monitoring management aliases
print_status "Setting up monitoring aliases..."
cat >> ~/.bashrc << EOF

# LaburAR Monitoring Aliases
alias monitor-system='/opt/laburar/monitoring/scripts/system-monitor.sh'
alias monitor-app='/opt/laburar/monitoring/scripts/app-monitor.sh'
alias monitor-security='/opt/laburar/monitoring/scripts/security-monitor.sh'
alias analyze-logs='/opt/laburar/monitoring/scripts/log-analyzer.sh'
alias test-performance='/opt/laburar/monitoring/scripts/performance-test.sh'
alias generate-dashboard='/opt/laburar/monitoring/scripts/generate-dashboard.sh'
alias view-dashboard='firefox /opt/laburar/monitoring/dashboards/dashboard.html'
alias monitor-all='monitor-system && monitor-app && monitor-security'
EOF

# Setup log rotation for monitoring logs
print_status "Configuring log rotation for monitoring..."
sudo tee /etc/logrotate.d/laburar-monitoring > /dev/null << EOF
/opt/laburar/logs/*-monitor.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    create 644 ubuntu ubuntu
}

/opt/laburar/logs/*-alerts.log {
    daily
    rotate 60
    compress
    delaycompress
    missingok
    create 644 ubuntu ubuntu
}
EOF

# Create monitoring documentation
print_status "Creating monitoring documentation..."
cat > /opt/laburar/monitoring/README.md << 'EOF'
# LaburAR Monitoring System

## Overview
Comprehensive monitoring system for LaburAR application on Oracle Cloud ARM instance.

## Components

### Scripts
- `system-monitor.sh` - System resource monitoring (CPU, Memory, Disk, Load)
- `app-monitor.sh` - Application performance monitoring
- `security-monitor.sh` - Security monitoring and alerts
- `log-analyzer.sh` - Log analysis and reporting
- `performance-test.sh` - Automated performance testing
- `generate-dashboard.sh` - HTML dashboard generation
- `alerting.sh` - Alert notification system

### Automated Schedules
- System monitoring: Every 5 minutes
- Application monitoring: Every 10 minutes
- Security monitoring: Every 15 minutes
- Log analysis: Every hour
- Performance testing: Every 6 hours
- Dashboard updates: Every 5 minutes
- Alert checks: Every 10 minutes

### Files and Directories
- `/opt/laburar/logs/` - All log files
- `/opt/laburar/monitoring/reports/` - Generated reports
- `/opt/laburar/monitoring/dashboards/` - HTML dashboards
- `/opt/laburar/monitoring/alerts/` - Alert configurations

## Quick Commands
```bash
# View system status
monitor-system

# Check application performance
monitor-app

# Security check
monitor-security

# Generate performance report
test-performance

# Update dashboard
generate-dashboard

# View all monitoring data
monitor-all
```

## Dashboard Access
Open `/opt/laburar/monitoring/dashboards/dashboard.html` in a web browser for real-time monitoring dashboard.

## Alerts
- Email alerts sent to: admin@laburar.com
- Webhook notifications (configure WEBHOOK_URL in alerting.sh)
- Alert thresholds:
  - CPU: 80%
  - Memory: 85%
  - Disk: 85%
  - Load: 8.0

## Customization
Edit threshold values in individual monitoring scripts as needed.
EOF

print_header "Monitoring Setup Complete!"
print_status "LaburAR monitoring system has been successfully configured!"
echo
print_status "What's been set up:"
echo "✅ System resource monitoring (CPU, Memory, Disk, Load)"
echo "✅ Application performance monitoring"
echo "✅ Security monitoring and alerts"
echo "✅ Log analysis and reporting"
echo "✅ Automated performance testing"
echo "✅ HTML monitoring dashboard"
echo "✅ Email and webhook alerting"
echo "✅ Automated cron job scheduling"
echo "✅ Log rotation configuration"
echo
print_status "Quick start commands:"
echo "- monitor-system      # Check system resources"
echo "- monitor-app         # Check application performance"
echo "- monitor-security    # Run security checks"
echo "- generate-dashboard  # Update monitoring dashboard"
echo "- view-dashboard      # Open dashboard in browser"
echo
print_status "Dashboard available at: /opt/laburar/monitoring/dashboards/dashboard.html"
print_status "Logs available at: /opt/laburar/logs/"
print_status "Reports available at: /opt/laburar/monitoring/reports/"
echo
print_status "Monitoring system is now active and will run automatically!"