'use client';

import React, {useState, useEffect, useCallback, useRef} from 'react';
import {Widget, WidgetLayout, Theme, PageConfig} from '@/types/widget';
import {
    THEMES,
    WIDGET_CATALOG,
    createDefaultWidget,
} from '@/lib/widgetConfig';
import {Inspector} from '@/app/editor/_components/Inspector';
import {EditorLayout} from "@/app/editor/_components/EditorLayout";
import {findFreePosition} from "@/utils/gridUtils";
import {resolveCollisions} from "@/utils/collisionUtils";

const STORAGE_KEY = 'tessera:page-config-v2';

function genId(): string {
    return crypto.randomUUID();
}

function loadConfig(): PageConfig {
    // Return empty arrays for SSR to avoid hydration mismatch
    if (typeof window === 'undefined') {
        return { widgets: [], layouts: [], theme: 'dark' };
    }
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw) as PageConfig;
            if (Array.isArray(parsed.widgets) && Array.isArray(parsed.layouts)) {
                return parsed;
            }
        }
    } catch {}

    // Fallback to empty state instead of default mock widgets
    return { widgets: [], layouts: [], theme: 'dark' };
}

function applyTheme(theme: Theme): void {
    if (typeof document === 'undefined') return;
    const vars = THEMES[theme];
    Object.entries(vars).forEach(([k, v]) => {
        document.documentElement.style.setProperty(k, v);
    });
}

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

    return {message, visible, show};
}

export default function EditorPage() {
    const [isMounted, setIsMounted] = useState(false);
    const [widgets, setWidgets] = useState<Widget[]>(() => loadConfig().widgets);
    const [layouts, setLayouts] = useState<WidgetLayout[]>(() => loadConfig().layouts);
    const [theme, setTheme] = useState<Theme>(() => loadConfig().theme);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const toast = useToast();

    useEffect(() => {
        setIsMounted(true);
        applyTheme(theme);
    }, [theme]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        localStorage.setItem(STORAGE_KEY, JSON.stringify({widgets, layouts, theme}));
    }, [widgets, layouts, theme]);

    const handleThemeChange = useCallback((t: Theme) => setTheme(t), []);

    const handleSelect = useCallback(
        (id: string) => setSelectedId((prev) => (prev === id ? null : id)),
        [],
    );

    const handleDelete = useCallback((id: string) => {
        setWidgets((prev) => prev.filter((w) => w.id !== id));
        setLayouts((prev) => prev.filter((l) => l.id !== id));
        setSelectedId((prev) => (prev === id ? null : prev));
    }, []);

    const handleLayoutChange = useCallback((newLayouts: WidgetLayout[]) => {
        setLayouts(newLayouts);
    }, []);

    const handleAddWidget = useCallback((type: Widget['type']) => {
        const id = genId();
        const newWidget = createDefaultWidget(type, id);
        const catalog = WIDGET_CATALOG.find((c) => c.type === type);
        const defaultW = catalog?.defaultW ?? 3;
        const defaultH = catalog?.defaultH ?? 3;

        const globalWindow = window as Window & { __pendingDropPosition?: { x: number; y: number } };
        const pos = globalWindow.__pendingDropPosition;
        if (pos) delete globalWindow.__pendingDropPosition;

        const newLayout: WidgetLayout = {
            id,
            x: pos?.x ?? 0,
            y: pos?.y ?? 0,
            w: defaultW,
            h: defaultH,
        };

        setWidgets((prev) => [...prev, newWidget]);
        setLayouts((prev) => {
            const withNew = pos
                ? [...prev, newLayout]
                : [...prev, { ...newLayout, ...findFreePosition(prev, defaultW, defaultH) }];
            return resolveCollisions(withNew, id); // ← ключове: resolve після додавання
        });
        setSelectedId(id);
    }, []);

    const handleUpdate = useCallback((id: string, patch: Partial<Widget>) => {
        setWidgets((prev) =>
            prev.map((w) => (w.id === id ? ({...w, ...patch} as Widget) : w)),
        );
    }, []);

    const handleExport = useCallback(() => {
        const config: PageConfig = {widgets, layouts, theme};
        navigator.clipboard
            .writeText(JSON.stringify(config, null, 2))
            .then(() => toast.show('✓ JSON copied to clipboard'))
            .catch(() => toast.show('Copy failed'));
    }, [widgets, layouts, theme, toast]);

    const handlePublish = useCallback(() => {
        toast.show('✓ Saved locally — connect NestJS to publish');
    }, [toast]);

    const selectedWidget = widgets.find((w) => w.id === selectedId) ?? null;

    if (!isMounted) {
        return (
            <div
                style={{
                    height: '100dvh',
                    background: 'var(--t-bg)',
                }}
            />
        );
    }

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
            <header
                className="flex items-center justify-between px-5 py-3.5 shrink-0"
                style={{
                    borderBottom: '0.5px solid var(--t-border)',
                    background: 'rgba(15,15,16,0.92)',
                }}
            >
                <div className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
                    <div className="w-2 h-2 rounded-full" style={{background: 'var(--t-accent)'}} />
                    Tessera
                    <span className="text-[11px] font-normal ml-1" style={{color: 'var(--t-muted)'}}>
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
                            onClick={
                                label === 'Export JSON'
                                    ? handleExport
                                    : () => toast.show('Preview — coming soon')
                            }
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

            <div className="flex flex-1 overflow-hidden justify-between">
                <EditorLayout widgets={widgets}
                              layouts={layouts}
                              selectedId={selectedId}
                              theme={theme}
                              onSelect={handleSelect}
                              onDelete={handleDelete}
                              onLayoutChange={handleLayoutChange}
                              onAddWidget={handleAddWidget}
                              onThemeChange={handleThemeChange}
                />

                <Inspector
                    widget={selectedWidget}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                />
            </div>

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