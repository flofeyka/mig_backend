import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import AdminJS from 'adminjs';
import * as AdminJSPrisma from '@adminjs/prisma';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();

    AdminJS.registerAdapter({
      Resource: AdminJSPrisma.Resource,
      Database: AdminJSPrisma.Database,
    });

    // Автоматически подхватываем все модели
    const models = Object.keys(this).filter((key) => {
      const potentialModel = (this as any)[key];
      // Проверяем, что объект существует и у него есть метод findMany
      return potentialModel && typeof potentialModel.findMany === 'function';
    });

    const resources = models
      .map((modelName) => {
        const model = (this as any)[modelName];
        if (!model || typeof model.findMany !== 'function') return null;
        return {
          resource: { model, client: this },
          options: { navigation: 'Авто-модели' },
        };
      })
      .filter(Boolean);

    console.log('AdminJS resources:', models);
  }
}
