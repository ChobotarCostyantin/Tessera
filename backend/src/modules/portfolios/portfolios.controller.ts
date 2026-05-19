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
} from './Dto/portfolio.dto';
import {OwnerToken} from "@/common/decorators/owner-token.decorator";
import {OwnerGuard} from "@/common/guards/owner.guard";

@Controller('portfolios')
@UseGuards(OwnerGuard)
export class PortfoliosController {
    constructor(private readonly portfoliosService: PortfoliosService) {}

    // ── Owner routes ─────────────────────────────────────────────────────────

    /** List all portfolios for current owner */
    @Get()
    findAll(@OwnerToken() ownerToken: string) {
        return this.portfoliosService.findAllByOwner(ownerToken);
    }

    /** Get single portfolios (full data incl. pageConfig) */
    @Get(':id')
    findOne(
        @Param('id') id: string,
        @OwnerToken() ownerToken: string,
    ) {
        return this.portfoliosService.findOneByOwner(id, ownerToken);
    }

    /** Create portfolios draft on first publish */
    @Post()
    create(
        @Body() dto: CreatePortfolioDto,
        @OwnerToken() ownerToken: string,
    ) {
        return this.portfoliosService.create(dto, ownerToken);
    }

    /** Auto-save: persist pageConfig (debounced on frontend) */
    @Patch(':id/config')
    updateConfig(
        @Param('id') id: string,
        @Body() dto: UpdateConfigDto,
        @OwnerToken() ownerToken: string,
    ) {
        return this.portfoliosService.updateConfig(id, dto, ownerToken);
    }

    /** Publish: set isPublished=true, confirm slug+title */
    @Patch(':id/publish')
    publish(
        @Param('id') id: string,
        @Body() dto: PublishPortfolioDto,
        @OwnerToken() ownerToken: string,
    ) {
        return this.portfoliosService.publish(id, dto, ownerToken);
    }

    /** Unpublish */
    @Patch(':id/unpublish')
    @HttpCode(HttpStatus.OK)
    unpublish(
        @Param('id') id: string,
        @OwnerToken() ownerToken: string,
    ) {
        return this.portfoliosService.unpublish(id, ownerToken);
    }

    /** Delete */
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(
        @Param('id') id: string,
        @OwnerToken() ownerToken: string,
    ) {
        return this.portfoliosService.remove(id, ownerToken);
    }
}

// ── Public route (separate controller, no auth) ───────────────────────────────

@Controller('p')
export class PublicPortfolioController {
    constructor(private readonly portfoliosService: PortfoliosService) {}

    /** Public portfolios page by slug */
    @Get(':slug')
    findBySlug(@Param('slug') slug: string) {
        return this.portfoliosService.findPublicBySlug(slug);
    }
}
