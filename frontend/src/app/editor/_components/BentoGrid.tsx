'use client';

import React, { useEffect, useCallback } from 'react';
import { Widget, WidgetLayout } from '@/types/widget';
import { GRID_COLS, GRID_ROWS, CELL_PX, GAP_PX, CANVAS_W, CANVAS_H, gridToPx } from '@/lib/widgetConfig';
import { resolveCollisions } from '@/utils/collisionUtils';
import { WidgetCell } from './WidgetCell';
import { DragGhost } from './DragGhost';
import { GridDropZone } from './GridDropZone';

interface BentoGridProps {
    widgets: Widget[];
    layouts: WidgetLayout[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
    onLayoutChange: (layouts: WidgetLayout[]) => void;
    draggingId: string | null;
    initialLayoutsRef: React.MutableRefObject<WidgetLayout[]>;
    liveLayouts: WidgetLayout[];
    setLiveLayouts: (layouts: WidgetLayout[]) => void;
    /** Id of the synthetic ghost layout injected during a sidebar drag */
    sidebarGhostId: string;
    /** Synthetic Widget fed to DragGhost while dragging from sidebar (null when idle) */
    sidebarGhostWidget: Widget | null;
}

// Main layout component orchestrating the drag-and-drop grid area
export function BentoGrid({
                              widgets,
                              layouts,
                              selectedId,
                              onSelect,
                              onDelete,
                              onLayoutChange,
                              draggingId,
                              initialLayoutsRef,
                              liveLayouts,
                              setLiveLayouts,
                              sidebarGhostId,
                              sidebarGhostWidget,
                          }: BentoGridProps) {

    // Sync external layout changes when no drag is active
    useEffect(() => {
        if (!draggingId && !sidebarGhostWidget) setLiveLayouts(layouts);
    }, [layouts, draggingId, sidebarGhostWidget, setLiveLayouts]);

    // Handles resizing of a single widget and triggers collision resolution
    const handleResize = useCallback(
        (id: string, w: number, h: number) => {
            const draft = layouts.map((l) => (l.id === id ? { ...l, w, h } : l));
            onLayoutChange(resolveCollisions(draft, id));
        },
        [layouts, onLayoutChange],
    );

    // Grid-drag ghost (existing widget being moved)
    const activeLiveLayout = draggingId ? liveLayouts.find((l) => l.id === draggingId) : null;
    const draggingWidget = draggingId ? widgets.find((w) => w.id === draggingId) : null;

    // Sidebar-drag ghost (new widget being dragged in from sidebar)
    const sidebarGhostLayout = sidebarGhostWidget
        ? liveLayouts.find((l) => l.id === sidebarGhostId)
        : null;

    return (
        <main
            className="flex-1 overflow-auto p-6"
            style={{
                backgroundImage: `
                    repeating-linear-gradient(0deg, transparent, transparent 23px, rgba(255,255,255,0.025) 23px, rgba(255,255,255,0.025) 24px),
                    repeating-linear-gradient(90deg, transparent, transparent 23px, rgba(255,255,255,0.025) 23px, rgba(255,255,255,0.025) 24px)
                `,
            }}
        >
            {/* Grid info header */}
            <div className="flex items-center gap-2 mb-4">
                <span className="text-[11px]" style={{ color: 'var(--t-muted)' }}>
                    Bento Grid — {GRID_COLS} cols × {GRID_ROWS} rows
                </span>
                <span className="text-[11px]" style={{ color: 'rgba(200,255,87,0.5)' }}>
                    drag handle to move · corner to resize · drag from sidebar to add
                </span>
            </div>

            {/* Main canvas area equipped with dnd-kit drop zone */}
            <div className="relative" data-canvas="true" style={{ width: CANVAS_W, height: CANVAS_H + 60 }}>
                <GridDropZone />

                {/* A4 page boundary indicator */}
                <div
                    className="absolute pointer-events-none z-0"
                    style={{
                        top: 0,
                        left: 0,
                        width: CANVAS_W,
                        height: CANVAS_H,
                        border: '1.5px dashed rgba(200,255,87,0.2)',
                        borderRadius: 4,
                    }}
                >
                    <span
                        className="absolute text-[9px] font-semibold uppercase tracking-widest"
                        style={{ bottom: -18, right: 0, color: 'rgba(200,255,87,0.3)' }}
                    >
                        A4 boundary
                    </span>
                </div>

                {/* Ghost for existing widget being moved inside the grid */}
                {activeLiveLayout && draggingWidget && (
                    <div
                        className="absolute top-0 left-0 pointer-events-none z-0 transition-transform duration-150 ease-out"
                        style={{
                            transform: `translate3d(${activeLiveLayout.x * (CELL_PX + GAP_PX)}px, ${activeLiveLayout.y * (CELL_PX + GAP_PX)}px, 0)`,
                            width: gridToPx(activeLiveLayout.w),
                            height: gridToPx(activeLiveLayout.h),
                        }}
                    >
                        <DragGhost widget={draggingWidget} />
                    </div>
                )}

                {/* Ghost for new widget being dragged in from the sidebar */}
                {sidebarGhostLayout && sidebarGhostWidget && (
                    <div
                        className="absolute top-0 left-0 pointer-events-none z-10 transition-transform duration-100 ease-out"
                        style={{
                            transform: `translate3d(${sidebarGhostLayout.x * (CELL_PX + GAP_PX)}px, ${sidebarGhostLayout.y * (CELL_PX + GAP_PX)}px, 0)`,
                            width: gridToPx(sidebarGhostLayout.w),
                            height: gridToPx(sidebarGhostLayout.h),
                        }}
                    >
                        <DragGhost widget={sidebarGhostWidget} />
                    </div>
                )}

                {/* Render all real widgets mapped to their live or finalized layouts */}
                {widgets.map((widget) => {
                    const isDragging = draggingId === widget.id;
                    const layoutToUse = isDragging
                        ? initialLayoutsRef.current.find((l) => l.id === widget.id)
                        : liveLayouts.find((l) => l.id === widget.id);

                    if (!layoutToUse) return null;

                    return (
                        <WidgetCell
                            key={widget.id}
                            widget={widget}
                            layout={layoutToUse}
                            isSelected={selectedId === widget.id}
                            isDragging={isDragging}
                            onSelect={() => onSelect(widget.id)}
                            onDelete={() => onDelete(widget.id)}
                            onResize={handleResize}
                        />
                    );
                })}
            </div>
        </main>
    );
}