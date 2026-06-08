import React, { useRef, useCallback } from 'react';
import { WidgetLayout } from '@/types/widget';
import { CELL_PX, GAP_PX, GRID_COLS } from '@/lib/widgetConfig';

interface ResizeHandleProps {
    widgetId: string;
    layout: WidgetLayout;
    onResize: (id: string, w: number, h: number) => void;
}

export function ResizeHandle({
    widgetId,
    layout,
    onResize,
}: ResizeHandleProps) {
    const startRef = useRef<{
        mouseX: number;
        mouseY: number;
        w: number;
        h: number;
    } | null>(null);

    const onMouseDown = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            e.preventDefault();
            startRef.current = {
                mouseX: e.clientX,
                mouseY: e.clientY,
                w: layout.w,
                h: layout.h,
            };

            const onMouseMove = (ev: MouseEvent) => {
                if (!startRef.current) return;
                const dx = ev.clientX - startRef.current.mouseX;
                const dy = ev.clientY - startRef.current.mouseY;

                const deltaW = Math.round(dx / (CELL_PX + GAP_PX));
                const deltaH = Math.round(dy / (CELL_PX + GAP_PX));

                const newW = Math.min(
                    GRID_COLS - layout.x,
                    Math.max(1, startRef.current.w + deltaW),
                );
                const newH = Math.max(1, startRef.current.h + deltaH);

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
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <circle cx="7" cy="7" r="1" fill="var(--t-accent2)" />
                <circle
                    cx="4"
                    cy="7"
                    r="1"
                    fill="var(--t-accent2)"
                    opacity="0.5"
                />
                <circle
                    cx="7"
                    cy="4"
                    r="1"
                    fill="var(--t-accent2)"
                    opacity="0.5"
                />
            </svg>
        </div>
    );
}
