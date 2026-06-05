'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Widget, WidgetLayout, PageConfig } from '@/types/widget';
import { WIDGET_CATALOG, createDefaultWidget } from '@/lib/widgetConfig';
import { Inspector } from '@/app/editor/_components/Inspector';
import { EditorLayout } from '@/app/editor/_components/EditorLayout';
import { PublishModal } from '@/app/editor/_components/PublishModal';
import { findFreePosition } from '@/utils/gridUtils';
import { resolveCollisions } from '@/utils/collisionUtils';
import { useAutosave } from '@/hooks/useAutosave';

const STORAGE_KEY = 'tessera:page-config-v2';
const PORTFOLIO_ID_KEY = 'tessera:portfolio-id';
const PORTFOLIO_SLUG_KEY = 'tessera:portfolio-slug'; // Додали ключ для slug

type AutosaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

function genId(): string {
    return crypto.randomUUID();
}

function loadConfig(): PageConfig {
    if (typeof window === 'undefined') return { widgets: [], layouts: [] };
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw) as PageConfig;
            if (
                Array.isArray(parsed.widgets) &&
                Array.isArray(parsed.layouts)
            ) {
                return parsed;
            }
        }
    } catch {}
    return { widgets: [], layouts: [] };
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

    return { message, visible, show };
}

const AUTOSAVE_STATUS_LABELS: Record<AutosaveStatus, string> = {
    idle: '',
    pending: '● Unsaved changes',
    saving: '⟳ Saving...',
    saved: '✓ Saved',
    error: '✕ Save failed',
};

const AUTOSAVE_STATUS_COLORS: Record<AutosaveStatus, string> = {
    idle: 'transparent',
    pending: 'rgba(240,239,238,0.3)',
    saving: 'rgba(200,255,87,0.5)',
    saved: 'var(--t-accent)',
    error: 'rgba(255,100,100,0.8)',
};

export default function EditorPage() {
    const [isMounted, setIsMounted] = useState(false);
    const [widgets, setWidgets] = useState<Widget[]>(
        () => loadConfig().widgets,
    );
    const [layouts, setLayouts] = useState<WidgetLayout[]>(
        () => loadConfig().layouts,
    );
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [publishModalOpen, setPublishModalOpen] = useState(false);
    const [portfolioId, setPortfolioId] = useState<string | null>(null);
    const [portfolioSlug, setPortfolioSlug] = useState<string | null>(null);
    const [isPublished, setIsPublished] = useState(false);
    const [autosaveStatus, setAutosaveStatus] =
        useState<AutosaveStatus>('idle');
    const toast = useToast();

    useEffect(() => {
        setIsMounted(true);
        const savedId = localStorage.getItem(PORTFOLIO_ID_KEY);
        const savedSlug = localStorage.getItem(PORTFOLIO_SLUG_KEY);
        const savedPublished = localStorage.getItem(
            'tessera:portfolio-published',
        );
        if (savedId) setPortfolioId(savedId);
        if (savedSlug) setPortfolioSlug(savedSlug);
        if (savedPublished === 'true') setIsPublished(true);
    }, []);

    // Persist config locally on every change
    useEffect(() => {
        if (typeof window === 'undefined') return;
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ widgets, layouts }));
    }, [widgets, layouts]);

    const config: PageConfig = { widgets, layouts };

    useAutosave({
        portfolioId,
        config,
        debounceMs: 1000,
        onStatusChange: setAutosaveStatus,
    });

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

        const globalWindow = window as Window & {
            __pendingDropPosition?: { x: number; y: number };
        };
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
                : [
                      ...prev,
                      {
                          ...newLayout,
                          ...findFreePosition(prev, defaultW, defaultH),
                      },
                  ];
            return resolveCollisions(withNew, id);
        });
        setSelectedId(id);
    }, []);

    const handleUpdate = useCallback((id: string, patch: Partial<Widget>) => {
        setWidgets((prev) =>
            prev.map((w) => (w.id === id ? ({ ...w, ...patch } as Widget) : w)),
        );
    }, []);

    const handlePublished = useCallback(
        (id: string, slug: string) => {
            setPortfolioId(id);
            setPortfolioSlug(slug);
            setIsPublished(true);
            localStorage.setItem(PORTFOLIO_ID_KEY, id);
            localStorage.setItem(PORTFOLIO_SLUG_KEY, slug);
            localStorage.setItem('tessera:portfolio-published', 'true');
            toast.show(`✓ Published at /p/${slug}`);
        },
        [toast],
    );

    const handleUnpublished = useCallback(() => {
        setIsPublished(false);
        localStorage.setItem('tessera:portfolio-published', 'false');
        toast.show('🔒 Unpublished');
    }, [toast]);

    const handleExport = useCallback(() => {
        const config: PageConfig = { widgets, layouts };
        navigator.clipboard
            .writeText(JSON.stringify(config, null, 2))
            .then(() => toast.show('✓ JSON copied to clipboard'))
            .catch(() => toast.show('Copy failed'));
    }, [widgets, layouts, toast]);

    const selectedWidget = widgets.find((w) => w.id === selectedId) ?? null;

    if (!isMounted) {
        return <div style={{ height: '100dvh', background: 'var(--t-bg)' }} />;
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
            {/* ── Header ─────────────────────────────────────────────────── */}
            <header
                className="flex items-center justify-between px-5 py-3.5 shrink-0"
                style={{
                    borderBottom: '0.5px solid var(--t-border)',
                    background: 'rgba(15,15,16,0.92)',
                }}
            >
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
                        <div
                            className="w-2 h-2 rounded-full"
                            style={{ background: 'var(--t-accent)' }}
                        />
                        Tessera
                        <span
                            className="text-[11px] font-normal ml-1"
                            style={{ color: 'var(--t-muted)' }}
                        >
                            — editor
                        </span>
                    </div>

                    {/* Autosave indicator */}
                    {autosaveStatus !== 'idle' && (
                        <span
                            className="text-[11px] font-medium transition-all duration-300"
                            style={{
                                color: AUTOSAVE_STATUS_COLORS[autosaveStatus],
                            }}
                        >
                            {AUTOSAVE_STATUS_LABELS[autosaveStatus]}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        className="px-3.5 py-1.5 rounded-[10px] text-[12px] font-medium transition-all duration-150"
                        style={{
                            background: 'transparent',
                            border: '0.5px solid var(--t-border)',
                            color: 'var(--t-muted)',
                            fontFamily: 'inherit',
                            cursor: 'pointer',
                        }}
                        onClick={handleExport}
                        onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.background =
                                'var(--t-surface2)';
                            (e.currentTarget as HTMLElement).style.color =
                                'var(--t-text)';
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.background =
                                'transparent';
                            (e.currentTarget as HTMLElement).style.color =
                                'var(--t-muted)';
                        }}
                    >
                        Export JSON
                    </button>

                    {portfolioSlug && (
                        <a
                            href={`/p/${portfolioSlug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-1.5 rounded-[10px] text-[12px] font-medium transition-all duration-150"
                            style={{
                                background: 'transparent',
                                border: '0.5px solid var(--t-border)',
                                color: 'var(--t-muted)',
                                fontFamily: 'inherit',
                                cursor: 'pointer',
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                            }}
                        >
                            👁 View live
                        </a>
                    )}

                    <button
                        className="px-3.5 py-1.5 rounded-[10px] text-[12px] font-semibold"
                        style={{
                            background: 'var(--t-accent)',
                            border: 'none',
                            color: '#0f0f10',
                            fontFamily: 'inherit',
                            cursor: 'pointer',
                        }}
                        onClick={() => setPublishModalOpen(true)}
                    >
                        {portfolioId
                            ? isPublished
                                ? '⟳ Re-publish'
                                : '🚀 Publish'
                            : 'Publish'}
                    </button>
                </div>
            </header>

            {/* ── Main ───────────────────────────────────────────────────── */}
            <div className="flex flex-1 overflow-hidden justify-between">
                <EditorLayout
                    widgets={widgets}
                    layouts={layouts}
                    selectedId={selectedId}
                    onSelect={handleSelect}
                    onDelete={handleDelete}
                    onLayoutChange={handleLayoutChange}
                    onAddWidget={handleAddWidget}
                />

                <Inspector
                    widget={selectedWidget}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                />
            </div>

            {/* ── Publish modal ───────────────────────────────────────────── */}
            <PublishModal
                isOpen={publishModalOpen}
                onClose={() => setPublishModalOpen(false)}
                widgets={widgets}
                layouts={layouts}
                portfolioId={portfolioId}
                isPublished={isPublished}
                onPublished={handlePublished}
                onUnpublished={handleUnpublished}
            />

            {/* ── Toast ──────────────────────────────────────────────────── */}
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
