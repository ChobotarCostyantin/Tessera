import { Widget, WidgetLayout } from '@/types/widget';
import React from 'react';

export const GRID_COLS = 40;
export const CELL_PX = 30;
export const GAP_PX = 5;

export function gridToPx(units: number): number {
    return units * CELL_PX + (units - 1) * GAP_PX;
}
export function pxToGrid(px: number): number {
    return Math.max(1, Math.round((px + GAP_PX) / (CELL_PX + GAP_PX)));
}
export function gridToOffset(pos: number): number {
    return pos * (CELL_PX + GAP_PX);
}

export const CANVAS_W = gridToOffset(GRID_COLS) - GAP_PX;

export const WIDGET_CATALOG = [
    {
        type: 'experience' as const,
        label: 'Experience',
        icon: '💼',
        color: 'rgba(186,117,23,0.15)',
        defaultW: 6,
        defaultH: 8,
    },
    {
        type: 'links' as const,
        label: 'Links',
        icon: '🔗',
        color: 'rgba(55,138,221,0.15)',
        defaultW: 5,
        defaultH: 5,
    },
    {
        type: 'text' as const,
        label: 'Rich Text',
        icon: '📝',
        color: 'rgba(255,255,255,0.1)',
        defaultW: 6,
        defaultH: 6,
    },
    {
        type: 'image' as const,
        label: 'Image / Avatar',
        icon: '🖼️',
        color: 'rgba(237,147,177,0.12)',
        defaultW: 5,
        defaultH: 5,
    },
    {
        type: 'progress' as const,
        label: 'Progress Bar',
        icon: '📈',
        color: 'rgba(55,138,221,0.15)',
        defaultW: 7,
        defaultH: 4,
    },
];

export const PROGRESS_COLORS: Record<string, string> = {
    green:  '#97c459',
    purple: '#a89bff',
    amber:  '#ef9f27',
    blue:   '#85b7eb',
};

export function createDefaultWidget(type: Widget['type'], id: string): Widget {
    switch (type) {
        case 'experience':
            return {
                id,
                type,
                items: [
                    {
                        content:
                            '<p><strong>Senior Developer</strong><br/>TechCorp<br/><em>2020 - Present</em></p>',
                    },
                ],
            };
        case 'links':
            return {
                id,
                type,
                links: [{ label: '<p>GitHub</p>', url: 'https://github.com' }],
            };
        case 'text':
            return {
                id,
                type,
                content: '<p>Start typing your custom content here...</p>',
            };
        case 'image':
            return {
                id,
                type,
                imageUrl: '',
                objectFit: 'cover',
            };
        case 'progress':
            return {
                id,
                type,
                items: [
                    { label: 'English - C1', progress: 85, color: 'blue' },
                    { label: 'Spanish - A2', progress: 30, color: 'amber' },
                ],
            };
    }
}

export function getWidgetContainerStyle(widget: Widget, layout: WidgetLayout) {
    const ap = widget.appearance;
    const bgColor = ap?.bgColor ?? 'var(--t-surface)';
    const borderRadius = ap?.borderRadius ?? 14;

    const hoverClass =
        ap?.hoverAnimation && ap.hoverAnimation !== 'none'
            ? `widget-hover-${ap.hoverAnimation}`
            : '';

    // Універсальна функція стилів для віджета.
    // Максимально відповідає "нормальному" (не-dragging, не-selected) стану з WidgetCell.tsx
    // + забезпечує повну підтримку hover-анімацій у PortfolioPreview.tsx та page.tsx (public).
    const className = hoverClass ? `group ${hoverClass}` : 'group';

    const style: React.CSSProperties = {
        // geometry
        width: gridToPx(layout.w),
        height: gridToPx(layout.h),

        // візуал — точно як innerStyle WidgetCell у звичайному стані
        background: bgColor,
        border: '1.5px solid transparent',
        borderRadius,
        padding: '16px',
        overflow: 'hidden',

        // транзишни з WidgetCell (outer + inner) — підтримка анімацій hover, плавна зміна розміру
        transition:
            'transform 0.25s ease-out, width 0.2s ease-out, height 0.2s ease-out, box-shadow 0.2s, opacity 0.2s',

        // CSS vars, які використовує widget-hover-animation.css та логіка glow/lift у редакторі
        '--widget-bg': bgColor,
        '--pos-x': '0px',
        '--pos-y': '0px',
        '--glow-color': ap?.bgColor ?? 'rgba(255,255,255,0.1)',
    } as React.CSSProperties;

    return { className, style };
}
