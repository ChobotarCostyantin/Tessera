'use client';

import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Theme, Widget } from '@/types/widget';
import { WIDGET_CATALOG } from '@/lib/widgetConfig';

interface EditorSidebarProps {
    theme: Theme;
    onThemeChange: (t: Theme) => void;
    onAddWidget: (type: Widget['type']) => void;
}

const THEME_META: Record<Theme, { name: string; sub: string; dots: string[] }> = {
    dark: {
        name: 'Dark Grid',
        sub: 'Default',
        dots: ['#0f0f10', '#c8ff57', '#7c6dff'],
    },
    light: {
        name: 'Light Paper',
        sub: 'Clean minimal',
        dots: ['#f0ede8', '#1a1a1a', '#5b4fff'],
    },
    warm: {
        name: 'Warm Cream',
        sub: 'Cozy editorial',
        dots: ['#faf5eb', '#854f0b', '#ef9f27'],
    },
};

// Each sidebar widget button is draggable with fromSidebar=true
function DraggableWidgetButton({
                                   item,
                                   onAddWidget,
                               }: {
    item: (typeof WIDGET_CATALOG)[number];
    onAddWidget: (type: Widget['type']) => void;
}) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `sidebar-${item.type}`,
        data: { widgetType: item.type, fromSidebar: true },
    });

    return (
        <button
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left w-full transition-all duration-150"
            style={{
                background: 'var(--t-surface2)',
                border: '0.5px solid var(--t-border)',
                cursor: isDragging ? 'grabbing' : 'grab',
                fontFamily: 'inherit',
                opacity: isDragging ? 0.5 : 1,
            }}
            onClick={() => onAddWidget(item.type)}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--t-border)')}
        >
            <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0"
                style={{ background: item.color }}
            >
                {item.icon}
            </div>
            <div>
                <div className="text-[12px] font-medium" style={{ color: 'var(--t-text)' }}>
                    {item.label}
                </div>
                <div className="text-[10px]" style={{ color: 'var(--t-muted)' }}>
                    click or drag to add
                </div>
            </div>
        </button>
    );
}

export function EditorSidebar({ theme, onThemeChange, onAddWidget }: EditorSidebarProps) {
    return (
        <aside
            className="w-53 shrink-0 p-3 flex flex-col gap-5 overflow-y-auto"
            style={{
                borderRight: '0.5px solid var(--t-border)',
                background: 'var(--t-surface)',
            }}
        >
            {/* Widgets */}
            <div>
                <p
                    className="text-[10px] font-semibold uppercase tracking-[0.08em] mb-2 px-1"
                    style={{ color: 'var(--t-muted)' }}
                >
                    Widgets
                </p>
                <div className="flex flex-col gap-1.5">
                    {WIDGET_CATALOG.map((item) => (
                        <DraggableWidgetButton key={item.type} item={item} onAddWidget={onAddWidget} />
                    ))}
                </div>
            </div>

            {/* Themes */}
            <div>
                <p
                    className="text-[10px] font-semibold uppercase tracking-[0.08em] mb-2 px-1"
                    style={{ color: 'var(--t-muted)' }}
                >
                    Themes
                </p>
                <div className="flex flex-col gap-1.5">
                    {(Object.keys(THEME_META) as Theme[]).map((t) => {
                        const meta = THEME_META[t];
                        return (
                            <button
                                key={t}
                                className="text-left px-3 py-2.5 rounded-xl w-full"
                                style={{
                                    background: 'var(--t-surface2)',
                                    border:
                                        theme === t
                                            ? '0.5px solid var(--t-accent)'
                                            : '0.5px solid var(--t-border)',
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                }}
                                onClick={() => onThemeChange(t)}
                            >
                                <div className="text-[11px] font-semibold" style={{ color: 'var(--t-text)' }}>
                                    {meta.name}
                                </div>
                                <div className="text-[10px] mt-0.5" style={{ color: 'var(--t-muted)' }}>
                                    {meta.sub}
                                </div>
                                <div className="flex gap-1 mt-1.5">
                                    {meta.dots.map((dot, i) => (
                                        <div
                                            key={i}
                                            className="w-3 h-3 rounded-full"
                                            style={{
                                                background: dot,
                                                border:
                                                    i === 0 ? '1px solid rgba(128,128,128,0.3)' : 'none',
                                            }}
                                        />
                                    ))}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* A4 hint */}
            <div
                className="mt-auto rounded-xl p-3"
                style={{
                    background: 'rgba(200,255,87,0.04)',
                    border: '0.5px solid rgba(200,255,87,0.12)',
                }}
            >
                <p className="text-[10px] font-semibold" style={{ color: 'rgba(200,255,87,0.7)' }}>
                    📄 A4 hint
                </p>
                <p className="text-[10px] mt-1 leading-relaxed" style={{ color: 'var(--t-muted)' }}>
                    Grid = {12} cols × {16} rows.
                    <br />
                    Keep widgets inside the dashed border to fit one A4 page.
                </p>
            </div>
        </aside>
    );
}