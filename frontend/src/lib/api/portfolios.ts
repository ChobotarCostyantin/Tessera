import { api } from './client';
import {
    CreatePortfolioDto,
    UpdateConfigDto,
    PublishPortfolioDto,
    PortfolioSummarySchema,
    PortfolioFullSchema,
    PublicPortfolioSchema,
    PortfolioSummary,
    PortfolioFull,
    PublicPortfolio,
} from '@/lib/schemas/portfolio';
import { z } from 'zod';

// ── Owner endpoints ───────────────────────────────────────────────────────────

export async function listPortfolios(): Promise<PortfolioSummary[]> {
    return api.get('portfolios').json(z.array(PortfolioSummarySchema));
}

export async function getPortfolio(id: string): Promise<PortfolioFull> {
    return api.get(`portfolios/${id}`).json(PortfolioFullSchema);
}

export async function createPortfolio(
    dto: CreatePortfolioDto,
): Promise<PortfolioFull> {
    return api.post('portfolios', { json: dto }).json(PortfolioFullSchema);
}

export async function updateConfig(
    id: string,
    dto: UpdateConfigDto,
): Promise<PortfolioFull> {
    return api
        .patch(`portfolios/${id}/config`, { json: dto })
        .json(PortfolioFullSchema);
}

export async function publishPortfolio(
    id: string,
    dto: PublishPortfolioDto,
): Promise<PortfolioFull> {
    return api
        .patch(`portfolios/${id}/publish`, { json: dto })
        .json(PortfolioFullSchema);
}

export async function unpublishPortfolio(id: string): Promise<PortfolioFull> {
    return api.patch(`portfolios/${id}/unpublish`).json(PortfolioFullSchema);
}

export async function deletePortfolio(id: string): Promise<void> {
    await api.delete(`portfolios/${id}`);
}

// ── Public endpoint (no auth header needed) ───────────────────────────────────

export async function getPublicPortfolio(
    slug: string,
): Promise<PublicPortfolio> {
    return api.get(`p/${slug}`).json(PublicPortfolioSchema);
}
