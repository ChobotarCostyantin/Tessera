'use client';

import React, { useEffect, useState } from 'react';
import '@/styles/widget-hover-animation.css';
import { getPublicPortfolio } from '@/lib/api/portfolios';
import { PublicPortfolio } from '@/lib/schemas/portfolio';
import { Widget, WidgetLayout } from '@/types/widget';
import {CELL_PX, GAP_PX, CANVAS_W, getWidgetContainerStyle} from '@/lib/widgetConfig';
import { WidgetRenderer } from '@/app/editor/_components/WidgetRenderer';

interface PageConfig {
    widgets: Widget[];
    layouts: WidgetLayout[];
}

function parseConfig(raw: Record<string, unknown>): PageConfig {
    return {
        widgets: (raw.widgets as Widget[]) ?? [],
        layouts: (raw.layouts as WidgetLayout[]) ?? [],
    };
}

export default function PublicPortfolioPage({
                                                params,
                                            }: {
    params: Promise<{ slug: string }>;
}) {
    const [portfolio, setPortfolio] = useState<PublicPortfolio | null>(null);
    const [error, setError] = useState<'not_found' | 'error' | null>(null);
    const [slug, setSlug] = useState('');

    useEffect(() => {
        params.then(({ slug: s }) => {
            setSlug(s);
            getPublicPortfolio(s)
                .then(setPortfolio)
                .catch((err: unknown) => {
                    const msg = err instanceof Error ? err.message : '';
                    setError(msg.includes('404') ? 'not_found' : 'error');
                });
        });
    }, [params]);

    // ── Loading ───────────────────────────────────────────────────────────────
    if (!portfolio && !error) {
        return (
            <Shell>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="flex flex-col items-center gap-4">
                        <div
                            className="w-8 h-8 rounded-full border-2 animate-spin"
                            style={{
                                borderColor: 'var(--t-border)',
                                borderTopColor: 'var(--t-accent)',
                            }}
                        />
                        <p
                            className="text-[12px]"
                            style={{ color: 'var(--t-muted)' }}
                        >
                            Loading portfolio…
                        </p>
                    </div>
                </div>
            </Shell>
        );
    }

    // ── Not found ─────────────────────────────────────────────────────────────
    if (error === 'not_found') {
        return (
            <Shell>
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
                    <span className="text-5xl">🌫</span>
                    <h1
                        className="text-[22px] font-semibold"
                        style={{ color: 'var(--t-text)' }}
                    >
                        Portfolio not found
                    </h1>
                    <p
                        className="text-[13px]"
                        style={{ color: 'var(--t-muted)' }}
                    >
                        <span
                            style={{
                                color: 'var(--t-accent)',
                                fontFamily: 'monospace',
                            }}
                        >
                            /p/{slug}
                        </span>{' '}
                        doesn&apos;t exist or isn&apos;t published yet.
                    </p>
                </div>
            </Shell>
        );
    }

    // ── Error ─────────────────────────────────────────────────────────────────
    if (error === 'error') {
        return (
            <Shell>
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center">
                    <span className="text-5xl">⚡</span>
                    <h1
                        className="text-[18px] font-semibold"
                        style={{ color: 'var(--t-text)' }}
                    >
                        Something went wrong
                    </h1>
                    <p
                        className="text-[13px]"
                        style={{ color: 'var(--t-muted)' }}
                    >
                        Failed to load the portfolio. Try refreshing.
                    </p>
                </div>
            </Shell>
        );
    }

    const { widgets, layouts } = parseConfig(portfolio!.pageConfig);
    const maxRow = Math.max(10, ...layouts.map((l) => l.y + l.h));
    const canvasH = maxRow * (CELL_PX + GAP_PX) - GAP_PX;

    return (
        <Shell title={portfolio!.title}>
            {/* Bento canvas */}
            <div
                className="relative mx-auto overflow-x-auto"
                style={{
                    width: '100%',
                    maxWidth: CANVAS_W + 10,
                    padding: '5px',
                    boxSizing: 'border-box',
                }}
            >
                <div
                    style={{
                        position: 'relative',
                        width: CANVAS_W,
                        height: canvasH,
                        margin: '0 auto',
                    }}
                >
                    {widgets.map((widget, index) => {
                        const layout = layouts.find((l) => l.id === widget.id);
                        if (!layout) return null;

                        // Беремо універсальні стилі
                        const { className, style } = getWidgetContainerStyle(widget, layout);

                        return (
                            <div
                                key={widget.id}
                                className={className}
                                style={{
                                    ...style,
                                    position: 'absolute',
                                    left: layout.x * (CELL_PX + GAP_PX),
                                    top: layout.y * (CELL_PX + GAP_PX),

                                    animation: 'widgetEntry 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                                    animationDelay: `${index * 50}ms`,
                                    animationFillMode: 'backwards',
                                }}
                            >
                                <WidgetRenderer widget={widget} />
                            </div>
                        );
                    })}
                </div>
            </div>

            {widgets.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 gap-3 opacity-50">
                    <span className="text-4xl">🌱</span>
                    <p
                        className="text-[13px]"
                        style={{ color: 'var(--t-muted)' }}
                    >
                        This portfolio is empty.
                    </p>
                </div>
            )}
        </Shell>
    );
}

// ── Shell layout ──────────────────────────────────────────────────────────────

function Shell({
                   children,
                   title,
               }: {
    children: React.ReactNode;
    title?: string;
}) {
    return (
        <div
            className="flex flex-col"
            style={{
                minHeight: '100dvh',
                background: 'var(--t-bg)',
                color: 'var(--t-text)',
                fontFamily: "'DM Sans', sans-serif",
            }}
        >
            {/* Nav */}
            <nav
                className="sticky top-0 z-10 flex items-center justify-between px-6 py-4"
                style={{
                    background: 'rgba(15,15,16,0.85)',
                    backdropFilter: 'blur(12px)',
                    borderBottom: '0.5px solid var(--t-border)',
                }}
            >
                <a
                    href="/editor"
                    className="flex items-center gap-2 text-[14px] font-semibold tracking-tight no-underline"
                    style={{ color: 'var(--t-text)' }}
                >
                    <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: 'var(--t-accent)' }}
                    />
                    Tessera
                </a>

                {title && (
                    <span
                        className="text-2xl"
                        style={{
                            color: 'var(--t-muted)',
                            fontFamily: 'monospace',
                        }}
                    >
                        {title}
                    </span>
                )}

                <a
                    href="/editor"
                    className="px-3 py-1.5 rounded-lg text-[12px] font-medium no-underline"
                    style={{
                        background: 'var(--t-surface2)',
                        color: 'var(--t-text)',
                        border: '0.5px solid var(--t-border)',
                    }}
                >
                    Create yours →
                </a>
            </nav>

            <main className="flex-1 px-4 py-10">{children}</main>

            <footer className="mt-auto pt-10 pb-8 text-center">
                <a
                    href="/"
                    className="text-[11px] font-medium"
                    style={{
                        color: 'var(--t-muted)',
                        textDecoration: 'none',
                        opacity: 0.5,
                    }}
                >
                    Built with Tessera
                </a>
            </footer>

            {/* Добавили keyframes для анимации появления виджетов */}
            <style>{`
                @keyframes widgetEntry {
                    0% {
                        opacity: 0;
                        transform: scale(0.95) translateY(20px);
                    }
                    100% {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }
            `}</style>
        </div>
    );
}