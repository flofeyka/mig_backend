import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Media, Order, OrderStatus, Prisma } from '@prisma/client';
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
        payment: {
          select: {
            medias: {
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

    return fillDto(OrderRdo, this.flatOrder(order));
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
          payment: {
            select: {
              medias: {
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
      orders: orders.map((order) => this.flatOrder(order)),
      total,
    });
  }

  async changeStatus(id: string, status: OrderStatus): Promise<SuccessRdo> {
    try {
      const order = await this.prisma.order.update({
        where: { id },
        data: { status },
        include: {
          payment: {
            select: {
              userId: true,
            },
          },
        },
      });

      if (order.status === OrderStatus.APPROVED) {
        const mediaList = await this.prisma.media.findMany({
          where: { payments: { some: { id: order.paymentId } } },
          select: { id: true },
        });

        await this.prisma.$transaction(
          mediaList.map((media) =>
            this.prisma.media.update({
              where: { id: media.id },
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

  private flatOrder(order: Order & { payment: { medias: Partial<Media>[] } }) {
    return {
      ...order,
      medias: order.payment.medias,
    };
  }
}
