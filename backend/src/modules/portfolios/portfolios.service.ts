import {
    Injectable,
    NotFoundException,
    ConflictException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
    CreatePortfolioDto,
    UpdateConfigDto,
    PublishPortfolioDto,
} from './Dto/portfolio.dto';

@Injectable()
export class PortfoliosService {
    constructor(private readonly prisma: PrismaService) {}

    // ── Helpers ──────────────────────────────────────────────────────────────

    private async findOwnedOrThrow(id: string, ownerToken: string) {
        const portfolio = await this.prisma.portfolio.findUnique({
            where: { id },
        });
        if (!portfolio) throw new NotFoundException('Portfolio not found');
        if (portfolio.ownerToken !== ownerToken)
            throw new ForbiddenException('Access denied');
        return portfolio;
    }

    // ── Public API ───────────────────────────────────────────────────────────

    /** Create a new portfolios draft (called once, on first publish) */
    async create(dto: CreatePortfolioDto, ownerToken: string) {
        const exists = await this.prisma.portfolio.findUnique({
            where: { slug: dto.slug },
        });
        if (exists) throw new ConflictException('Slug already taken');

        return this.prisma.portfolio.create({
            data: {
                slug: dto.slug,
                title: dto.title,
                pageConfig: dto.pageConfig,
                ownerToken,
                isPublished: false,
            },
        });
    }

    /** Auto-save: update pageConfig only (no slug/title changes) */
    async updateConfig(id: string, dto: UpdateConfigDto, ownerToken: string) {
        await this.findOwnedOrThrow(id, ownerToken);

        return this.prisma.portfolio.update({
            where: { id },
            data: { pageConfig: dto.pageConfig },
        });
    }

    /** Publish: set isPublished=true, optionally update slug+title */
    async publish(id: string, dto: PublishPortfolioDto, ownerToken: string) {
        await this.findOwnedOrThrow(id, ownerToken);

        // Check slug conflict (ignore own record)
        const conflict = await this.prisma.portfolio.findFirst({
            where: { slug: dto.slug, NOT: { id } },
        });
        if (conflict) throw new ConflictException('Slug already taken');

        return this.prisma.portfolio.update({
            where: { id },
            data: {
                slug: dto.slug,
                title: dto.title,
                isPublished: true,
            },
        });
    }

    /** Unpublish */
    async unpublish(id: string, ownerToken: string) {
        await this.findOwnedOrThrow(id, ownerToken);

        return this.prisma.portfolio.update({
            where: { id },
            data: { isPublished: false },
        });
    }

    /** Get all portfolios belonging to ownerToken */
    async findAllByOwner(ownerToken: string) {
        return this.prisma.portfolio.findMany({
            where: { ownerToken },
            orderBy: { updatedAt: 'desc' },
            select: {
                id: true,
                slug: true,
                title: true,
                isPublished: true,
                updatedAt: true,
            },
        });
    }

    /** Get one portfolios (owner access) — returns full pageConfig */
    async findOneByOwner(id: string, ownerToken: string) {
        return this.findOwnedOrThrow(id, ownerToken);
    }

    /** Get published portfolios by slug — public route, no auth */
    async findPublicBySlug(slug: string) {
        const portfolio = await this.prisma.portfolio.findUnique({
            where: { slug },
            select: {
                id: true,
                slug: true,
                title: true,
                isPublished: true,
                pageConfig: true,
            },
        });

        if (!portfolio || !portfolio.isPublished) {
            throw new NotFoundException('Portfolio not found');
        }

        return portfolio;
    }

    /** Delete a portfolios */
    async remove(id: string, ownerToken: string) {
        await this.findOwnedOrThrow(id, ownerToken);
        await this.prisma.portfolio.delete({ where: { id } });
    }
}
