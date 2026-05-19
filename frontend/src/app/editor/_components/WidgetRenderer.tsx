'use client';

import React from 'react';
import { Widget } from '@/types/widget';

function RichField({
    html,
    className,
    style,
}: {
    html: string;
    className?: string;
    style?: React.CSSProperties;
}) {
    const isHtml = html?.trim().startsWith('<');
    if (isHtml) {
        return (
            <div
                className={className}
                style={style}
                dangerouslySetInnerHTML={{ __html: html }}
            />
        );
    }
    return (
        <div className={className} style={style}>
            {html}
        </div>
    );
}

export function WidgetRenderer({ widget }: { widget: Widget }) {
    switch (widget.type) {
        case 'experience':
            return (
                <div className="flex flex-col h-full overflow-y-auto custom-scrollbar gap-3">
                    {widget.items?.map((item, i) => (
                        <div
                            key={i}
                            className="relative pl-3 border-l-[1.5px] border-(--t-border)"
                        >
                            <RichField
                                html={item.content}
                                style={{ color: 'var(--t-text)' }}
                            />
                        </div>
                    ))}
                </div>
            );

        case 'links':
            return (
                <div className="h-full flex flex-col overflow-hidden">
                    <p
                        className="text-[10px] font-semibold uppercase tracking-widest mb-2 shrink-0"
                        style={{ color: 'var(--t-muted)' }}
                    >
                        Links
                    </p>
                    <div className="flex flex-col gap-1.5 overflow-hidden">
                        {widget.links.map((link, i) => (
                            <a
                                key={i}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-[12px] font-medium transition-colors shrink-0"
                                style={{
                                    background: 'var(--t-surface2)',
                                    color: 'var(--t-text)',
                                    border: '0.5px solid var(--t-border)',
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>
                </div>
            );

        case 'text':
            return (
                <div className="h-full w-full overflow-hidden flex flex-col">
                    <RichField
                        html={widget.content}
                        className="text-[13px] leading-relaxed w-full h-full"
                        style={{ color: 'var(--t-text)' }}
                    />
                </div>
            );

        case 'image':
            if (!widget.imageUrl) {
                return (
                    <div className="h-full w-full flex flex-col items-center justify-center text-center opacity-50">
                        <span className="text-3xl mb-2">🖼️</span>
                        <span className="text-[10px] uppercase tracking-widest">
                            No image
                        </span>
                    </div>
                );
            }
            return (
                <div className="h-full w-full overflow-hidden absolute inset-0 rounded-[inherit]">
                    <img
                        src={widget.imageUrl}
                        alt={widget.altText || 'Widget image'}
                        className="w-full h-full pointer-events-none"
                        style={{ objectFit: widget.objectFit }}
                    />
                </div>
            );

        case 'progress':
            return (
                <div className="h-full flex flex-col justify-center gap-2 overflow-hidden">
                    <p
                        className="text-[10px] font-semibold uppercase tracking-widest mb-2 shrink-0"
                        style={{ color: 'var(--t-muted)' }}
                    >
                        Skills
                    </p>
                    {widget.items.map((item, i) => {
                        const colorHex =
                            {
                                green: '#97c459',
                                purple: '#a89bff',
                                amber: '#ef9f27',
                                blue: '#85b7eb',
                            }[item.color] || item.color;

                        return (
                            <div key={i} className="flex flex-col shrink-0">
                                <div className="flex justify-between items-end mb-1.5">
                                    <RichField
                                        html={item.label}
                                        className="text-[12px] font-semibold truncate"
                                        style={{ color: 'var(--t-text)' }}
                                    />
                                    <span
                                        className="text-[10px] font-mono ml-2 shrink-0"
                                        style={{ color: colorHex }}
                                    >
                                        {item.progress}%
                                    </span>
                                </div>
                                <div className="w-full h-1.5 rounded-full overflow-hidden bg-[rgba(255,255,255,0.05)]">
                                    <div
                                        className="h-full rounded-full transition-all duration-500 ease-out"
                                        style={{
                                            width: `${item.progress}%`,
                                            backgroundColor: colorHex,
                                            boxShadow: `0 0 10px ${colorHex}40`,
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            );

        default:
            return null;
    }
}
