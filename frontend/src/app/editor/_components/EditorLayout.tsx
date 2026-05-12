'use client';

/**
 * EditorLayout
 *
 * Owns the single DndContext so both sidebar items and grid widgets
 * share the same drag session. Handles:
 * - dragging existing widgets around the grid (fromGrid: true)
 * - dragging new widget types from the sidebar onto the grid (fromSidebar: true)
 */

import React, { useRef, useState, useCallback } from 'react';
import {
    DndContext,
    DragEndEvent,
    DragStartEvent,
    DragOverlay,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { Widget, WidgetLayout, Theme } from '@/types/widget';
import { WIDGET_CATALOG, CELL_PX, GAP_PX, GRID_COLS, gridToPx } from '@/lib/widgetConfig';
import { BentoGrid } from './BentoGrid';
import { EditorSidebar } from './EditorSidebar';
import {findFreePosition} from "@/utils/gridUtils";
import {resolveCollisions} from "@/utils/collisionUtils";

interface EditorLayoutProps {
    widgets: Widget[];
    layouts: WidgetLayout[];
    selectedId: string | null;
    theme: Theme;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
    onLayoutChange: (layouts: WidgetLayout[]) => void;
    onAddWidget: (type: Widget['type']) => void;
    onThemeChange: (t: Theme) => void;
}

export function EditorLayout({
                                 widgets,
                                 layouts,
                                 selectedId,
                                 theme,
                                 onSelect,
                                 onDelete,
                                 onLayoutChange,
                                 onAddWidget,
                                 onThemeChange,
                             }: EditorLayoutProps) {
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [draggingSidebarType, setDraggingSidebarType] = useState<Widget['type'] | null>(null);
    const [liveLayouts, setLiveLayouts] = useState<WidgetLayout[]>(layouts);
    const initialLayoutsRef = useRef<WidgetLayout[]>([]);

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    );

    const handleDragStart = useCallback(
        (event: DragStartEvent) => {
            const data = event.active.data.current as Record<string, unknown> | undefined;

            if (data?.fromSidebar) {
                setDraggingSidebarType(data.widgetType as Widget['type']);
            } else if (data?.fromGrid) {
                setDraggingId(event.active.id as string);
                initialLayoutsRef.current = layouts;
            }
        },
        [layouts],
    );

    const handleDragMove = useCallback(
        (event: { active: { id: string; data: { current?: Record<string, unknown> } }; delta: { x: number; y: number } }) => {
            const data = event.active.data.current;
            if (!data?.fromGrid) return;

            const activeId = event.active.id as string;
            const startLayout = initialLayoutsRef.current.find((l) => l.id === activeId);
            if (!startLayout) return;

            const snapX = Math.round(event.delta.x / (CELL_PX + GAP_PX));
            const snapY = Math.round(event.delta.y / (CELL_PX + GAP_PX));
            const newX = Math.max(0, Math.min(GRID_COLS - startLayout.w, startLayout.x + snapX));
            const newY = Math.max(0, startLayout.y + snapY);

            const draft = initialLayoutsRef.current.map((l) =>
                l.id === activeId ? { ...l, x: newX, y: newY } : l,
            );
            setLiveLayouts(resolveCollisions(draft, activeId));
        },
        [],
    );

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const data = event.active.data.current as Record<string, unknown> | undefined;

            if (data?.fromSidebar) {
                const widgetType = data.widgetType as Widget['type'];
                const catalogItem = WIDGET_CATALOG.find((c) => c.type === widgetType);
                const defaultW = catalogItem?.defaultW ?? 3;
                const defaultH = catalogItem?.defaultH ?? 3;

                // Find the canvas to calculate relative mouse coordinates
                const canvasEl = document.querySelector('[data-canvas="true"]') as HTMLElement | null;
                let dropX;
                let dropY;

                if (canvasEl && event.activatorEvent instanceof PointerEvent) {
                    const rect = canvasEl.getBoundingClientRect();

                    // Calculate relative mouse position inside the canvas
                    const relativeX = event.activatorEvent.clientX - rect.left;
                    const relativeY = event.activatorEvent.clientY - rect.top;

                    // Convert pixels to grid coordinates based on cell size and gap
                    dropX = Math.max(0, Math.round(relativeX / (CELL_PX + GAP_PX)));
                    dropY = Math.max(0, Math.round(relativeY / (CELL_PX + GAP_PX)));

                    // Prevent dropping outside the right edge
                    dropX = Math.min(dropX, GRID_COLS - defaultW);
                } else {
                    // Fallback to first free position if calculation fails
                    const freePos = findFreePosition(layouts, defaultW, defaultH);
                    dropX = freePos.x;
                    dropY = freePos.y;
                }

                // Pass position hint via a custom event the parent can read.
                (window as Window & { __pendingDropPosition?: { x: number; y: number } }).__pendingDropPosition = { x: dropX, y: dropY };
                onAddWidget(widgetType);

                setDraggingSidebarType(null);
            } else if (data?.fromGrid) {
                onLayoutChange(liveLayouts);
                setDraggingId(null);
            }
        },
        [layouts, liveLayouts, onAddWidget, onLayoutChange],
    );

    const handleDragCancel = useCallback(() => {
        setDraggingId(null);
        setDraggingSidebarType(null);
        setLiveLayouts(layouts);
    }, [layouts]);

    const sidebarOverlayWidget = draggingSidebarType
        ? WIDGET_CATALOG.find((c) => c.type === draggingSidebarType)
        : null;

    return (
        <DndContext
            id="editor-dnd"
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove as never}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            <div className="flex h-full">
                <EditorSidebar theme={theme} onThemeChange={onThemeChange} onAddWidget={onAddWidget} />

                <BentoGrid
                    widgets={widgets}
                    layouts={layouts}
                    selectedId={selectedId}
                    onSelect={onSelect}
                    onDelete={onDelete}
                    onLayoutChange={onLayoutChange}
                    draggingId={draggingId}
                    initialLayoutsRef={initialLayoutsRef}
                    liveLayouts={liveLayouts}
                    setLiveLayouts={setLiveLayouts}
                />
            </div>

            <DragOverlay dropAnimation={null}>
                {sidebarOverlayWidget ? (
                    <div
                        style={{
                            width: gridToPx(sidebarOverlayWidget.defaultW ?? 3),
                            height: gridToPx(sidebarOverlayWidget.defaultH ?? 3),
                            borderRadius: 14,
                            background: 'var(--t-surface)',
                            border: '2px dashed var(--t-accent)',
                            opacity: 0.85,
                            pointerEvents: 'none',
                            padding: 16,
                            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                        }}
                    >
                        <div style={{ opacity: 0.5 }}>
                            <span style={{ fontSize: 24 }}>{sidebarOverlayWidget.icon}</span>
                            <div style={{ color: 'var(--t-text)', fontSize: 12, marginTop: 4 }}>
                                {sidebarOverlayWidget.label}
                            </div>
                        </div>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}