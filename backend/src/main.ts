import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import express from 'express';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ limit: '10mb', extended: true }));

    app.enableCors({
        origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
        methods: ['GET', 'POST', 'PATCH', 'DELETE'],
        allowedHeaders: ['Content-Type', 'x-owner-token'],
    });

    app.setGlobalPrefix('api/v1');

    await app.listen(process.env.PORT ?? 3010);
}

void bootstrap().catch((err) => {
    console.error('Fatal error during bootstrap', err);
    process.exit(1);
});
