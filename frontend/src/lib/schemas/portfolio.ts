import { z } from 'zod';

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const CreatePortfolioSchema = z.object({
    slug: z
        .string()
        .min(1, 'Slug is required')
        .regex(SLUG_REGEX, 'Only lowercase letters, numbers, and hyphens'),
    title: z.string().min(1, 'Title is required'),
    pageConfig: z.record(z.string(), z.unknown()).optional().default({}),
});

export const UpdateConfigSchema = z.object({
    pageConfig: z.record(z.string(), z.unknown()),
});

export const PublishPortfolioSchema = z.object({
    slug: z
        .string()
        .min(1, 'Slug is required')
        .regex(SLUG_REGEX, 'Only lowercase letters, numbers, and hyphens'),
    title: z.string().min(1, 'Title is required'),
});

export const PortfolioSummarySchema = z.object({
    id: z.string(),
    slug: z.string(),
    title: z.string(),
    isPublished: z.boolean(),
    updatedAt: z.string(),
});

export const PortfolioFullSchema = z.object({
    id: z.string(),
    slug: z.string(),
    title: z.string(),
    isPublished: z.boolean(),
    pageConfig: z.record(z.string(), z.unknown()),
    ownerToken: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export const PublicPortfolioSchema = z.object({
    id: z.string(),
    slug: z.string(),
    title: z.string(),
    isPublished: z.boolean(),
    pageConfig: z.record(z.string(), z.unknown()),
});

export type CreatePortfolioDto = z.infer<typeof CreatePortfolioSchema>;
export type UpdateConfigDto = z.infer<typeof UpdateConfigSchema>;
export type PublishPortfolioDto = z.infer<typeof PublishPortfolioSchema>;
export type PortfolioSummary = z.infer<typeof PortfolioSummarySchema>;
export type PortfolioFull = z.infer<typeof PortfolioFullSchema>;
export type PublicPortfolio = z.infer<typeof PublicPortfolioSchema>;
