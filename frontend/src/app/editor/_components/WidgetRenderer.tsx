'use client';

import React from 'react';
import { Widget } from '@/types/widget';

const TAG_COLORS: Record<string, string> = {
    green: 'bg-[rgba(99,153,34,0.12)]   text-[#97c459] border-[rgba(99,153,34,0.25)]',
    purple: 'bg-[rgba(124,109,255,0.12)] text-[#a89bff] border-[rgba(124,109,255,0.25)]',
    amber: 'bg-[rgba(186,117,23,0.12)]  text-[#ef9f27] border-[rgba(186,117,23,0.25)]',
    blue: 'bg-[rgba(55,138,221,0.12)]  text-[#85b7eb] border-[rgba(55,138,221,0.25)]',
};

export function WidgetRenderer({ widget }: { widget: Widget }) {
    switch (widget.type) {
        case 'about':
            return (
                <div className="flex flex-col h-full justify-center gap-2 overflow-hidden">
                    <div
                        className="w-14 h-14 rounded-full flex items-center justify-center text-2xl shrink-0"
                        style={{
                            background:
                                'linear-gradient(135deg, var(--t-accent2), #a855f7)',
                        }}
                    >
                        {widget.avatarEmoji ?? '👤'}
                    </div>
                    <div className="overflow-hidden">
                        <h3
                            className="text-xl font-semibold leading-tight tracking-tight truncate"
                            style={{ color: 'var(--t-text)' }}
                        >
                            {widget.name}
                        </h3>
                        <p
                            className="text-sm mt-0.5 truncate"
                            style={{ color: 'var(--t-muted)' }}
                        >
                            {widget.role}
                        </p>
                        {widget.bio && (
                            <p
                                className="text-xs mt-2 leading-relaxed line-clamp-3"
                                style={{ color: 'var(--t-muted)' }}
                            >
                                {widget.bio}
                            </p>
                        )}
                    </div>
                </div>
            );

        case 'skills':
            return (
                <div className="h-full flex flex-col overflow-hidden">
                    <p
                        className="text-[10px] font-semibold uppercase tracking-widest mb-2 shrink-0"
                        style={{ color: 'var(--t-muted)' }}
                    >
                        Skills
                    </p>
                    <div className="flex flex-wrap gap-1.5 overflow-hidden content-start">
                        {widget.skills.map((s, i) => (
                            <span
                                key={i}
                                className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${TAG_COLORS[s.color]}`}
                            >
                                {s.label}
                            </span>
                        ))}
                    </div>
                </div>
            );

        case 'experience':
            return (
                <div className="h-full flex flex-col overflow-hidden">
                    <p
                        className="text-[10px] font-semibold uppercase tracking-widest mb-2 shrink-0"
                        style={{ color: 'var(--t-muted)' }}
                    >
                        Experience
                    </p>
                    <div className="flex flex-col gap-3 overflow-hidden">
                        {widget.items.map((item, i) => (
                            <div key={i} className="shrink-0">
                                <div
                                    className="text-[13px] font-semibold"
                                    style={{ color: 'var(--t-text)' }}
                                >
                                    {item.role}
                                </div>
                                <div
                                    className="text-[11px] mt-0.5"
                                    style={{ color: 'var(--t-muted)' }}
                                >
                                    {item.company}
                                </div>
                                <div
                                    className="text-[10px] mt-0.5"
                                    style={{
                                        color: 'var(--t-accent)',
                                        opacity: 0.8,
                                    }}
                                >
                                    {item.period}
                                </div>
                            </div>
                        ))}
                    </div>
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
                                <span className="text-sm">{link.icon}</span>
                                {link.label}
                            </a>
                        ))}
                    </div>
                </div>
            );

        case 'stat':
            return (
                <div className="h-full flex flex-col justify-center overflow-hidden">
                    <div
                        className="font-semibold leading-none tracking-tighter"
                        style={{
                            fontSize: 'clamp(2rem, 3.5vw, 3.5rem)',
                            color: 'var(--t-accent)',
                        }}
                    >
                        {widget.number}
                    </div>
                    <div
                        className="text-[11px] mt-2"
                        style={{ color: 'var(--t-muted)' }}
                    >
                        {widget.label}
                    </div>
                </div>
            );

        case 'quote':
            return (
                <div className="h-full flex flex-col justify-center overflow-hidden">
                    <div
                        className="text-4xl leading-none mb-2"
                        style={{ color: 'var(--t-accent2)', opacity: 0.45 }}
                    >
                        &ldquo;
                    </div>
                    <p
                        className="text-[13px] leading-relaxed italic line-clamp-4"
                        style={{ color: 'rgba(240,239,238,0.8)' }}
                    >
                        {widget.text}
                    </p>
                </div>
            );

        case 'location':
            return (
                <div
                    className="h-full flex flex-col justify-end overflow-hidden"
                    style={{
                        background:
                            'linear-gradient(135deg, rgba(124,109,255,0.15), rgba(37,99,235,0.1))',
                    }}
                >
                    <div className="text-2xl mb-1.5">📍</div>
                    <div
                        className="text-sm font-semibold truncate"
                        style={{ color: 'var(--t-text)' }}
                    >
                        {widget.city}, {widget.country}
                    </div>
                    <div
                        className="text-[11px] mt-0.5 truncate"
                        style={{ color: 'var(--t-muted)' }}
                    >
                        {widget.available}
                    </div>
                </div>
            );

        default:
            return null;
    }
}
