'use client';

import React from 'react';
import { Widget, WidgetLayout } from '@/types/widget';
import { CELL_PX, GAP_PX, CANVAS_W, gridToPx } from '@/lib/widgetConfig';
import { WidgetRenderer } from './WidgetRenderer';

interface PortfolioPreviewProps {
    widgets: Widget[];
    layouts: WidgetLayout[];
}

/**
 * Read-only live render of the current page config.
 * Used inside PublishModal preview tab.
 * Scales down to fit the modal.
 */
export function PortfolioPreview({ widgets, layouts }: PortfolioPreviewProps) {
    const maxRow = Math.max(10, ...layouts.map((l) => l.y + l.h));
    const canvasH = maxRow * (CELL_PX + GAP_PX) - GAP_PX;

    // Scale to fit modal preview area (modal body ~56vw, we use 90% of that)
    const PREVIEW_MAX_W = 700;
    const scale = Math.min(1, PREVIEW_MAX_W / CANVAS_W);

    return (
        <div className="flex flex-col items-center">
            <p
                className="text-[10px] font-semibold uppercase tracking-widest mb-4"
                style={{ color: 'var(--t-muted)' }}
            >
                Live Preview
            </p>

            <div
                style={{
                    width: CANVAS_W * scale,
                    height: canvasH * scale,
                    overflow: 'hidden',
                    borderRadius: 12,
                    border: '0.5px solid var(--t-border)',
                    background: 'var(--t-bg)',
                    position: 'relative',
                }}
            >
                {/* Scaled canvas */}
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

                        const ap = widget.appearance;
                        const x = layout.x * (CELL_PX + GAP_PX);
                        const y = layout.y * (CELL_PX + GAP_PX);

                        return (
                            <div
                                key={widget.id}
                                style={{
                                    position: 'absolute',
                                    left: x,
                                    top: y,
                                    width: gridToPx(layout.w),
                                    height: gridToPx(layout.h),
                                    background:
                                        ap?.bgColor ?? 'var(--t-surface)',
                                    borderRadius: ap?.borderRadius ?? 14,
                                    padding: 16,
                                    overflow: 'hidden',
                                    border: '0.5px solid var(--t-border)',
                                }}
                            >
                                <WidgetRenderer widget={widget} />
                            </div>
                        );
                    })}
                </div>
            </div>

            {widgets.length === 0 && (
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
