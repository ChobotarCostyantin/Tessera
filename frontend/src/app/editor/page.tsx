'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Widget, WidgetLayout, Theme, PageConfig } from '@/types/widget';
import {
    DEFAULT_WIDGETS,
    DEFAULT_LAYOUTS,
    THEMES,
    WIDGET_CATALOG,
    createDefaultWidget,
} from '@/lib/widgetConfig';
import { EditorSidebar } from '@/app/editor/_components/EditorSidebar';
import { BentoGrid } from '@/app/editor/_components/BentoGrid';
import { Inspector } from '@/app/editor/_components/Inspector';

const STORAGE_KEY = 'tessera:page-config-v2';

// Simple counter for generating unique widget IDs
let _idCounter = 200;
function genId(): string {
    return `w${++_idCounter}`;
}

// Load persisted configuration from localStorage
function loadConfig(): PageConfig {
    if (typeof window === 'undefined') {
        return { widgets: DEFAULT_WIDGETS, layouts: DEFAULT_LAYOUTS, theme: 'dark' };
    }
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw) as PageConfig;
    } catch {
        // Ignore parse errors and fallback to defaults
    }
    return { widgets: DEFAULT_WIDGETS, layouts: DEFAULT_LAYOUTS, theme: 'dark' };
}

// Apply CSS variables to the document root based on the selected theme
function applyTheme(theme: Theme): void {
    if (typeof document === 'undefined') return;
    const vars = THEMES[theme];
    Object.entries(vars).forEach(([k, v]) => {
        document.documentElement.style.setProperty(k, v);
    });
}

// Custom hook for managing toast notifications
function useToast() {
    const [message, setMessage] = useState('');
    const [visible, setVisible] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const show = useCallback((msg: string) => {
        if (timer.current) clearTimeout(timer.current);
        setMessage(msg);
        setVisible(true);
        timer.current = setTimeout(() => setVisible(false), 2500);
    }, []);

    return { message, visible, show };
}

// ─── Main Editor Component ──────────────────────────────────────────────────

export default function EditorPage() {
    const [widgets, setWidgets] = useState<Widget[]>(DEFAULT_WIDGETS);
    const [layouts, setLayouts] = useState<WidgetLayout[]>(DEFAULT_LAYOUTS);
    const [theme, setTheme] = useState<Theme>('dark');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const toast = useToast();

    // Load persisted config on initial mount
    useEffect(() => {
        const config = loadConfig();
        setWidgets(config.widgets);
        setLayouts(config.layouts);
        setTheme(config.theme);
        applyTheme(config.theme);
    }, []);

    // Reapply CSS variables when the theme changes
    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    // Auto-save layout and widgets to localStorage on change
    useEffect(() => {
        if (typeof window === 'undefined') return;
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ widgets, layouts, theme }));
    }, [widgets, layouts, theme]);

    // ─── Handlers ───────────────────────────────────────────────────────────

    const handleThemeChange = useCallback((t: Theme) => setTheme(t), []);

    const handleSelect = useCallback(
        (id: string) => setSelectedId((prev) => (prev === id ? null : id)),
        [],
    );

    const handleDelete = useCallback((id: string) => {
        setWidgets((prev) => prev.filter((w) => w.id !== id));
        setLayouts((prev) => prev.filter((l) => l.id !== id)); // Adjusted for dnd-kit (uses 'id' instead of 'i')
        setSelectedId((prev) => (prev === id ? null : prev));
    }, []);

    const handleLayoutChange = useCallback((newLayouts: WidgetLayout[]) => {
        setLayouts(newLayouts);
    }, []);

    const handleAddWidget = useCallback((type: Widget['type']) => {
        const id = genId();
        const newWidget = createDefaultWidget(type, id);
        const catalog = WIDGET_CATALOG.find((c) => c.type === type);

        // Find the lowest point on the grid to place the new widget
        let maxY = 0;
        setLayouts((prev) => {
            prev.forEach(l => {
                const bottomEdge = l.y + l.h;
                if (bottomEdge > maxY) maxY = bottomEdge;
            });
            return prev;
        });

        // Initialize layout without React-Grid-Layout legacy properties
        const newLayout: WidgetLayout = {
            id,
            x: 0,
            y: maxY, // Place below the lowest widget
            w: catalog?.defaultW ?? 3,
            h: catalog?.defaultH ?? 3,
        };

        setWidgets((prev) => [...prev, newWidget]);
        setLayouts((prev) => [...prev, newLayout]);
        setSelectedId(id);
    }, []);

    const handleUpdate = useCallback((id: string, patch: Partial<Widget>) => {
        setWidgets((prev) =>
            prev.map((w) => (w.id === id ? ({ ...w, ...patch } as Widget) : w)),
        );
    }, []);

    const handleExport = useCallback(() => {
        const config: PageConfig = { widgets, layouts, theme };
        navigator.clipboard
            .writeText(JSON.stringify(config, null, 2))
            .then(() => toast.show('✓ JSON copied to clipboard'))
            .catch(() => toast.show('Copy failed'));
    }, [widgets, layouts, theme, toast]);

    const handlePublish = useCallback(() => {
        // TODO: Replace with backend integration (e.g., POST /api/pages/:id) when NestJS is ready
        toast.show('✓ Saved locally — connect NestJS to publish');
    }, [toast]);

    const selectedWidget = widgets.find((w) => w.id === selectedId) ?? null;

    // ─── Render ─────────────────────────────────────────────────────────────

    return (
        <div
            className="flex flex-col overflow-hidden"
            style={{
                height: '100dvh',
                background: 'var(--t-bg)',
                color: 'var(--t-text)',
                fontFamily: "'DM Sans', sans-serif",
            }}
        >
            {/* Top Navigation Bar */}
            <header
                className="flex items-center justify-between px-5 py-3.5 shrink-0"
                style={{ borderBottom: '0.5px solid var(--t-border)', background: 'rgba(15,15,16,0.92)' }}
            >
                <div className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
                    <div className="w-2 h-2 rounded-full" style={{ background: 'var(--t-accent)' }} />
                    Tessera
                    <span className="text-[11px] font-normal ml-1" style={{ color: 'var(--t-muted)' }}>
                        — editor
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {(['👁 Preview', 'Export JSON'] as const).map((label) => (
                        <button
                            key={label}
                            className="px-3.5 py-1.5 rounded-[10px] text-[12px] font-medium transition-all duration-150"
                            style={{
                                background: 'transparent',
                                border: '0.5px solid var(--t-border)',
                                color: 'var(--t-muted)',
                                fontFamily: 'inherit',
                                cursor: 'pointer',
                            }}
                            onClick={label === 'Export JSON' ? handleExport : () => toast.show('Preview — coming soon')}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.background = 'var(--t-surface2)';
                                (e.currentTarget as HTMLElement).style.color = 'var(--t-text)';
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.background = 'transparent';
                                (e.currentTarget as HTMLElement).style.color = 'var(--t-muted)';
                            }}
                        >
                            {label}
                        </button>
                    ))}
                    <button
                        className="px-3.5 py-1.5 rounded-[10px] text-[12px] font-medium"
                        style={{
                            background: 'var(--t-accent)',
                            border: 'none',
                            color: '#0f0f10',
                            fontFamily: 'inherit',
                            cursor: 'pointer',
                        }}
                        onClick={handlePublish}
                    >
                        Publish
                    </button>
                </div>
            </header>

            {/* Main Editor Body */}
            <div className="flex flex-1 overflow-hidden">
                <EditorSidebar
                    theme={theme}
                    onThemeChange={handleThemeChange}
                    onAddWidget={handleAddWidget}
                />

                <BentoGrid
                    widgets={widgets}
                    layouts={layouts}
                    selectedId={selectedId}
                    onSelect={handleSelect}
                    onDelete={handleDelete}
                    onLayoutChange={handleLayoutChange}
                />

                <Inspector
                    widget={selectedWidget}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                />
            </div>

            {/* Global Toast Notification */}
            <div
                className="fixed bottom-5 left-1/2 px-4 py-2.5 rounded-[10px] text-[12px] pointer-events-none z-50 transition-all duration-300"
                style={{
                    transform: `translateX(-50%) translateY(${toast.visible ? '0' : '14px'})`,
                    opacity: toast.visible ? 1 : 0,
                    background: 'var(--t-surface2)',
                    border: '0.5px solid rgba(200,255,87,0.3)',
                    color: 'var(--t-text)',
                }}
            >
                {toast.message}
            </div>
        </div>
    );
}