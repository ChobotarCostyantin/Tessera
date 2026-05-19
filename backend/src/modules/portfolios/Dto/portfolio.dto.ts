import { Prisma } from '@prisma/client';
import { IsString, IsNotEmpty, Matches, IsObject, IsOptional } from 'class-validator';

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class CreatePortfolioDto {
    @IsString()
    @IsNotEmpty()
    @Matches(SLUG_REGEX, { message: 'Invalid slug format' })
    slug: string;

    @IsString()
    @IsNotEmpty()
    title: string;

    @IsOptional()
    @IsObject()
    pageConfig: Prisma.InputJsonValue;
}

export class UpdateConfigDto {
    @IsOptional()
    @IsObject()
    pageConfig: Prisma.InputJsonValue;
}

export class PublishPortfolioDto {
    @IsString()
    @IsNotEmpty()
    @Matches(SLUG_REGEX, { message: 'Invalid slug format' })
    slug: string;

    @IsString()
    @IsNotEmpty()
    title: string;
}
