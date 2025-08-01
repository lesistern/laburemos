#!/usr/bin/env node

/**
 * LABUREMOS Security Validation Script
 * Automated security checks for development and production environments
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔒 LABUREMOS Security Validation Suite');
console.log('=====================================\n');

const checks = [];
let criticalIssues = 0;
let highIssues = 0;
let mediumIssues = 0;

// Helper function to add check results
function addCheck(name, status, level, message, remediation = '') {
  checks.push({ name, status, level, message, remediation });
  if (status === 'FAIL') {
    if (level === 'CRITICAL') criticalIssues++;
    else if (level === 'HIGH') highIssues++;
    else if (level === 'MEDIUM') mediumIssues++;
  }
}

// 1. Check for hardcoded credentials
console.log('🔍 Checking for hardcoded credentials...');
const envFiles = ['.env', '.env.production', 'backend/.env', 'backend/.env.production'];
let credentialsFound = false;

envFiles.forEach(file => {
  if (fs.existsSync(file)) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        // Check for suspicious patterns
        const suspiciousPatterns = [
          /DATABASE_URL=.*:\/\/.*:.*@.*\/.*/, // Database URLs with passwords
          /JWT_SECRET=.*-production-.*/, // Production secrets
          /PASSWORD=.{8,}/, // Passwords
          /SECRET.*=.*[a-zA-Z0-9]{16,}/, // Secrets
          /API_KEY=.*[a-zA-Z0-9]{20,}/ // API Keys
        ];
        
        suspiciousPatterns.forEach(pattern => {
          if (pattern.test(line) && !line.includes('your_') && !line.includes('CHANGE_ME')) {
            credentialsFound = true;
            console.log(`❌ Found hardcoded credential in ${file}:${index + 1}`);
          }
        });
      });
    } catch (err) {
      console.log(`⚠️  Could not read ${file}: ${err.message}`);
    }
  }
});

addCheck(
  'Hardcoded Credentials Check',
  credentialsFound ? 'FAIL' : 'PASS',
  'CRITICAL',
  credentialsFound ? 'Hardcoded credentials found in configuration files' : 'No hardcoded credentials detected',
  credentialsFound ? 'Move sensitive data to environment variables or AWS Secrets Manager' : ''
);

// 2. Check file permissions
console.log('🔍 Checking file permissions...');
const sensitiveFiles = ['laburemos-key.pem', 'backend/laburemos-key.pem'];
let permissionIssues = false;

sensitiveFiles.forEach(file => {
  if (fs.existsSync(file)) {
    try {
      const stats = fs.statSync(file);
      const mode = (stats.mode & parseInt('777', 8)).toString(8);
      if (mode !== '600') {
        permissionIssues = true;
        console.log(`❌ Incorrect permissions on ${file}: ${mode} (should be 600)`);
      }
    } catch (err) {
      console.log(`⚠️  Could not check permissions for ${file}: ${err.message}`);
    }
  }
});

addCheck(
  'File Permissions Check',
  permissionIssues ? 'FAIL' : 'PASS',
  'HIGH',
  permissionIssues ? 'Incorrect file permissions detected' : 'File permissions are secure',
  permissionIssues ? 'Run: chmod 600 on sensitive files' : ''
);

// 3. Check for vulnerable dependencies
console.log('🔍 Checking for vulnerable dependencies...');
let vulnerabilitiesFound = false;

['frontend', 'backend'].forEach(dir => {
  if (fs.existsSync(path.join(dir, 'package.json'))) {
    try {
      console.log(`  Checking ${dir}...`);
      const auditOutput = execSync(`cd ${dir} && npm audit --audit-level moderate --json`, { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      const auditData = JSON.parse(auditOutput);
      if (auditData.metadata && auditData.metadata.vulnerabilities) {
        const vuln = auditData.metadata.vulnerabilities;
        const total = vuln.moderate + vuln.high + vuln.critical;
        if (total > 0) {
          vulnerabilitiesFound = true;
          console.log(`❌ Found ${total} vulnerabilities in ${dir}`);
        }
      }
    } catch (err) {
      // npm audit returns non-zero exit code when vulnerabilities found
      if (err.stdout) {
        try {
          const auditData = JSON.parse(err.stdout);
          if (auditData.metadata && auditData.metadata.vulnerabilities) {
            const vuln = auditData.metadata.vulnerabilities;
            const total = vuln.moderate + vuln.high + vuln.critical;
            if (total > 0) {
              vulnerabilitiesFound = true;
              console.log(`❌ Found ${total} vulnerabilities in ${dir}`);
            }
          }
        } catch (parseErr) {
          console.log(`⚠️  Could not parse audit output for ${dir}`);
        }
      }
    }
  }
});

addCheck(
  'Dependency Vulnerabilities Check',
  vulnerabilitiesFound ? 'FAIL' : 'PASS',
  'HIGH',
  vulnerabilitiesFound ? 'Vulnerable dependencies detected' : 'No vulnerable dependencies found',
  vulnerabilitiesFound ? 'Run: npm audit fix in affected directories' : ''
);

// 4. Check Next.js configuration
console.log('🔍 Checking Next.js security configuration...');
let nextjsIssues = false;

if (fs.existsSync('frontend/next.config.js')) {
  try {
    const content = fs.readFileSync('frontend/next.config.js', 'utf8');
    
    // Check for dangerous configurations
    if (content.includes('ignoreBuildErrors: true')) {
      nextjsIssues = true;
      console.log('❌ ignoreBuildErrors is enabled in Next.js config');
    }
    
    if (content.includes('ignoreDuringBuilds: true')) {
      nextjsIssues = true;
      console.log('❌ ESLint ignoreDuringBuilds is enabled in Next.js config');
    }
    
    // Check for security headers
    if (!content.includes('X-Frame-Options')) {
      nextjsIssues = true;
      console.log('❌ Missing security headers in Next.js config');
    }
    
  } catch (err) {
    console.log(`⚠️  Could not read Next.js config: ${err.message}`);
  }
}

addCheck(
  'Next.js Security Configuration',
  nextjsIssues ? 'FAIL' : 'PASS',
  'MEDIUM',
  nextjsIssues ? 'Insecure Next.js configuration detected' : 'Next.js configuration is secure',
  nextjsIssues ? 'Update next.config.js with secure settings' : ''
);

// 5. Check for .env.example template
console.log('🔍 Checking for secure environment template...');
const hasEnvExample = fs.existsSync('backend/.env.example');

addCheck(
  'Environment Template Check',
  hasEnvExample ? 'PASS' : 'FAIL',
  'MEDIUM',
  hasEnvExample ? 'Secure environment template exists' : 'Missing .env.example template',
  hasEnvExample ? '' : 'Create .env.example with placeholder values'
);

// 6. Check SSL/TLS configuration (for production)
console.log('🔍 Checking SSL/TLS configuration...');
if (process.env.NODE_ENV === 'production') {
  // This would check certificate validity, HSTS headers, etc.
  // For now, just check if HTTPS redirect is configured
  let httpsConfigured = false;
  
  if (fs.existsSync('frontend/next.config.js')) {
    const content = fs.readFileSync('frontend/next.config.js', 'utf8');
    if (content.includes('Strict-Transport-Security')) {
      httpsConfigured = true;
    }
  }
  
  addCheck(
    'SSL/TLS Configuration',
    httpsConfigured ? 'PASS' : 'FAIL',
    'HIGH',
    httpsConfigured ? 'HTTPS security headers configured' : 'Missing HTTPS security configuration',
    httpsConfigured ? '' : 'Configure HSTS and HTTPS redirects'
  );
}

// Generate Report
console.log('\n📊 SECURITY AUDIT REPORT');
console.log('========================');
console.log(`Date: ${new Date().toISOString()}`);
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log('');

// Summary
const totalChecks = checks.length;
const passedChecks = checks.filter(c => c.status === 'PASS').length;
const failedChecks = checks.filter(c => c.status === 'FAIL').length;

console.log('📈 SUMMARY');
console.log(`Total Checks: ${totalChecks}`);
console.log(`✅ Passed: ${passedChecks}`);
console.log(`❌ Failed: ${failedChecks}`);
console.log('');

console.log('🚨 ISSUES BY SEVERITY');
console.log(`Critical: ${criticalIssues}`);
console.log(`High: ${highIssues}`); 
console.log(`Medium: ${mediumIssues}`);
console.log('');

// Detailed results
console.log('📋 DETAILED RESULTS');
checks.forEach(check => {
  const statusIcon = check.status === 'PASS' ? '✅' : '❌';
  const levelColor = check.level === 'CRITICAL' ? '🔴' : 
                    check.level === 'HIGH' ? '🟠' : '🟡';
  
  console.log(`${statusIcon} [${levelColor} ${check.level}] ${check.name}`);
  console.log(`   ${check.message}`);
  if (check.remediation) {
    console.log(`   🔧 Remediation: ${check.remediation}`);
  }
  console.log('');
});

// Final recommendation
console.log('🎯 RECOMMENDATIONS');
if (criticalIssues > 0) {
  console.log('❌ CRITICAL ISSUES FOUND - IMMEDIATE ACTION REQUIRED');
  console.log('   System should not be deployed to production until critical issues are resolved.');
} else if (highIssues > 0) {
  console.log('⚠️  HIGH PRIORITY ISSUES FOUND');
  console.log('   Address high priority issues before next deployment.');
} else if (mediumIssues > 0) {
  console.log('✅ GOOD SECURITY POSTURE');
  console.log('   Address medium priority issues when convenient.');
} else {
  console.log('🎉 EXCELLENT SECURITY POSTURE');
  console.log('   All security checks passed!');
}

console.log('');
console.log('📞 For security incidents, contact: contacto.laburemos@gmail.com');
console.log('🔄 Next audit recommended: ' + new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toDateString());

// Exit with appropriate code
const exitCode = criticalIssues > 0 ? 2 : (highIssues > 0 ? 1 : 0);
process.exit(exitCode);