import React from 'react';
import { useDroppable } from '@dnd-kit/core';

export function GridDropZone() {
    const { setNodeRef } = useDroppable({ id: 'canvas' });

    return (
        <div
            ref={setNodeRef}
            className="absolute inset-0 pointer-events-none"
        />
    );
}