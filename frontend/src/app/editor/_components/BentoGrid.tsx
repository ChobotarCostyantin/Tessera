'use client';

import React, { useRef, useState, useCallback } from 'react';
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
    useDroppable,
    useDraggable,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Widget, WidgetLayout } from '@/types/widget';
import { WidgetRenderer } from './WidgetRenderer';
import {
    GRID_COLS, GRID_ROWS, CELL_PX, GAP_PX,
    CANVAS_W, CANVAS_H,
    gridToPx, pxToGrid, gridToOffset,
} from '@/lib/widgetConfig';

interface BentoGridProps {
    widgets: Widget[];
    layouts: WidgetLayout[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
    onLayoutChange: (layouts: WidgetLayout[]) => void;
}

function GridBackground() {
    const { setNodeRef } = useDroppable({ id: 'canvas' });

    return (
        <div
            ref={setNodeRef}
            className="absolute inset-0 pointer-events-none"
            style={{ width: CANVAS_W, height: CANVAS_H + 40 }}
        />
    );
}

interface ResizeHandleProps {
    widgetId: string;
    layout: WidgetLayout;
    onResize: (id: string, w: number, h: number) => void;
}

function ResizeHandle({ widgetId, layout, onResize }: ResizeHandleProps) {
    const startRef = useRef<{ mouseX: number; mouseY: number; w: number; h: number } | null>(null);

    const onMouseDown = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            e.preventDefault();

            // Store initial values on mouse down
            startRef.current = { mouseX: e.clientX, mouseY: e.clientY, w: layout.w, h: layout.h };

            const onMouseMove = (ev: MouseEvent) => {
                if (!startRef.current) return;

                // Calculate pure pixel delta
                const dx = ev.clientX - startRef.current.mouseX;
                const dy = ev.clientY - startRef.current.mouseY;

                // Convert pixel delta to grid unit delta
                const deltaW = Math.round(dx / (CELL_PX + GAP_PX));
                const deltaH = Math.round(dy / (CELL_PX + GAP_PX));

                // Apply constraints to avoid negative sizes or expanding out of grid bounds
                const newW = Math.min(GRID_COLS - layout.x, Math.max(1, startRef.current.w + deltaW));
                const newH = Math.min(GRID_ROWS - layout.y, Math.max(1, startRef.current.h + deltaH));

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
            style={{ padding: '2px' }}
        >
            {/* SE resize dots */}
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <circle cx="7" cy="7" r="1" fill="var(--t-accent2)" />
                <circle cx="4" cy="7" r="1" fill="var(--t-accent2)" opacity="0.5" />
                <circle cx="7" cy="4" r="1" fill="var(--t-accent2)" opacity="0.5" />
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

function WidgetCell({ widget, layout, isSelected, onSelect, onDelete, onResize, isDragging }: WidgetCellProps) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: widget.id,
        data: { layout },
    });

    const style: React.CSSProperties = {
        position: 'absolute',
        left: gridToOffset(layout.x),
        top: gridToOffset(layout.y),
        width: gridToPx(layout.w),
        height: gridToPx(layout.h),
        transform: CSS.Translate.toString(transform),
        transition: isDragging ? 'none' : 'box-shadow 0.15s',
        zIndex: isDragging ? 50 : isSelected ? 10 : 1,
        opacity: isDragging ? 0.35 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="group" onClick={onSelect}>
            <div
                className="relative w-full h-full rounded-[14px] overflow-hidden"
                style={{
                    background: 'var(--t-surface)',
                    border: isSelected
                        ? '1.5px solid var(--t-accent2)'
                        : '0.5px solid var(--t-border)',
                    boxShadow: isSelected ? '0 0 0 1px var(--t-accent2)' : 'none',
                    padding: '16px',
                }}
            >
                {/* Drag handle — top bar */}
                <div
                    {...listeners}
                    {...attributes}
                    className="absolute inset-x-0 top-0 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-grab active:cursor-grabbing z-10"
                    style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.18), transparent)' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex gap-0.5">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="w-0.5 h-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.5)' }} />
                        ))}
                    </div>
                </div>

                {/* Delete button */}
                <button
                    className="absolute top-2 right-2 w-5 h-5 rounded-md text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    style={{ background: 'rgba(255,80,80,0.15)', color: 'rgba(255,100,100,0.8)', border: 'none', cursor: 'pointer' }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                >✕</button>

                {/* Content */}
                <div className="w-full h-full">
                    <WidgetRenderer widget={widget} />
                </div>

                {/* Resize handle */}
                <ResizeHandle widgetId={widget.id} layout={layout} onResize={onResize} />
            </div>
        </div>
    );
}

function DragGhost({ widget, layout }: { widget: Widget; layout: WidgetLayout }) {
    return (
        <div
            style={{
                width: gridToPx(layout.w),
                height: gridToPx(layout.h),
                borderRadius: 14,
                padding: 16,
                background: 'var(--t-surface)',
                border: '1.5px solid var(--t-accent)',
                boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
                opacity: 0.95,
                pointerEvents: 'none',
            }}
        >
            <WidgetRenderer widget={widget} />
        </div>
    );
}

export function BentoGrid({ widgets, layouts, selectedId, onSelect, onDelete, onLayoutChange }: BentoGridProps) {
    const canvasRef = useRef<HTMLDivElement>(null);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [dropPreview, setDropPreview] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    );

    const getLayout = (id: string) => layouts.find((l) => l.id === id)!;

    const handleDragStart = useCallback((event: DragStartEvent) => {
        setDraggingId(event.active.id as string);
    }, []);

    const handleDragMove = useCallback(
        (event: { active: { id: string }; delta: { x: number; y: number } }) => {
            const layout = getLayout(event.active.id);
            if (!layout) return;
            const newX = Math.max(0, Math.min(GRID_COLS - layout.w, layout.x + pxToGrid(event.delta.x + (CELL_PX + GAP_PX) / 2) - (layout.w > 1 ? 0 : 0)));
            const newY = Math.max(0, Math.min(GRID_ROWS - layout.h, layout.y + pxToGrid(event.delta.y + (CELL_PX + GAP_PX) / 2) - (layout.h > 1 ? 0 : 0)));
            setDropPreview({ x: newX, y: newY, w: layout.w, h: layout.h });
        },
        [layouts],
    );

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, delta } = event;
            const layout = getLayout(active.id as string);
            if (!layout) { setDraggingId(null); setDropPreview(null); return; }

            const snapX = Math.round(delta.x / (CELL_PX + GAP_PX));
            const snapY = Math.round(delta.y / (CELL_PX + GAP_PX));
            const newX = Math.max(0, Math.min(GRID_COLS - layout.w, layout.x + snapX));
            const newY = Math.max(0, Math.min(GRID_ROWS - layout.h, layout.y + snapY));

            onLayoutChange(
                layouts.map((l) =>
                    l.id === layout.id ? { ...l, x: newX, y: newY } : l,
                ),
            );
            setDraggingId(null);
            setDropPreview(null);
        },
        [layouts, onLayoutChange],
    );

    const handleResize = useCallback(
        (id: string, w: number, h: number) => {
            onLayoutChange(layouts.map((l) => (l.id === id ? { ...l, w, h } : l)));
        },
        [layouts, onLayoutChange],
    );

    const draggingWidget = draggingId ? widgets.find((w) => w.id === draggingId) : null;
    const draggingLayout = draggingId ? getLayout(draggingId) : null;

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
            {/* Hint bar */}
            <div className="flex items-center gap-2 mb-4">
                <span className="text-[11px]" style={{ color: 'var(--t-muted)' }}>
                    Bento Grid — {GRID_COLS} cols × {GRID_ROWS} rows
                </span>
                <span className="text-[11px]" style={{ color: 'rgba(200,255,87,0.5)' }}>
                    drag handle to move · bottom-right corner to resize
                </span>
            </div>

            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragMove={handleDragMove as any} onDragEnd={handleDragEnd}>
                {/* Canvas */}
                <div
                    ref={canvasRef}
                    className="relative"
                    style={{ width: CANVAS_W, height: CANVAS_H + 60 }}
                >
                    <GridBackground />

                    {/* A4 boundary */}
                    <div
                        className="absolute pointer-events-none z-0"
                        style={{
                            top: 0, left: 0,
                            width: CANVAS_W, height: CANVAS_H,
                            border: '1.5px dashed rgba(200,255,87,0.2)',
                            borderRadius: 4,
                        }}
                    >
                        <span className="absolute text-[9px] font-semibold uppercase tracking-widest"
                              style={{ bottom: -18, right: 0, color: 'rgba(200,255,87,0.3)' }}>
                            A4 boundary
                        </span>
                    </div>

                    {/* Drop preview ghost */}
                    {dropPreview && draggingId && (
                        <div
                            className="absolute pointer-events-none z-0 rounded-[14px]"
                            style={{
                                left: gridToOffset(dropPreview.x),
                                top: gridToOffset(dropPreview.y),
                                width: gridToPx(dropPreview.w),
                                height: gridToPx(dropPreview.h),
                                border: '1.5px dashed var(--t-accent)',
                                background: 'rgba(200,255,87,0.04)',
                            }}
                        />
                    )}

                    {/* Widget cells */}
                    {widgets.map((widget) => {
                        const layout = layouts.find((l) => l.id === widget.id);
                        if (!layout) return null;
                        return (
                            <WidgetCell
                                key={widget.id}
                                widget={widget}
                                layout={layout}
                                isSelected={selectedId === widget.id}
                                isDragging={draggingId === widget.id}
                                onSelect={() => onSelect(widget.id)}
                                onDelete={() => onDelete(widget.id)}
                                onResize={handleResize}
                            />
                        );
                    })}
                </div>

                {/* Smooth drag overlay */}
                <DragOverlay dropAnimation={null}>
                    {draggingWidget && draggingLayout ? (
                        <DragGhost widget={draggingWidget} layout={draggingLayout} />
                    ) : null}
                </DragOverlay>
            </DndContext>
        </main>
    );
}