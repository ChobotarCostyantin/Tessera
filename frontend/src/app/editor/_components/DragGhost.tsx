import React from 'react';
import { Widget } from '@/types/widget';
import { WidgetRenderer } from './WidgetRenderer';

// Renders a semi-transparent preview of the widget at its calculated drop destination
export function DragGhost({ widget }: { widget: Widget }) {
    return (
        <div
            className="w-full h-full rounded-[14px] p-4 pointer-events-none overflow-hidden"
            style={{ background: 'rgba(200,255,87,0.06)', border: '2px dashed var(--t-accent)' }}
        >
            <div className="w-full h-full opacity-40 grayscale">
                <WidgetRenderer widget={widget} />
            </div>
        </div>
    );
}