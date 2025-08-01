import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RedisService } from '../common/redis/redis.service';
import { PrismaService } from '../common/database/prisma.service';

export interface SecurityMetrics {
  timestamp: string;
  totalRequests: number;
  blockedRequests: number;
  attackAttempts: number;
  blacklistedIPs: number;
  rateLimitViolations: number;
  topAttackTypes: { type: string; count: number }[];
  topAttackIPs: { ip: string; count: number }[];
  suspiciousUserAgents: { agent: string; count: number }[];
  apiEndpointStats: { endpoint: string; requests: number; blocked: number }[];
}

export interface SecurityAlert {
  id: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'rate_limit' | 'attack_detected' | 'blacklist' | 'anomaly' | 'system';
  message: string;
  ip?: string;
  metadata?: Record<string, any>;
  acknowledged: boolean;
}

@Injectable()
export class SecurityMonitorService {
  private readonly logger = new Logger(SecurityMonitorService.name);

  constructor(
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Análisis de seguridad cada 5 minutos
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async analyzeSecurityMetrics(): Promise<void> {
    try {
      this.logger.log('Running security metrics analysis...');
      
      const metrics = await this.collectSecurityMetrics();
      await this.detectAnomalies(metrics);
      await this.generateSecurityReport(metrics);
      
      this.logger.log('Security analysis completed');
    } catch (error) {
      this.logger.error('Error in security analysis:', error);
    }
  }

  /**
   * Limpieza de logs cada hora
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupOldLogs(): Promise<void> {
    try {
      this.logger.log('Cleaning up old security logs...');
      
      // Mantener logs por 7 días
      const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000);
      
      // Limpiar logs antiguos pero mantener métricas agregadas
      await this.archiveOldLogs(cutoffTime);
      
      this.logger.log('Log cleanup completed');
    } catch (error) {
      this.logger.error('Error in log cleanup:', error);
    }
  }

  /**
   * Recopilar métricas de seguridad
   */
  async collectSecurityMetrics(): Promise<SecurityMetrics> {
    const now = new Date().toISOString();
    const hourAgo = Date.now() - (60 * 60 * 1000);

    try {
      // Obtener logs de la última hora
      const attackLogs = await this.redis.lrange('attack_logs', 0, -1);
      const accessLogs = await this.redis.lrange('access_logs', 0, -1);
      const securityLogs = await this.redis.lrange('security_logs', 0, -1);

      // Filtrar logs de la última hora
      const recentAttacks = attackLogs
        .map(log => JSON.parse(log))
        .filter(attack => new Date(attack.timestamp).getTime() > hourAgo);

      const recentAccess = accessLogs
        .map(log => JSON.parse(log))
        .filter(access => new Date(access.timestamp).getTime() > hourAgo);

      const recentSecurity = securityLogs
        .map(log => JSON.parse(log))
        .filter(security => new Date(security.timestamp).getTime() > hourAgo);

      // Obtener IPs blacklisteadas
      const blacklistKeys = await this.redis.keys('blacklist:*');
      
      // Calcular métricas
      const totalRequests = recentAccess.length;
      const attackAttempts = recentAttacks.length;
      const rateLimitViolations = recentSecurity.filter(log => 
        log.type === 'rate_limit_violation'
      ).length;

      // Top attack types
      const attackTypeCounts = new Map<string, number>();
      recentAttacks.forEach(attack => {
        attack.attackTypes?.forEach((type: string) => {
          attackTypeCounts.set(type, (attackTypeCounts.get(type) || 0) + 1);
        });
      });

      const topAttackTypes = Array.from(attackTypeCounts.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Top attack IPs
      const attackIPCounts = new Map<string, number>();
      recentAttacks.forEach(attack => {
        if (attack.ip) {
          attackIPCounts.set(attack.ip, (attackIPCounts.get(attack.ip) || 0) + 1);
        }
      });

      const topAttackIPs = Array.from(attackIPCounts.entries())
        .map(([ip, count]) => ({ ip, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Suspicious user agents
      const userAgentCounts = new Map<string, number>();
      recentAttacks.forEach(attack => {
        if (attack.userAgent) {
          userAgentCounts.set(attack.userAgent, (userAgentCounts.get(attack.userAgent) || 0) + 1);
        }
      });

      const suspiciousUserAgents = Array.from(userAgentCounts.entries())
        .map(([agent, count]) => ({ agent, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // API endpoint stats
      const endpointCounts = new Map<string, { requests: number; blocked: number }>();
      recentAccess.forEach(access => {
        const endpoint = `${access.method}:${access.url.split('?')[0]}`;
        const current = endpointCounts.get(endpoint) || { requests: 0, blocked: 0 };
        current.requests++;
        endpointCounts.set(endpoint, current);
      });

      recentAttacks.forEach(attack => {
        const endpoint = `${attack.method}:${attack.url.split('?')[0]}`;
        const current = endpointCounts.get(endpoint) || { requests: 0, blocked: 0 };
        current.blocked++;
        endpointCounts.set(endpoint, current);
      });

      const apiEndpointStats = Array.from(endpointCounts.entries())
        .map(([endpoint, stats]) => ({ endpoint, ...stats }))
        .sort((a, b) => b.requests - a.requests)
        .slice(0, 15);

      return {
        timestamp: now,
        totalRequests,
        blockedRequests: attackAttempts + rateLimitViolations,
        attackAttempts,
        blacklistedIPs: blacklistKeys.length,
        rateLimitViolations,
        topAttackTypes,
        topAttackIPs,
        suspiciousUserAgents,
        apiEndpointStats,
      };

    } catch (error) {
      this.logger.error('Error collecting security metrics:', error);
      return {
        timestamp: now,
        totalRequests: 0,
        blockedRequests: 0,
        attackAttempts: 0,
        blacklistedIPs: 0,
        rateLimitViolations: 0,
        topAttackTypes: [],
        topAttackIPs: [],
        suspiciousUserAgents: [],
        apiEndpointStats: [],
      };
    }
  }

  /**
   * Detectar anomalías en las métricas
   */
  async detectAnomalies(metrics: SecurityMetrics): Promise<void> {
    const alerts: SecurityAlert[] = [];

    // Detectar picos de ataques
    if (metrics.attackAttempts > 50) {
      alerts.push({
        id: `attack_spike_${Date.now()}`,
        timestamp: metrics.timestamp,
        severity: metrics.attackAttempts > 200 ? 'critical' : 'high',
        type: 'attack_detected',
        message: `High attack volume detected: ${metrics.attackAttempts} attempts in the last hour`,
        metadata: { attackAttempts: metrics.attackAttempts },
        acknowledged: false,
      });
    }

    // Detectar muchas IPs blacklisteadas
    if (metrics.blacklistedIPs > 10) {
      alerts.push({
        id: `blacklist_spike_${Date.now()}`,
        timestamp: metrics.timestamp,
        severity: 'medium',
        type: 'blacklist',
        message: `High number of blacklisted IPs: ${metrics.blacklistedIPs}`,
        metadata: { blacklistedIPs: metrics.blacklistedIPs },
        acknowledged: false,
      });
    }

    // Detectar rate limiting excesivo
    if (metrics.rateLimitViolations > 100) {
      alerts.push({
        id: `rate_limit_spike_${Date.now()}`,
        timestamp: metrics.timestamp,
        severity: 'medium',
        type: 'rate_limit',
        message: `High rate limit violations: ${metrics.rateLimitViolations}`,
        metadata: { rateLimitViolations: metrics.rateLimitViolations },
        acknowledged: false,
      });
    }

    // Detectar ataques concentrados desde pocas IPs
    const concentratedAttacks = metrics.topAttackIPs.filter(ip => ip.count > 20);
    if (concentratedAttacks.length > 0) {
      concentratedAttacks.forEach(attack => {
        alerts.push({
          id: `concentrated_attack_${attack.ip}_${Date.now()}`,
          timestamp: metrics.timestamp,
          severity: 'high',
          type: 'attack_detected',
          message: `Concentrated attack from IP ${attack.ip}: ${attack.count} attempts`,
          ip: attack.ip,
          metadata: { attackCount: attack.count },
          acknowledged: false,
        });
      });
    }

    // Guardar alertas
    for (const alert of alerts) {
      await this.saveSecurityAlert(alert);
    }
  }

  /**
   * Generar reporte de seguridad
   */
  async generateSecurityReport(metrics: SecurityMetrics): Promise<void> {
    try {
      // Guardar métricas para dashboard
      const reportKey = `security_report:${new Date().toISOString().split('T')[0]}`;
      await this.redis.lpush(reportKey, JSON.stringify(metrics));
      await this.redis.expire(reportKey, 30 * 24 * 60 * 60); // 30 días

      // Log resumen
      this.logger.log(
        `Security Report: ${metrics.totalRequests} requests, ` +
        `${metrics.blockedRequests} blocked, ${metrics.attackAttempts} attacks, ` +
        `${metrics.blacklistedIPs} blacklisted IPs`
      );

      // Notificar si hay actividad anómala
      if (metrics.attackAttempts > 20 || metrics.blacklistedIPs > 5) {
        await this.notifySecurityTeam(metrics);
      }

    } catch (error) {
      this.logger.error('Error generating security report:', error);
    }
  }

  /**
   * Guardar alerta de seguridad
   */
  async saveSecurityAlert(alert: SecurityAlert): Promise<void> {
    try {
      await this.redis.lpush('security_alerts', JSON.stringify(alert));
      await this.redis.ltrim('security_alerts', 0, 999); // Mantener últimas 1000

      this.logger.warn(`Security Alert [${alert.severity}]: ${alert.message}`);

      // Para alertas críticas, notificar inmediatamente
      if (alert.severity === 'critical') {
        await this.notifySecurityTeam({ criticalAlert: alert });
      }

    } catch (error) {
      this.logger.error('Error saving security alert:', error);
    }
  }

  /**
   * Obtener métricas para dashboard
   */
  async getSecurityDashboard(): Promise<{
    currentMetrics: SecurityMetrics;
    recentAlerts: SecurityAlert[];
    trends: any;
  }> {
    try {
      const currentMetrics = await this.collectSecurityMetrics();
      
      // Obtener alertas recientes
      const alertsData = await this.redis.lrange('security_alerts', 0, 49);
      const recentAlerts = alertsData.map(alert => JSON.parse(alert)).slice(0, 10);

      // Obtener tendencias de la última semana
      const trends = await this.getSecurityTrends();

      return {
        currentMetrics,
        recentAlerts,
        trends,
      };

    } catch (error) {
      this.logger.error('Error getting security dashboard:', error);
      throw error;
    }
  }

  /**
   * Obtener tendencias de seguridad
   */
  private async getSecurityTrends(): Promise<any> {
    try {
      const trends = [];
      const today = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        
        const reportData = await this.redis.lrange(`security_report:${dateKey}`, 0, -1);
        const reports = reportData.map(report => JSON.parse(report));
        
        const dayMetrics = {
          date: dateKey,
          totalRequests: reports.reduce((sum, r) => sum + r.totalRequests, 0),
          attackAttempts: reports.reduce((sum, r) => sum + r.attackAttempts, 0),
          blockedRequests: reports.reduce((sum, r) => sum + r.blockedRequests, 0),
        };
        
        trends.push(dayMetrics);
      }
      
      return trends;
    } catch (error) {
      this.logger.error('Error getting security trends:', error);
      return [];
    }
  }

  /**
   * Notificar al equipo de seguridad
   */
  private async notifySecurityTeam(data: any): Promise<void> {
    try {
      // Implementar notificaciones (webhook, email, Slack, etc.)
      this.logger.warn(`Security Team Notification: ${JSON.stringify(data)}`);
      
      // Guardar notificación para dashboard admin
      await this.redis.lpush('admin_notifications', JSON.stringify({
        timestamp: new Date().toISOString(),
        type: 'security',
        data,
        priority: 'high',
      }));

    } catch (error) {
      this.logger.error('Error notifying security team:', error);
    }
  }

  /**
   * Archivar logs antiguos
   */
  private async archiveOldLogs(cutoffTime: number): Promise<void> {
    try {
      const logTypes = ['attack_logs', 'access_logs', 'security_logs'];
      
      for (const logType of logTypes) {
        const logs = await this.redis.lrange(logType, 0, -1);
        const recentLogs = logs.filter(log => {
          const parsedLog = JSON.parse(log);
          return new Date(parsedLog.timestamp).getTime() > cutoffTime;
        });
        
        // Reemplazar con logs recientes
        if (recentLogs.length < logs.length) {
          await this.redis.del(logType);
          if (recentLogs.length > 0) {
            await this.redis.lpush(logType, ...recentLogs);
          }
          
          this.logger.log(`Archived ${logs.length - recentLogs.length} old ${logType} entries`);
        }
      }
    } catch (error) {
      this.logger.error('Error archiving old logs:', error);
    }
  }
}