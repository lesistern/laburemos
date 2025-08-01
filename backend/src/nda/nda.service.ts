import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { NdaAcceptanceDto, NdaCheckDto } from './dto';

@Injectable()
export class NdaService {
  private readonly logger = new Logger(NdaService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Acepta y registra un NDA para un usuario/dispositivo
   */
  async acceptNda(data: NdaAcceptanceDto) {
    this.logger.log(`Procesando aceptación de NDA para ${data.email} desde IP ${data.ipAddress}`);

    try {
      // Verificar si ya existe una aceptación para esta combinación IP + device fingerprint
      const existingAcceptance = await this.prisma.userAlpha.findUnique({
        where: {
          ipAddress_deviceFingerprint: {
            ipAddress: data.ipAddress,
            deviceFingerprint: data.deviceFingerprint
          }
        }
      });

      if (existingAcceptance) {
        this.logger.warn(`NDA ya aceptado previamente para IP ${data.ipAddress} y device ${data.deviceFingerprint}`);
        throw new ConflictException('NDA ya aceptado para este dispositivo');
      }

      // Crear nueva aceptación de NDA
      const ndaAcceptance = await this.prisma.userAlpha.create({
        data: {
          email: data.email,
          ipAddress: data.ipAddress,
          deviceFingerprint: data.deviceFingerprint,
          userAgent: data.userAgent,
          ndaVersion: data.ndaVersion || '1.0'
        }
      });

      this.logger.log(`NDA aceptado exitosamente con ID ${ndaAcceptance.id}`);

      return {
        success: true,
        message: 'NDA aceptado exitosamente',
        data: {
          id: ndaAcceptance.id,
          acceptedAt: ndaAcceptance.acceptedAt,
          ndaVersion: ndaAcceptance.ndaVersion
        }
      };
    } catch (error) {
      this.logger.error(`Error al procesar aceptación de NDA: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Verifica si un dispositivo/IP ya aceptó el NDA
   */
  async checkNdaAcceptance(data: NdaCheckDto) {
    this.logger.log(`Verificando aceptación de NDA para IP ${data.ipAddress} y device ${data.deviceFingerprint}`);

    try {
      const existingAcceptance = await this.prisma.userAlpha.findUnique({
        where: {
          ipAddress_deviceFingerprint: {
            ipAddress: data.ipAddress,
            deviceFingerprint: data.deviceFingerprint
          }
        },
        select: {
          id: true,
          email: true,
          acceptedAt: true,
          ndaVersion: true
        }
      });

      const hasAccepted = !!existingAcceptance;
      
      this.logger.log(`Resultado verificación NDA: ${hasAccepted ? 'Aceptado' : 'No aceptado'}`);

      return {
        hasAccepted,
        data: existingAcceptance || null
      };
    } catch (error) {
      this.logger.error(`Error al verificar aceptación de NDA: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de aceptaciones de NDA (para admin)
   */
  async getNdaStats() {
    this.logger.log('Obteniendo estadísticas de NDA');

    try {
      const [total, today, thisWeek] = await Promise.all([
        // Total de aceptaciones
        this.prisma.userAlpha.count(),

        // Aceptaciones de hoy
        this.prisma.userAlpha.count({
          where: {
            acceptedAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        }),

        // Aceptaciones de esta semana
        this.prisma.userAlpha.count({
          where: {
            acceptedAt: {
              gte: new Date(new Date().setDate(new Date().getDate() - 7))
            }
          }
        })
      ]);

      return {
        total,
        today,
        thisWeek
      };
    } catch (error) {
      this.logger.error(`Error al obtener estadísticas de NDA: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Lista todas las aceptaciones de NDA (para admin)
   */
  async getAllNdaAcceptances(page: number = 1, limit: number = 10) {
    this.logger.log(`Obteniendo lista de aceptaciones NDA - Página ${page}`);

    try {
      const skip = (page - 1) * limit;

      const [acceptances, total] = await Promise.all([
        this.prisma.userAlpha.findMany({
          skip,
          take: limit,
          orderBy: {
            acceptedAt: 'desc'
          },
          select: {
            id: true,
            email: true,
            ipAddress: true,
            acceptedAt: true,
            ndaVersion: true,
            userAgent: true
          }
        }),
        this.prisma.userAlpha.count()
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        acceptances,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      this.logger.error(`Error al obtener lista de aceptaciones NDA: ${error.message}`, error.stack);
      throw error;
    }
  }
}