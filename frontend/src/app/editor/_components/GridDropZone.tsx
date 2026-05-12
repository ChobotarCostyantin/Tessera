import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { CANVAS_W, CANVAS_H } from '@/lib/widgetConfig';

// Invisible drop zone that spans the entire grid canvas bounds
export function GridDropZone() {
    const { setNodeRef } = useDroppable({ id: 'canvas' });

    return (
        <div
            ref={setNodeRef}
            className="absolute inset-0 pointer-events-none"
            style={{ width: CANVAS_W, height: CANVAS_H + 40 }}
        />
    );
}