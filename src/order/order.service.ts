import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  Media,
  Member,
  Order,
  OrderMedia,
  OrderStatus,
  Prisma,
  Speech,
} from '@prisma/client';
import { OrdersRdo } from './rdo/orders.rdo';
import { fillDto } from '../../common/utils/fillDto';
import { SuccessRdo } from '../../common/rdo/success.rdo';
import { OrderRdo } from './rdo/order.rdo';

@Injectable()
export class OrderService {
  private readonly logger: Logger = new Logger();

  constructor(private readonly prisma: PrismaService) {}

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
            media: true,
          },
        },
        speeches: {
          include: {
            members: {
              include: {
                media: true,
              },
            },
          },
        },
        payment: {
          select: {
            amount: true,
          },
        },
      },
    });

    if (!order) throw new NotFoundException('Order not found');

    return fillDto(
      OrderRdo,
      this.flatOrder(order, isAdmin || order.status === OrderStatus.APPROVED),
    );
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
              media: true,
            },
          },
          speeches: {
            include: {
              members: {
                include: {
                  media: true,
                },
              },
            },
          },
          payment: {
            select: {
              amount: true,
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

  async skipProccessing(id: string, userId: number): Promise<OrderRdo> {
    const order = await this.prisma.order.findUnique({
      where: { id, payment: { userId } },
      include: {
        orderMedia: {
          include: {
            media: true,
          },
        },
        speeches: {
          include: {
            members: {
              include: {
                media: true,
              },
            },
          },
        },
        payment: {
          select: {
            amount: true,
          },
        },
      },
    });

    if (!order) throw new NotFoundException('Order not found');

    if (!order.orderMedia?.length)
      throw new BadRequestException(
        'You have not got requires-proccessing photos for skipping',
      );

    if (order.status !== OrderStatus.PENDING)
      throw new BadRequestException('Invalid status for skip proccessing');

    await this.prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.APPROVED },
    });

    return fillDto(OrderRdo, this.flatOrder(order, true));
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
          speeches: true,
        },
      });

      if (order.status === OrderStatus.APPROVED) {
        await this.prisma.$transaction([
          ...order.orderMedia.map((orderMedia) =>
            this.prisma.orderMedia.update({
              where: { id: orderMedia.id },
              data: {
                buyers: {
                  connect: { id: order.payment.userId },
                },
              },
            }),
          ),
          ...order.speeches.map((speech) =>
            this.prisma.speech.update({
              where: { id: speech.id },
              data: {
                buyers: {
                  connect: { id: order.payment.userId },
                },
              },
            }),
          ),
        ]);
      }

      return fillDto(SuccessRdo, { success: true });
    } catch (e) {
      this.logger.error(`[${id}]: Cannot change order status: ${e}`);
      throw new NotFoundException('Order not found');
    }
  }

  private flatOrder(
    order: Order & {
      orderMedia: Array<OrderMedia & { media: Media }>;
      speeches: Array<Speech & { members: Array<Member & { media: Media[] }> }>;
      payment: { amount: number };
    },
    hasAccess: boolean,
  ) {
    return {
      ...order,
      amount: order.payment.amount,
      speeches: order.speeches.map((speech) => ({
        id: speech.id,
        members: speech.members.map((member) => ({
          id: member.id,
          media: member.media.map((media) => ({
            id: media.id,
            fullVersion: hasAccess ? media.fullVersion : null,
            preview: media.preview,
            price: media.price,
            order: media.order,
          })),
        })),
      })),
      orderMedia: order.orderMedia.map((orderMedia) => ({
        id: orderMedia.id,
        media: {
          id: orderMedia.media.id,
          fullVersion: hasAccess ? orderMedia.media.fullVersion : null,
          preview: orderMedia.media.preview,
          order: orderMedia.media.order,
          price: orderMedia.media.price,
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
