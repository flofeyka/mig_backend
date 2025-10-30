import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Media, Order, OrderMedia, OrderStatus, Prisma } from '@prisma/client';
import { OrdersRdo } from './rdo/orders.rdo';
import { fillDto } from '../../common/utils/fillDto';
import { SuccessRdo } from '../../common/rdo/success.rdo';
import { OrderRdo } from './rdo/order.rdo';

@Injectable()
export class OrderService {
  private readonly logger: Logger = new Logger();

  constructor(private readonly prisma: PrismaService) {}

  async createOrder(paymentId: string): Promise<Order> {
    return this.prisma.order.create({ data: { paymentId } });
  }

  async getOrder(
    id: string,
    userId: number,
    isAdmin: boolean,
  ): Promise<OrderRdo> {
    const order = await this.prisma.order.findUnique({
      where: { id, ...(!isAdmin && { payment: { userId } }) },
      include: {
        orderMedia: {
          include: {
            media: {
              select: {
                id: true,
                preview: true,
                order: true,
                fullVersion: isAdmin,
              },
            },
          },
        },
      },
    });

    if (!order) throw new NotFoundException('Order not found');

    return fillDto(OrderRdo, this.flatOrder(order, true));
  }

  async getOrders(
    userId: number,
    isAdmin: boolean,
    page: number = 1,
    limit: number = 15,
    status?: OrderStatus,
  ): Promise<OrdersRdo> {
    const where: Prisma.OrderWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (!isAdmin) {
      where.payment = {};
      where.payment.userId = userId;
    }

    const [orders, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where,
        include: {
          orderMedia: {
            include: {
              media: {
                select: {
                  id: true,
                  preview: true,
                  order: true,
                  fullVersion: isAdmin,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return fillDto(OrdersRdo, {
      orders: orders.map((order) =>
        this.flatOrder(order, order.status === OrderStatus.APPROVED),
      ),
      total,
    });
  }

  async changeStatus(id: string, status: OrderStatus): Promise<SuccessRdo> {
    try {
      const order = await this.prisma.order.update({
        where: { id },
        data: { status },
        include: {
          payment: true,
          orderMedia: {
            include: {
              media: true,
            },
          },
        },
      });

      if (order.status === OrderStatus.APPROVED) {
        await this.prisma.$transaction(
          order.orderMedia.map((orderMedia) =>
            this.prisma.orderMedia.update({
              where: { id: orderMedia.id },
              data: {
                buyers: {
                  connect: { id: order.payment.userId },
                },
              },
            }),
          ),
        );
      }

      return fillDto(SuccessRdo, { success: true });
    } catch (e) {
      this.logger.error(`[${id}]: Cannot change order status: ${e}`);
      throw new NotFoundException('Order not found');
    }
  }

  private flatOrder(
    order: Order & {
      orderMedia: Array<OrderMedia & { media: Partial<Media> }>;
    },
    hasAccess: boolean,
  ) {
    return {
      ...order,
      orderMedia: order.orderMedia.map((orderMedia) => ({
        id: orderMedia.id,
        media: {
          id: orderMedia.media.id,
          fullVersion: hasAccess ? orderMedia.media.fullVersion : null,
          preview: orderMedia.media.preview,
          order: orderMedia.media.order,
        },
        processedFullVersion: hasAccess
          ? orderMedia.processedFullVersion
          : null,
        processedPreview: hasAccess ? orderMedia.processedPreview : null,
        displayOrder: orderMedia.displayOrder,
      })),
    };
  }
}
