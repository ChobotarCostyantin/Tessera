import {
    Injectable,
    NotFoundException,
    ConflictException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
    CreatePortfolioDto,
    UpdateConfigDto,
    PublishPortfolioDto,
} from '@/modules/portfolios/dto/portfolio.dto';

@Injectable()
export class PortfoliosService {
    constructor(private readonly prisma: PrismaService) {}

    private async findOwnedOrThrow(id: string, ownerToken: string) {
        const portfolio = await this.prisma.portfolio.findUnique({
            where: { id },
        });
        if (!portfolio) throw new NotFoundException('Portfolio not found');
        if (portfolio.ownerToken !== ownerToken)
            throw new ForbiddenException('Access denied');
        return portfolio;
    }

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

    async updateConfig(id: string, dto: UpdateConfigDto, ownerToken: string) {
        await this.findOwnedOrThrow(id, ownerToken);

        return this.prisma.portfolio.update({
            where: { id },
            data: { pageConfig: dto.pageConfig },
        });
    }

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

    async unpublish(id: string, ownerToken: string) {
        await this.findOwnedOrThrow(id, ownerToken);

        return this.prisma.portfolio.update({
            where: { id },
            data: { isPublished: false },
        });
    }

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

    async findOneByOwner(id: string, ownerToken: string) {
        return this.findOwnedOrThrow(id, ownerToken);
    }

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

    async remove(id: string, ownerToken: string) {
        await this.findOwnedOrThrow(id, ownerToken);
        await this.prisma.portfolio.delete({ where: { id } });
    }
}
