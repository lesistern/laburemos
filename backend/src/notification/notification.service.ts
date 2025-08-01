import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserNotifications(userId: number) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async createNotification(data: {
    userId: number;
    type: string;
    title: string;
    message: string;
    link?: string;
    metadata?: any;
  }) {
    return this.prisma.notification.create({ data });
  }

  async markAsRead(userId: number, notificationId: number) {
    return this.prisma.notification.update({
      where: { 
        id: notificationId,
        userId,
      },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: number) {
    return this.prisma.notification.updateMany({
      where: { 
        userId,
        isRead: false,
      },
      data: { isRead: true },
    });
  }

  async getUnreadCount(userId: number) {
    return this.prisma.notification.count({
      where: { 
        userId,
        isRead: false,
      },
    });
  }
}