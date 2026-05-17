import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Widget, WidgetLayout } from '@/types/widget';
import { WidgetRenderer } from './WidgetRenderer';
import { ResizeHandle } from './ResizeHandle';
import { CELL_PX, GAP_PX, gridToPx } from '@/lib/widgetConfig';

interface WidgetCellProps {
    widget: Widget;
    layout: WidgetLayout;
    isSelected: boolean;
    isDragging: boolean;
    onSelect: () => void;
    onDelete: () => void;
    onResize: (id: string, w: number, h: number) => void;
}

// CSS for hover animations — injected once via a <style> tag
const HOVER_ANIMATION_CSS = `
.widget-hover-lift:hover  { transform: translateY(-4px) !important; box-shadow: 0 24px 48px rgba(0,0,0,0.55) !important; }
.widget-hover-glow:hover  { box-shadow: 0 0 0 2px var(--t-accent), 0 0 32px rgba(200,255,87,0.25) !important; }
.widget-hover-scale:hover { transform: scale(1.025) !important; }
`;

let cssInjected = false;
function injectCss() {
    if (cssInjected || typeof document === 'undefined') return;
    const el = document.createElement('style');
    el.textContent = HOVER_ANIMATION_CSS;
    document.head.appendChild(el);
    cssInjected = true;
}

export function WidgetCell({ widget, layout, isSelected, isDragging, onSelect, onDelete, onResize }: WidgetCellProps) {
    injectCss();

    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: widget.id,
        data: { layout, fromGrid: true },
    });

    const ap = widget.appearance;
    const hoverClass = !isDragging && ap?.hoverAnimation && ap.hoverAnimation !== 'none'
        ? `widget-hover-${ap.hoverAnimation}`
        : '';

    const baseX = layout.x * (CELL_PX + GAP_PX);
    const baseY = layout.y * (CELL_PX + GAP_PX);
    const finalX = isDragging && transform ? baseX + transform.x : baseX;
    const finalY = isDragging && transform ? baseY + transform.y : baseY;

    const borderRadius = ap?.borderRadius ?? 14;

    const outerStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: gridToPx(layout.w),
        height: gridToPx(layout.h),
        transform: `translate3d(${finalX}px, ${finalY}px, 0)`,
        transition: isDragging
            ? 'box-shadow 0.2s, opacity 0.2s'
            : 'transform 0.25s ease-out, width 0.2s ease-out, height 0.2s ease-out, box-shadow 0.2s',
        zIndex: isDragging ? 50 : isSelected ? 10 : 1,
        opacity: isDragging ? 0.9 : 1,
    };

    const innerStyle: React.CSSProperties = {
        background: ap?.bgColor ?? 'var(--t-surface)',
        border: isSelected ? '1.5px solid var(--t-accent2)' : '0.5px solid var(--t-border)',
        boxShadow: isDragging ? '0 20px 50px rgba(0,0,0,0.5)' : isSelected ? '0 0 0 1px var(--t-accent2)' : 'none',
        borderRadius,
        padding: '16px',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
    };

    return (
        <div ref={setNodeRef} style={outerStyle} className={`group ${hoverClass}`} onClick={onSelect}>
            <div className="relative w-full h-full overflow-hidden" style={innerStyle}>
                {/* Drag handle */}
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
                >
                    ✕
                </button>

                <div className="w-full h-full pointer-events-none">
                    <WidgetRenderer widget={widget} />
                </div>

                <ResizeHandle widgetId={widget.id} layout={layout} onResize={onResize} />
            </div>
        </div>
    );
}