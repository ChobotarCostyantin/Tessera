import React from 'react';
import { Widget } from '@/types/widget';
import { WidgetRenderer } from './WidgetRenderer';
import { WIDGET_CATALOG } from '@/lib/widgetConfig';

export function DragGhost({ widget }: { widget: Widget }) {
    const isSidebarGhost = !('content' in widget) && !('items' in widget) && !('links' in widget);

    const catalogItem = isSidebarGhost
        ? WIDGET_CATALOG.find((c) => c.type === widget.type)
        : null;

    return (
        <div
            className="w-full h-full rounded-[14px] p-4 pointer-events-none overflow-hidden"
            style={{ background: 'rgba(200,255,87,0.06)', border: '2px dashed var(--t-accent)' }}
        >
            {isSidebarGhost ? (
                // Sidebar ghost fallback — no WidgetRenderer, just icon + label
                <div
                    className="w-full h-full flex flex-col items-center justify-center gap-2 opacity-50"
                    style={{ color: 'var(--t-text)' }}
                >
                    {catalogItem && (
                        <>
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                                style={{ background: catalogItem.color }}
                            >
                                {catalogItem.icon}
                            </div>
                            <span className="text-[12px] font-medium">{catalogItem.label}</span>
                        </>
                    )}
                </div>
            ) : (
                // Full ghost for existing grid widgets
                <div className="w-full h-full opacity-40 grayscale">
                    <WidgetRenderer widget={widget} />
                </div>
            )}
        </div>
    );
}