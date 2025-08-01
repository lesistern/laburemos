import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  Logger
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { NdaService } from './nda.service';
import { NdaAcceptanceDto, NdaCheckDto } from './dto';

@ApiTags('NDA (Non-Disclosure Agreement)')
@Controller('nda')
export class NdaController {
  private readonly logger = new Logger(NdaController.name);

  constructor(private readonly ndaService: NdaService) {}

  @Public()
  @Post('accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Acepta el NDA para acceso Alpha',
    description: 'Registra la aceptación del NDA por parte de un usuario/dispositivo'
  })
  @ApiResponse({
    status: 200,
    description: 'NDA aceptado exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'NDA aceptado exitosamente' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            acceptedAt: { type: 'string', format: 'date-time' },
            ndaVersion: { type: 'string', example: '1.0' }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 409,
    description: 'NDA ya aceptado para este dispositivo'
  })
  async acceptNda(
    @Body() ndaAcceptanceDto: NdaAcceptanceDto,
    @Req() request: Request
  ) {
    this.logger.log(`Solicitud de aceptación NDA desde IP: ${request.ip}`);

    // Obtener IP real del request (considerando proxies)
    const clientIp = request.ip ||
      request.headers['x-forwarded-for'] as string ||
      request.headers['x-real-ip'] as string ||
      request.connection.remoteAddress ||
      'unknown';

    // Usar la IP detectada automáticamente
    const acceptanceData = {
      ...ndaAcceptanceDto,
      ipAddress: clientIp.toString(),
      userAgent: request.headers['user-agent']
    };

    return await this.ndaService.acceptNda(acceptanceData);
  }

  @Public()
  @Post('check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verifica si un dispositivo ya aceptó el NDA',
    description: 'Comprueba si existe una aceptación previa del NDA para la combinación IP + device fingerprint'
  })
  @ApiResponse({
    status: 200,
    description: 'Verificación completada',
    schema: {
      type: 'object',
      properties: {
        hasAccepted: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            email: { type: 'string', example: 'usuario@example.com' },
            acceptedAt: { type: 'string', format: 'date-time' },
            ndaVersion: { type: 'string', example: '1.0' }
          },
          nullable: true
        }
      }
    }
  })
  async checkNdaAcceptance(
    @Body() ndaCheckDto: NdaCheckDto,
    @Req() request: Request
  ) {
    this.logger.log(`Verificación NDA desde IP: ${request.ip}`);

    // Obtener IP real del request
    const clientIp = request.ip ||
      request.headers['x-forwarded-for'] as string ||
      request.headers['x-real-ip'] as string ||
      request.connection.remoteAddress ||
      'unknown';

    // Usar la IP detectada automáticamente
    const checkData = {
      ...ndaCheckDto,
      ipAddress: clientIp.toString()
    };

    return await this.ndaService.checkNdaAcceptance(checkData);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtiene estadísticas de aceptaciones NDA (Solo Admin)',
    description: 'Retorna estadísticas agregadas de las aceptaciones de NDA'
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', example: 150 },
        today: { type: 'number', example: 5 },
        thisWeek: { type: 'number', example: 25 }
      }
    }
  })
  async getNdaStats() {
    this.logger.log('Solicitud de estadísticas NDA por admin');
    return await this.ndaService.getNdaStats();
  }

  @Get('acceptances')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Lista todas las aceptaciones NDA (Solo Admin)',
    description: 'Retorna lista paginada de todas las aceptaciones de NDA'
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página (default: 1)'
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Elementos por página (default: 10)'
  })
  @ApiResponse({
    status: 200,
    description: 'Lista obtenida exitosamente',
    schema: {
      type: 'object',
      properties: {
        acceptances: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              email: { type: 'string' },
              ipAddress: { type: 'string' },
              acceptedAt: { type: 'string', format: 'date-time' },
              ndaVersion: { type: 'string' },
              userAgent: { type: 'string' }
            }
          }
        },
        pagination: {
          type: 'object',
          properties: {
            currentPage: { type: 'number' },
            totalPages: { type: 'number' },
            totalItems: { type: 'number' },
            itemsPerPage: { type: 'number' }
          }
        }
      }
    }
  })
  async getAllNdaAcceptances(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ) {
    this.logger.log(`Solicitud de lista NDA por admin - Página ${page}`);
    return await this.ndaService.getAllNdaAcceptances(page, limit);
  }
}