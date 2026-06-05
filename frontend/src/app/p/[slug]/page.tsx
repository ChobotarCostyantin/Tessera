'use client';

import React, { useEffect, useState, useRef } from 'react';
import '@/styles/widget-hover-animation.css';
import { getPublicPortfolio } from '@/lib/api/portfolios';
import { PublicPortfolio } from '@/lib/schemas/portfolio';
import { Widget, WidgetLayout } from '@/types/widget';
import { CELL_PX, GAP_PX, CANVAS_W, getWidgetContainerStyle } from '@/lib/widgetConfig';
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

// Hook: tracks container width and returns scale factor for the canvas
function useCanvasScale(canvasNativeWidth: number) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const observer = new ResizeObserver(([entry]) => {
            const available = entry.contentRect.width;
            setScale(Math.min(1, available / canvasNativeWidth));
        });

        observer.observe(el);
        return () => observer.disconnect();
    }, [canvasNativeWidth]);

    return { containerRef, scale };
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
                        <p className="text-[12px]" style={{ color: 'var(--t-muted)' }}>
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
                    <h1 className="text-[22px] font-semibold" style={{ color: 'var(--t-text)' }}>
                        Portfolio not found
                    </h1>
                    <p className="text-[13px]" style={{ color: 'var(--t-muted)' }}>
                        <span style={{ color: 'var(--t-accent)', fontFamily: 'monospace' }}>
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
                    <h1 className="text-[18px] font-semibold" style={{ color: 'var(--t-text)' }}>
                        Something went wrong
                    </h1>
                    <p className="text-[13px]" style={{ color: 'var(--t-muted)' }}>
                        Failed to load the portfolio. Try refreshing.
                    </p>
                </div>
            </Shell>
        );
    }

    const { widgets, layouts } = parseConfig(portfolio!.pageConfig);

    return (
        <Shell title={portfolio!.title}>
            <ScaledCanvas widgets={widgets} layouts={layouts} />

            {widgets.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 gap-3 opacity-50">
                    <span className="text-4xl">🌱</span>
                    <p className="text-[13px]" style={{ color: 'var(--t-muted)' }}>
                        This portfolio is empty.
                    </p>
                </div>
            )}
        </Shell>
    );
}

// ── ScaledCanvas ──────────────────────────────────────────────────────────────
// Renders the bento grid scaled down to fit any viewport width.
// Uses ResizeObserver so it reacts to orientation changes too.

function ScaledCanvas({ widgets, layouts }: { widgets: Widget[]; layouts: WidgetLayout[] }) {
    const { containerRef, scale } = useCanvasScale(CANVAS_W);

    const maxRow = Math.max(10, ...layouts.map((l) => l.y + l.h));
    const canvasH = maxRow * (CELL_PX + GAP_PX) - GAP_PX;

    return (
        // Outer div is measured by ResizeObserver — full available width
        <div ref={containerRef} style={{ width: '100%' }}>
            {/*
              Wrapper shrinks to the scaled canvas height so the page flow is correct.
              Without this the scaled element still occupies its native height.
            */}
            <div
                style={{
                    width: CANVAS_W * scale,
                    height: canvasH * scale,
                    margin: '0 auto',
                    position: 'relative',
                }}
            >
                {/* Native-size canvas, scaled down via transform */}
                <div
                    style={{
                        width: CANVAS_W,
                        height: canvasH,
                        transformOrigin: 'top left',
                        transform: `scale(${scale})`,
                        position: 'absolute',
                        top: 0,
                        left: 0,
                    }}
                >
                    {widgets.map((widget, index) => {
                        const layout = layouts.find((l) => l.id === widget.id);
                        if (!layout) return null;

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
        </div>
    );
}

// ── Shell layout ──────────────────────────────────────────────────────────────

function Shell({ children, title }: { children: React.ReactNode; title?: string }) {
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
                className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4"
                style={{
                    background: 'rgba(15,15,16,0.85)',
                    backdropFilter: 'blur(12px)',
                    borderBottom: '0.5px solid var(--t-border)',
                }}
            >
                {/* Logo */}
                <a
                    href="/editor"
                    className="flex items-center gap-2 text-[14px] font-semibold tracking-tight no-underline shrink-0"
                    style={{ color: 'var(--t-text)' }}
                >
                    <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: 'var(--t-accent)' }}
                    />
                    Tessera
                </a>

                {/* Title — hidden on very small screens to avoid crowding */}
                {title && (
                    <span
                        className="hidden sm:block text-[14px] truncate mx-4"
                        style={{ color: 'var(--t-muted)', fontFamily: 'monospace' }}
                    >
                        {title}
                    </span>
                )}

                {/* CTA */}
                <a
                    href="/editor"
                    className="px-3 py-1.5 rounded-lg text-[12px] font-medium no-underline shrink-0"
                    style={{
                        background: 'var(--t-surface2)',
                        color: 'var(--t-text)',
                        border: '0.5px solid var(--t-border)',
                    }}
                >
                    {/* Short label on mobile, full on desktop */}
                    <span className="sm:hidden">Create →</span>
                    <span className="hidden sm:inline">Create yours →</span>
                </a>
            </nav>

            {/* Title shown below nav on mobile */}
            {title && (
                <div
                    className="sm:hidden px-4 pt-5 pb-1 text-center text-[18px] font-semibold truncate"
                    style={{ color: 'var(--t-text)' }}
                >
                    {title}
                </div>
            )}

            <main className="flex-1 px-2 py-6 sm:px-4 sm:py-10">{children}</main>

            <footer className="mt-auto pt-10 pb-8 text-center">
                <a
                    href="/"
                    className="text-[11px] font-medium"
                    style={{ color: 'var(--t-muted)', textDecoration: 'none', opacity: 0.5 }}
                >
                    Built with Tessera
                </a>
            </footer>

            <style>{`
                @keyframes widgetEntry {
                    0%  { opacity: 0; transform: scale(0.95) translateY(20px); }
                    100%{ opacity: 1; transform: scale(1)    translateY(0);     }
                }
            `}</style>
        </div>
    );
}