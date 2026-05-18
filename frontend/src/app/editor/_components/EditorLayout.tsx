'use client';

import React, { useCallback, useRef, useState } from 'react';
import {
    DndContext,
    DragEndEvent,
    DragMoveEvent,
    DragOverlay,
    DragStartEvent,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { Widget, WidgetLayout } from '@/types/widget';
import { CELL_PX, GAP_PX, GRID_COLS, WIDGET_CATALOG } from '@/lib/widgetConfig';
import { BentoGrid } from './BentoGrid';
import { EditorSidebar } from './EditorSidebar';
import { findFreePosition } from '@/utils/gridUtils';
import { resolveCollisions } from '@/utils/collisionUtils';

interface EditorLayoutProps {
    widgets: Widget[];
    layouts: WidgetLayout[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
    onLayoutChange: (layouts: WidgetLayout[]) => void;
    onAddWidget: (type: Widget['type']) => void;
}

const SIDEBAR_GHOST_ID = '__sidebar_ghost__';

export function EditorLayout({
    widgets,
    layouts,
    selectedId,
    onSelect,
    onDelete,
    onLayoutChange,
    onAddWidget,
}: EditorLayoutProps) {
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [draggingSidebarType, setDraggingSidebarType] = useState<
        Widget['type'] | null
    >(null);
    const [liveLayouts, setLiveLayouts] = useState<WidgetLayout[]>(layouts);

    const initialLayoutsRef = useRef<WidgetLayout[]>([]);
    const sidebarGhostLayoutRef = useRef<WidgetLayout | null>(null);
    /** Pointer clientX/Y at drag activation — delta is added on top each move */
    const activatorCoordsRef = useRef<{ x: number; y: number } | null>(null);

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, {
            activationConstraint: { delay: 150, tolerance: 5 },
        }),
    );

    const pointerToGrid = useCallback(
        (clientX: number, clientY: number, w: number, h: number) => {
            const canvasEl = document.querySelector(
                '[data-canvas="true"]',
            ) as HTMLElement | null;
            if (!canvasEl) return null;
            const rect = canvasEl.getBoundingClientRect();
            const cellStep = CELL_PX + GAP_PX;
            let col = Math.round((clientX - rect.left) / cellStep - w / 2);
            let row = Math.round((clientY - rect.top) / cellStep - h / 2);
            col = Math.max(0, Math.min(GRID_COLS - w, col));
            row = Math.max(0, row);
            return { x: col, y: row };
        },
        [],
    );

    const handleDragStart = useCallback(
        (event: DragStartEvent) => {
            const data = event.active.data.current as
                | Record<string, unknown>
                | undefined;

            if (data?.fromSidebar) {
                const widgetType = data.widgetType as Widget['type'];
                setDraggingSidebarType(widgetType);

                const catalogItem = WIDGET_CATALOG.find(
                    (c) => c.type === widgetType,
                );
                const defaultW = catalogItem?.defaultW ?? 3;
                const defaultH = catalogItem?.defaultH ?? 3;

                let initialX = 0;
                let initialY = 0;
                let hasCoords = false;
                const actEvent = event.activatorEvent;

                // Перевірка для TouchSensor (мобільні пристрої)
                if (
                    'touches' in actEvent &&
                    (actEvent as TouchEvent).touches.length > 0
                ) {
                    initialX = (actEvent as TouchEvent).touches[0].clientX;
                    initialY = (actEvent as TouchEvent).touches[0].clientY;
                    hasCoords = true;
                }
                // Перевірка для MouseSensor (десктоп)
                else if ('clientX' in actEvent && 'clientY' in actEvent) {
                    initialX = (actEvent as MouseEvent).clientX;
                    initialY = (actEvent as MouseEvent).clientY;
                    hasCoords = true;
                }

                if (hasCoords) {
                    activatorCoordsRef.current = { x: initialX, y: initialY };
                } else {
                    activatorCoordsRef.current = null;
                }

                const initialPos = hasCoords
                    ? pointerToGrid(initialX, initialY, defaultW, defaultH)
                    : findFreePosition(layouts, defaultW, defaultH);

                const ghostLayout: WidgetLayout = {
                    id: SIDEBAR_GHOST_ID,
                    x: initialPos?.x ?? 0,
                    y: initialPos?.y ?? 0,
                    w: defaultW,
                    h: defaultH,
                };
                sidebarGhostLayoutRef.current = ghostLayout;
                setLiveLayouts(
                    resolveCollisions(
                        [...layouts, ghostLayout],
                        SIDEBAR_GHOST_ID,
                    ),
                );
            } else if (data?.fromGrid) {
                setDraggingId(event.active.id as string);
                initialLayoutsRef.current = layouts;
            }
        },
        [layouts, pointerToGrid],
    );

    const handleDragMove = useCallback(
        (event: DragMoveEvent) => {
            const data = event.active.data.current as
                | Record<string, unknown>
                | undefined;

            if (data?.fromSidebar) {
                const ghost = sidebarGhostLayoutRef.current;
                const origin = activatorCoordsRef.current;
                if (!ghost || !origin) return;

                // current pointer = activation point + cumulative delta from dnd-kit
                const currentX = origin.x + event.delta.x;
                const currentY = origin.y + event.delta.y;

                const pos = pointerToGrid(currentX, currentY, ghost.w, ghost.h);
                if (!pos) return;

                const updatedGhost: WidgetLayout = {
                    ...ghost,
                    x: pos.x,
                    y: pos.y,
                };
                sidebarGhostLayoutRef.current = updatedGhost;
                setLiveLayouts(
                    resolveCollisions(
                        [...layouts, updatedGhost],
                        SIDEBAR_GHOST_ID,
                    ),
                );
            } else if (data?.fromGrid) {
                const activeId = event.active.id as string;
                const startLayout = initialLayoutsRef.current.find(
                    (l) => l.id === activeId,
                );
                if (!startLayout) return;

                const snapX = Math.round(event.delta.x / (CELL_PX + GAP_PX));
                const snapY = Math.round(event.delta.y / (CELL_PX + GAP_PX));

                const newX = Math.max(
                    0,
                    Math.min(GRID_COLS - startLayout.w, startLayout.x + snapX),
                );
                const newY = Math.max(0, startLayout.y + snapY);

                const draft = initialLayoutsRef.current.map((l) =>
                    l.id === activeId ? { ...l, x: newX, y: newY } : l,
                );
                setLiveLayouts(resolveCollisions(draft, activeId));
            }
        },
        [layouts, pointerToGrid],
    );

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const data = event.active.data.current as
                | Record<string, unknown>
                | undefined;

            if (data?.fromSidebar) {
                const canvasEl = document.querySelector(
                    '[data-canvas="true"]',
                ) as HTMLElement | null;
                const origin = activatorCoordsRef.current;
                const rect = canvasEl?.getBoundingClientRect();
                const finalX = (origin?.x ?? 0) + event.delta.x;
                const finalY = (origin?.y ?? 0) + event.delta.y;

                console.log('DragEnd debug:', {
                    origin,
                    delta: event.delta,
                    finalX,
                    finalY,
                    rect: rect
                        ? {
                              left: rect.left,
                              right: rect.right,
                              top: rect.top,
                              bottom: rect.bottom,
                          }
                        : null,
                    isOverCanvas: rect
                        ? finalX >= rect.left &&
                          finalX <= rect.right &&
                          finalY >= rect.top &&
                          finalY <= rect.bottom
                        : false,
                });

                const ghost = sidebarGhostLayoutRef.current;

                if (ghost) {
                    (
                        window as Window & {
                            __pendingDropPosition?: { x: number; y: number };
                        }
                    ).__pendingDropPosition = { x: ghost.x, y: ghost.y };

                    // ДОДАЄМО ЦЕ: Зберігаємо розсунуту сітку (без привида)
                    const layoutsWithoutGhost = liveLayouts.filter(
                        (l) => l.id !== SIDEBAR_GHOST_ID,
                    );
                    onLayoutChange(layoutsWithoutGhost);
                } else {
                    const widgetType = data.widgetType as Widget['type'];
                    const catalogItem = WIDGET_CATALOG.find(
                        (c) => c.type === widgetType,
                    );
                    (
                        window as Window & {
                            __pendingDropPosition?: { x: number; y: number };
                        }
                    ).__pendingDropPosition = findFreePosition(
                        layouts,
                        catalogItem?.defaultW ?? 3,
                        catalogItem?.defaultH ?? 3,
                    );
                }

                onAddWidget(data.widgetType as Widget['type']);

                sidebarGhostLayoutRef.current = null;
                activatorCoordsRef.current = null;
                setDraggingSidebarType(null);
            } else if (data?.fromGrid) {
                onLayoutChange(liveLayouts);
                setDraggingId(null);
            }
        },
        [layouts, liveLayouts, onAddWidget, onLayoutChange],
    );

    const handleDragCancel = useCallback(() => {
        sidebarGhostLayoutRef.current = null;
        activatorCoordsRef.current = null;
        setDraggingId(null);
        setDraggingSidebarType(null);
        setLiveLayouts(layouts);
    }, [layouts]);

    const sidebarCatalogItem = draggingSidebarType
        ? WIDGET_CATALOG.find((c) => c.type === draggingSidebarType)
        : null;

    const sidebarGhostWidget: Widget | null = draggingSidebarType
        ? ({ id: SIDEBAR_GHOST_ID, type: draggingSidebarType } as Widget)
        : null;

    return (
        <DndContext
            id="editor-dnd"
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            <div className="flex h-full flex-1 min-w-0">
                <EditorSidebar onAddWidget={onAddWidget} />

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
                    sidebarGhostId={SIDEBAR_GHOST_ID}
                    sidebarGhostWidget={sidebarGhostWidget}
                />
            </div>

            <DragOverlay dropAnimation={null}>
                {sidebarCatalogItem ? (
                    <div
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '6px 10px',
                            borderRadius: 10,
                            background: 'var(--t-surface)',
                            border: '1px solid var(--t-accent)',
                            opacity: 0.9,
                            pointerEvents: 'none',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                            fontSize: 13,
                            color: 'var(--t-text)',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        <span style={{ fontSize: 16 }}>
                            {sidebarCatalogItem.icon}
                        </span>
                        {sidebarCatalogItem.label}
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
