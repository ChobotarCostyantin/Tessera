'use client';

import React, {useRef, useState, useCallback, useEffect} from 'react';
import {
    DndContext,
    DragEndEvent,
    DragStartEvent,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
    useDroppable,
    useDraggable,
} from '@dnd-kit/core';
import {CSS} from '@dnd-kit/utilities';
import {Widget, WidgetLayout} from '@/types/widget';
import {WidgetRenderer} from './WidgetRenderer';
import {
    GRID_COLS,
    GRID_ROWS,
    CELL_PX,
    GAP_PX,
    CANVAS_W,
    CANVAS_H,
    gridToPx,
} from '@/lib/widgetConfig';

interface BentoGridProps {
    widgets: Widget[];
    layouts: WidgetLayout[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
    onLayoutChange: (layouts: WidgetLayout[]) => void;
}

// Helper to check if two widgets overlap on the grid
function checkOverlap(a: WidgetLayout, b: WidgetLayout) {
    if (a.id === b.id) return false;
    return (
        a.x < b.x + b.w &&
        a.x + a.w > b.x &&
        a.y < b.y + b.h &&
        a.y + a.h > b.y
    );
}

// Dynamic collision resolution (Left-to-Right, then Top-to-Bottom)
function resolveCollisions(layouts: WidgetLayout[], activeId: string): WidgetLayout[] {
    const activeItem = layouts.find((l) => l.id === activeId);
    if (!activeItem) return layouts;

    const others = layouts.filter((l) => l.id !== activeId);

    // Sort remaining items top-to-bottom, left-to-right to maintain predictable flow
    others.sort((a, b) => a.y - b.y || a.x - b.x);

    const resolved: WidgetLayout[] = [{...activeItem}];

    for (const item of others) {
        let current = {...item};
        let hasCollision = true;
        let safetyCounter = 0; // Prevent infinite loops

        while (hasCollision && safetyCounter < 50) {
            hasCollision = false;
            for (const placed of resolved) {
                if (checkOverlap(current, placed)) {
                    // 1. Try to push the widget to the right first
                    current.x = placed.x + placed.w;

                    // 2. If it exceeds grid bounds horizontally, wrap to the next line
                    if (current.x + current.w > GRID_COLS) {
                        current.x = 0; // Reset to the left edge
                        current.y = placed.y + placed.h; // Push down below the placed item
                    }

                    hasCollision = true;
                    break; // Re-evaluate collisions with the new updated position
                }
            }
            safetyCounter++;
        }
        resolved.push(current);
    }

    return resolved;
}

function GridBackground() {
    const {setNodeRef} = useDroppable({id: 'canvas'});

    return (
        <div
            ref={setNodeRef}
            className="absolute inset-0 pointer-events-none"
            style={{width: CANVAS_W, height: CANVAS_H + 40}}
        />
    );
}

interface ResizeHandleProps {
    widgetId: string;
    layout: WidgetLayout;
    onResize: (id: string, w: number, h: number) => void;
}

function ResizeHandle({widgetId, layout, onResize}: ResizeHandleProps) {
    const startRef = useRef<{ mouseX: number; mouseY: number; w: number; h: number } | null>(null);

    const onMouseDown = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            e.preventDefault();

            // Store initial values on mouse down
            startRef.current = {mouseX: e.clientX, mouseY: e.clientY, w: layout.w, h: layout.h};

            const onMouseMove = (ev: MouseEvent) => {
                if (!startRef.current) return;

                // Calculate pure pixel delta
                const dx = ev.clientX - startRef.current.mouseX;
                const dy = ev.clientY - startRef.current.mouseY;

                // Convert pixel delta to grid unit delta
                const deltaW = Math.round(dx / (CELL_PX + GAP_PX));
                const deltaH = Math.round(dy / (CELL_PX + GAP_PX));

                // Apply constraints to avoid negative sizes or expanding out of grid bounds horizontally
                const newW = Math.min(GRID_COLS - layout.x, Math.max(1, startRef.current.w + deltaW));
                const newH = Math.max(1, startRef.current.h + deltaH); // Allows infinite vertical expansion

                onResize(widgetId, newW, newH);
            };

            const onMouseUp = () => {
                startRef.current = null;
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
            };

            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        },
        [widgetId, layout, onResize],
    );

    return (
        <div
            onMouseDown={onMouseDown}
            className="absolute bottom-1.5 right-1.5 w-4 h-4 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-20 cursor-se-resize flex items-end justify-end"
            style={{padding: '2px'}}
        >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <circle cx="7" cy="7" r="1" fill="var(--t-accent2)"/>
                <circle cx="4" cy="7" r="1" fill="var(--t-accent2)" opacity="0.5"/>
                <circle cx="7" cy="4" r="1" fill="var(--t-accent2)" opacity="0.5"/>
            </svg>
        </div>
    );
}

interface WidgetCellProps {
    widget: Widget;
    layout: WidgetLayout;
    isSelected: boolean;
    onSelect: () => void;
    onDelete: () => void;
    onResize: (id: string, w: number, h: number) => void;
    isDragging: boolean;
}

function WidgetCell({
                        widget,
                        layout,
                        isSelected,
                        onSelect,
                        onDelete,
                        onResize,
                        isDragging,
                    }: WidgetCellProps) {
    const {attributes, listeners, setNodeRef, transform} = useDraggable({
        id: widget.id,
        data: {layout},
    });

    // Calculate exact pixel position
    const baseX = layout.x * (CELL_PX + GAP_PX);
    const baseY = layout.y * (CELL_PX + GAP_PX);

    // Merge standard layout coordinates with active drag coordinates
    let finalX = baseX;
    let finalY = baseY;

    if (isDragging && transform) {
        finalX += transform.x;
        finalY += transform.y;
    }

    const style: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: gridToPx(layout.w),
        height: gridToPx(layout.h),
        // We use transform ONLY. This eliminates the twitching bug completely because
        // there is no conflict between CSS left/top transitions and dnd-kit transforms.
        transform: `translate3d(${finalX}px, ${finalY}px, 0)`,
        transition: isDragging
            ? 'box-shadow 0.2s, opacity 0.2s'
            : 'transform 0.25s ease-out, width 0.2s ease-out, height 0.2s ease-out, box-shadow 0.2s',
        zIndex: isDragging ? 50 : isSelected ? 10 : 1,
        opacity: isDragging ? 0.9 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="group" onClick={onSelect}>
            <div
                className="relative w-full h-full rounded-[14px] overflow-hidden"
                style={{
                    background: 'var(--t-surface)',
                    border: isSelected ? '1.5px solid var(--t-accent2)' : '0.5px solid var(--t-border)',
                    boxShadow: isDragging ? '0 20px 50px rgba(0,0,0,0.5)' : (isSelected ? '0 0 0 1px var(--t-accent2)' : 'none'),
                    padding: '16px',
                }}
            >
                {/* Drag handle */}
                <div
                    {...listeners}
                    {...attributes}
                    className="absolute inset-x-0 top-0 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-grab active:cursor-grabbing z-10"
                    style={{background: 'linear-gradient(to bottom, rgba(0,0,0,0.18), transparent)'}}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex gap-0.5">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="w-0.5 h-0.5 rounded-full"
                                 style={{background: 'rgba(255,255,255,0.5)'}}/>
                        ))}
                    </div>
                </div>

                {/* Delete button */}
                <button
                    className="absolute top-2 right-2 w-5 h-5 rounded-md text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    style={{
                        background: 'rgba(255,80,80,0.15)',
                        color: 'rgba(255,100,100,0.8)',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                >✕
                </button>

                {/* Content */}
                <div className="w-full h-full pointer-events-none">
                    <WidgetRenderer widget={widget}/>
                </div>

                {/* Resize handle */}
                <ResizeHandle widgetId={widget.id} layout={layout} onResize={onResize}/>
            </div>
        </div>
    );
}

// DragGhost represents the exact spot the dragged item will snap to
function DragGhost({widget}: { widget: Widget }) {
    return (
        <div
            className="w-full h-full rounded-[14px] p-4 pointer-events-none overflow-hidden"
            style={{background: 'rgba(200,255,87,0.06)', border: '2px dashed var(--t-accent)'}}
        >
            <div className="w-full h-full opacity-40 grayscale">
                <WidgetRenderer widget={widget}/>
            </div>
        </div>
    );
}

export function BentoGrid({
                              widgets,
                              layouts,
                              selectedId,
                              onSelect,
                              onDelete,
                              onLayoutChange,
                          }: BentoGridProps) {
    const canvasRef = useRef<HTMLDivElement>(null);

    // Live layouts update immediately during drag to trigger transitions
    const [liveLayouts, setLiveLayouts] = useState<WidgetLayout[]>(layouts);
    const initialLayoutsRef = useRef<WidgetLayout[]>([]);
    const [draggingId, setDraggingId] = useState<string | null>(null);

    // Sync external layout changes when not dragging
    useEffect(() => {
        if (!draggingId) setLiveLayouts(layouts);
    }, [layouts, draggingId]);

    const sensors = useSensors(
        useSensor(MouseSensor, {activationConstraint: {distance: 5}}),
        useSensor(TouchSensor, {activationConstraint: {delay: 150, tolerance: 5}}),
    );

    const handleDragStart = useCallback((event: DragStartEvent) => {
        setDraggingId(event.active.id as string);
        initialLayoutsRef.current = layouts; // Snapshot starting positions
    }, [layouts]);

    const handleDragMove = useCallback(
        (event: { active: { id: string }; delta: { x: number; y: number } }) => {
            const activeId = event.active.id as string;
            const startLayout = initialLayoutsRef.current.find(l => l.id === activeId);
            if (!startLayout) return;

            const snapX = Math.round(event.delta.x / (CELL_PX + GAP_PX));
            const snapY = Math.round(event.delta.y / (CELL_PX + GAP_PX));

            // Constrain X to grid boundaries, allow Y to expand downwards dynamically
            const newX = Math.max(0, Math.min(GRID_COLS - startLayout.w, startLayout.x + snapX));
            const newY = Math.max(0, startLayout.y + snapY);

            // Draft the new state based on initial positions, updating only the dragged item
            const draftLayouts = initialLayoutsRef.current.map((l) =>
                l.id === activeId ? {...l, x: newX, y: newY} : l
            );

            // Resolve collisions to push overlapping widgets left-to-right dynamically
            const compacted = resolveCollisions(draftLayouts, activeId);
            setLiveLayouts(compacted);
        },
        [],
    );

    const handleDragEnd = useCallback(
        () => {
            // Apply the final compacted state visually represented by liveLayouts
            onLayoutChange(liveLayouts);
            setDraggingId(null);
        },
        [liveLayouts, onLayoutChange],
    );

    const handleResize = useCallback(
        (id: string, w: number, h: number) => {
            // Instantly draft and resolve collisions during resize as well
            const draft = layouts.map((l) => (l.id === id ? {...l, w, h} : l));
            const compacted = resolveCollisions(draft, id);
            onLayoutChange(compacted);
        },
        [layouts, onLayoutChange],
    );

    const activeLiveLayout = draggingId ? liveLayouts.find(l => l.id === draggingId) : null;
    const draggingWidget = draggingId ? widgets.find((w) => w.id === draggingId) : null;

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
            <div className="flex items-center gap-2 mb-4">
                <span className="text-[11px]" style={{color: 'var(--t-muted)'}}>
                    Bento Grid — {GRID_COLS} cols × {GRID_ROWS} rows
                </span>
                <span className="text-[11px]" style={{color: 'rgba(200,255,87,0.5)'}}>
                    drag handle to move · bottom-right corner to resize
                </span>
            </div>

            <DndContext
                id="bento-grid-dnd"
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragMove={handleDragMove as any}
                onDragEnd={handleDragEnd}
            >
                <div ref={canvasRef} className="relative" style={{width: CANVAS_W, height: CANVAS_H + 60}}>
                    <GridBackground/>

                    <div
                        className="absolute pointer-events-none z-0"
                        style={{
                            top: 0, left: 0, width: CANVAS_W, height: CANVAS_H,
                            border: '1.5px dashed rgba(200,255,87,0.2)', borderRadius: 4,
                        }}
                    >
                        <span
                            className="absolute text-[9px] font-semibold uppercase tracking-widest"
                            style={{bottom: -18, right: 0, color: 'rgba(200,255,87,0.3)'}}
                        >
                            A4 boundary
                        </span>
                    </div>

                    {/* Snapped drop preview with DragGhost using resolved live position and translate3d */}
                    {activeLiveLayout && draggingWidget && (
                        <div
                            className="absolute top-0 left-0 pointer-events-none z-0 transition-transform duration-150 ease-out"
                            style={{
                                transform: `translate3d(${activeLiveLayout.x * (CELL_PX + GAP_PX)}px, ${activeLiveLayout.y * (CELL_PX + GAP_PX)}px, 0)`,
                                width: gridToPx(activeLiveLayout.w),
                                height: gridToPx(activeLiveLayout.h),
                            }}
                        >
                            <DragGhost widget={draggingWidget}/>
                        </div>
                    )}

                    {widgets.map((widget) => {
                        const isDragging = draggingId === widget.id;

                        // The active dragged item must remain anchored to its start position to let transform handle movement smoothly.
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
            </DndContext>
        </main>
    );
}