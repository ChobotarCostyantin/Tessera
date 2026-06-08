import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    HttpCode,
    HttpStatus,
    UseGuards,
} from '@nestjs/common';
import { PortfoliosService } from './portfolios.service';
import {
    CreatePortfolioDto,
    UpdateConfigDto,
    PublishPortfolioDto,
} from '@/modules/portfolios/dto/portfolio.dto';
import { OwnerToken } from '@/common/decorators/owner-token.decorator';
import { OwnerGuard } from '@/common/guards/owner.guard';

@Controller('portfolios')
@UseGuards(OwnerGuard)
export class PortfoliosController {
    constructor(private readonly portfoliosService: PortfoliosService) {}

    @Get()
    findAll(@OwnerToken() ownerToken: string) {
        return this.portfoliosService.findAllByOwner(ownerToken);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @OwnerToken() ownerToken: string) {
        return this.portfoliosService.findOneByOwner(id, ownerToken);
    }

    @Post()
    create(@Body() dto: CreatePortfolioDto, @OwnerToken() ownerToken: string) {
        return this.portfoliosService.create(dto, ownerToken);
    }

    @Patch(':id/config')
    updateConfig(
        @Param('id') id: string,
        @Body() dto: UpdateConfigDto,
        @OwnerToken() ownerToken: string,
    ) {
        return this.portfoliosService.updateConfig(id, dto, ownerToken);
    }

    @Patch(':id/publish')
    publish(
        @Param('id') id: string,
        @Body() dto: PublishPortfolioDto,
        @OwnerToken() ownerToken: string,
    ) {
        return this.portfoliosService.publish(id, dto, ownerToken);
    }

    @Patch(':id/unpublish')
    @HttpCode(HttpStatus.OK)
    unpublish(@Param('id') id: string, @OwnerToken() ownerToken: string) {
        return this.portfoliosService.unpublish(id, ownerToken);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id') id: string, @OwnerToken() ownerToken: string) {
        return this.portfoliosService.remove(id, ownerToken);
    }
}

@Controller('p')
export class PublicPortfolioController {
    constructor(private readonly portfoliosService: PortfoliosService) {}

    @Get(':slug')
    findBySlug(@Param('slug') slug: string) {
        return this.portfoliosService.findPublicBySlug(slug);
    }
}
