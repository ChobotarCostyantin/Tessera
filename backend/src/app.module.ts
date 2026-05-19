import { Module } from '@nestjs/common';
import { PrismaModule } from '@/modules/prisma/prisma.module';
import { PortfoliosModule } from '@/modules/portfolios/portfolios.module.js';

@Module({
    imports: [PrismaModule, PortfoliosModule],
})
export class AppModule {}
