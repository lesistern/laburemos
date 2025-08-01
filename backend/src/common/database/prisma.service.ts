import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient, Prisma } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient<Prisma.PrismaClientOptions, 'query' | 'error' | 'info' | 'warn'> implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(private configService: ConfigService) {
    super({
      datasources: {
        db: {
          url: configService.get<string>('database.url'),
        },
      },
      log: [
        {
          emit: 'event',
          level: 'query',
        },
        {
          emit: 'event',
          level: 'error',
        },
        {
          emit: 'event',
          level: 'info',
        },
        {
          emit: 'event',
          level: 'warn',
        },
      ],
    });

    // Log database queries in development
    if (configService.get<string>('app.nodeEnv') === 'development') {
      this.$on('query', (e: Prisma.QueryEvent) => {
        this.logger.debug(`Query: ${e.query}`);
        this.logger.debug(`Params: ${e.params}`);
        this.logger.debug(`Duration: ${e.duration}ms`);
      });
    }

    this.$on('error', (e: Prisma.LogEvent) => {
      this.logger.error(`Database error: ${e.message}`);
    });

    this.$on('info', (e: Prisma.LogEvent) => {
      this.logger.log(`Database info: ${e.message}`);
    });

    this.$on('warn', (e: Prisma.LogEvent) => {
      this.logger.warn(`Database warning: ${e.message}`);
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Connected to database');
    } catch (error) {
      this.logger.error('❌ Failed to connect to database:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.logger.log('✅ Disconnected from database');
    } catch (error) {
      this.logger.error('❌ Error disconnecting from database:', error);
    }
  }

  /**
   * Enable soft delete functionality
   */
  enableSoftDelete() {
    this.$use(async (params, next) => {
      // Skip soft delete for raw queries
      if (params.action === 'findRaw' || params.action === 'queryRaw') {
        return next(params);
      }

      // Intercept delete operations
      if (params.action === 'delete') {
        params.action = 'update';
        params.args['data'] = { deletedAt: new Date() };
      }

      if (params.action === 'deleteMany') {
        params.action = 'updateMany';
        if (params.args.data != undefined) {
          params.args.data['deletedAt'] = new Date();
        } else {
          params.args['data'] = { deletedAt: new Date() };
        }
      }

      return next(params);
    });

    this.$use(async (params, next) => {
      // Skip for raw queries
      if (params.action === 'findRaw' || params.action === 'queryRaw') {
        return next(params);
      }

      // Add deletedAt filter to read operations
      if (['findFirst', 'findMany', 'count', 'aggregate'].includes(params.action)) {
        if (params.args.where != undefined) {
          if (params.args.where.deletedAt == undefined) {
            params.args.where['deletedAt'] = null;
          }
        } else {
          params.args['where'] = { deletedAt: null };
        }
      }

      return next(params);
    });
  }

  /**
   * Custom transaction wrapper with retry logic
   */
  async transactionWithRetry<T>(
    fn: (prisma: Omit<this, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>) => Promise<T>,
    maxRetries = 3,
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.$transaction(fn);
      } catch (error) {
        lastError = error;
        this.logger.warn(`Transaction attempt ${attempt} failed:`, error.message);

        if (attempt === maxRetries) {
          break;
        }

        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
      }
    }

    this.logger.error(`Transaction failed after ${maxRetries} attempts:`, lastError.message);
    throw lastError;
  }

  /**
   * Health check for the database connection
   */
  async healthCheck(): Promise<{ status: string; message: string }> {
    try {
      await this.$queryRaw`SELECT 1`;
      return {
        status: 'healthy',
        message: 'Database connection is healthy',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Database connection failed: ${error.message}`,
      };
    }
  }

  /**
   * Get database statistics
   */
  async getStats() {
    try {
      const users = await this.user.count();
      const projects = await this.project.count();
      const services = await this.service.count();
      
      return {
        users,
        projects,
        services,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to get database stats:', error);
      return null;
    }
  }
}