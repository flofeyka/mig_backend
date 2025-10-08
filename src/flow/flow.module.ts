import { Module } from '@nestjs/common';
import { FlowService } from './flow.service';
import { FlowController } from './flow.controller';
import { PrismaModule } from 'prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [FlowController],
  providers: [FlowService],
})
export class FlowModule {}
