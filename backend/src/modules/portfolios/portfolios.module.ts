import { Module } from '@nestjs/common';
import {
    PortfoliosController,
    PublicPortfolioController,
} from './portfolios.controller';
import { PortfoliosService } from './portfolios.service';

@Module({
    controllers: [PortfoliosController, PublicPortfolioController],
    providers: [PortfoliosService],
})
export class PortfoliosModule {}
