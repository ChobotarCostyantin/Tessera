'use client';

import React, { useEffect, useState } from 'react';
import { Widget, WidgetLayout } from '@/types/widget';
import {
    CELL_PX,
    GAP_PX,
    CANVAS_W,
    getWidgetContainerStyle,
} from '@/lib/widgetConfig';
import '@/styles/widget-hover-animation.css';
import { WidgetRenderer } from './WidgetRenderer';
import { getPortfolio } from '@/lib/api/portfolios';

interface PortfolioPreviewProps {
    initialWidgets: Widget[];
    initialLayouts: WidgetLayout[];
    portfolioId: string | null;
}

export function PortfolioPreview({
    initialWidgets,
    initialLayouts,
    portfolioId,
}: PortfolioPreviewProps) {
    const [widgets, setWidgets] = useState<Widget[]>(initialWidgets);
    const [layouts, setLayouts] = useState<WidgetLayout[]>(initialLayouts);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (portfolioId) {
            setIsLoading(true);
            getPortfolio(portfolioId)
                .then((data) => {
                    const config = data.pageConfig as any;
                    if (config?.widgets && config?.layouts) {
                        setWidgets(config.widgets);
                        setLayouts(config.layouts);
                    }
                })
                .catch((err) =>
                    console.error('Failed to load portfolio config:', err),
                )
                .finally(() => setIsLoading(false));
        } else {
            setWidgets(initialWidgets);
            setLayouts(initialLayouts);
        }
    }, [portfolioId, initialWidgets, initialLayouts]);

    const maxRow = Math.max(10, ...layouts.map((l) => l.y + l.h));
    const canvasH = maxRow * (CELL_PX + GAP_PX) - GAP_PX;

    const PREVIEW_MAX_W = 1000;
    const scale = Math.min(1, PREVIEW_MAX_W / CANVAS_W);

    return (
        <div className="flex flex-col items-center">
            <p
                className="text-[10px] font-semibold uppercase tracking-widest mb-4 flex items-center gap-2"
                style={{ color: 'var(--t-muted)' }}
            >
                Live Preview
                {isLoading && (
                    <span
                        className="w-3 h-3 rounded-full border-2 border-t-transparent animate-spin"
                        style={{
                            borderColor: 'var(--t-muted)',
                            borderTopColor: 'var(--t-accent)',
                        }}
                    />
                )}
            </p>

            <div
                style={{
                    width: CANVAS_W * scale + 10,
                    height: canvasH * scale + 10,
                    overflow: 'hidden',
                    border: '0.5px solid var(--t-border)',
                    background: 'var(--t-bg)',
                    position: 'relative',
                    opacity: isLoading ? 0.5 : 1,
                    transition: 'opacity 0.2s ease',
                    padding: '5px',
                    boxSizing: 'border-box',
                }}
            >
                <div
                    style={{
                        width: CANVAS_W,
                        height: canvasH,
                        transformOrigin: 'top left',
                        transform: `scale(${scale})`,
                        position: 'relative',
                    }}
                >
                    {widgets.map((widget) => {
                        const layout = layouts.find((l) => l.id === widget.id);
                        if (!layout) return null;

                        const { className, style } = getWidgetContainerStyle(
                            widget,
                            layout,
                        );

                        return (
                            <div
                                key={widget.id}
                                className={className}
                                style={{
                                    ...style,
                                    position: 'absolute',
                                    left: layout.x * (CELL_PX + GAP_PX),
                                    top: layout.y * (CELL_PX + GAP_PX),
                                }}
                            >
                                <WidgetRenderer widget={widget} />
                            </div>
                        );
                    })}
                </div>
            </div>

            {widgets.length === 0 && !isLoading && (
                <p
                    className="text-[12px] mt-6"
                    style={{ color: 'var(--t-muted)' }}
                >
                    No widgets yet — add some from the sidebar.
                </p>
            )}
        </div>
    );
}
