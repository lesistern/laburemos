import {
  WebSocketGateway as WSGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../common/redis/redis.service';

@WSGateway({
  cors: {
    origin: process.env.WS_CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
  namespace: '/notifications',
})
export class WebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebSocketGateway.name);
  private connectedUsers = new Map<number, Set<string>>();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private redis: RedisService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        this.logger.warn(`WebSocket connection rejected: No token provided`);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('jwt.secret'),
      });

      const userId = payload.sub;
      client.data.userId = userId;

      // Add user to connected users map
      if (!this.connectedUsers.has(userId)) {
        this.connectedUsers.set(userId, new Set());
      }
      this.connectedUsers.get(userId).add(client.id);

      // Join user to their personal room
      await client.join(`user:${userId}`);

      // Store connection in Redis for horizontal scaling
      await this.redis.sadd(`ws_connections:${userId}`, client.id);

      this.logger.log(`User ${userId} connected via WebSocket (${client.id})`);

      // Send connection confirmation
      client.emit('connected', {
        message: 'Successfully connected to notifications',
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      this.logger.error('WebSocket authentication failed:', error.message);
      client.emit('error', { message: 'Authentication failed' });
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    
    if (userId) {
      // Remove from connected users map
      const userConnections = this.connectedUsers.get(userId);
      if (userConnections) {
        userConnections.delete(client.id);
        if (userConnections.size === 0) {
          this.connectedUsers.delete(userId);
        }
      }

      // Remove from Redis
      await this.redis.srem(`ws_connections:${userId}`, client.id);

      this.logger.log(`User ${userId} disconnected from WebSocket (${client.id})`);
    }
  }

  @SubscribeMessage('join-project')
  async handleJoinProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: number },
  ) {
    const userId = client.data.userId;
    const { projectId } = data;

    // TODO: Verify user has access to this project
    await client.join(`project:${projectId}`);
    
    this.logger.log(`User ${userId} joined project room: ${projectId}`);
    
    client.emit('joined-project', {
      projectId,
      message: `Joined project ${projectId} notifications`,
    });
  }

  @SubscribeMessage('leave-project')
  async handleLeaveProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: number },
  ) {
    const userId = client.data.userId;
    const { projectId } = data;

    await client.leave(`project:${projectId}`);
    
    this.logger.log(`User ${userId} left project room: ${projectId}`);
    
    client.emit('left-project', {
      projectId,
      message: `Left project ${projectId} notifications`,
    });
  }

  @SubscribeMessage('mark-notification-read')
  async handleMarkNotificationRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { notificationId: number },
  ) {
    const userId = client.data.userId;
    const { notificationId } = data;

    // TODO: Mark notification as read in database
    this.logger.log(`User ${userId} marked notification ${notificationId} as read`);
    
    client.emit('notification-marked-read', {
      notificationId,
      timestamp: new Date().toISOString(),
    });
  }

  // Methods for sending notifications

  async sendToUser(userId: number, event: string, data: any) {
    const room = `user:${userId}`;
    
    this.server.to(room).emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });

    // Store notification in Redis for offline users
    await this.redis.lpush(
      `offline_notifications:${userId}`,
      JSON.stringify({ event, data, timestamp: new Date().toISOString() }),
    );

    // Keep only last 50 notifications
    // TODO: Implement trimming logic with Redis client
    // await this.redis.ltrim(`offline_notifications:${userId}`, 0, 49);

    this.logger.debug(`Sent ${event} to user ${userId}`);
  }

  async sendToProject(projectId: number, event: string, data: any) {
    const room = `project:${projectId}`;
    
    this.server.to(room).emit(event, {
      ...data,
      projectId,
      timestamp: new Date().toISOString(),
    });

    this.logger.debug(`Sent ${event} to project ${projectId}`);
  }

  async sendToAll(event: string, data: any) {
    this.server.emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });

    this.logger.debug(`Broadcast ${event} to all connected users`);
  }

  async getOfflineNotifications(userId: number): Promise<any[]> {
    const notifications = await this.redis.lrange(`offline_notifications:${userId}`, 0, -1);
    
    // Clear offline notifications after retrieving
    await this.redis.del(`offline_notifications:${userId}`);
    
    return notifications.map(notification => JSON.parse(notification));
  }

  isUserConnected(userId: number): boolean {
    return this.connectedUsers.has(userId);
  }

  getUserConnectionCount(userId: number): number {
    return this.connectedUsers.get(userId)?.size || 0;
  }

  getTotalConnections(): number {
    let total = 0;
    for (const connections of this.connectedUsers.values()) {
      total += connections.size;
    }
    return total;
  }

  getConnectedUsers(): number[] {
    return Array.from(this.connectedUsers.keys());
  }
}