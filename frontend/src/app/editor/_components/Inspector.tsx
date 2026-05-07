'use client';

import React from 'react';
import { Widget } from '@/types/widget';

// ─── Interfaces ─────────────────────────────────────────────────────────────

interface InspectorProps {
    widget: Widget | null;
    onUpdate: (id: string, patch: Partial<Widget>) => void;
    onDelete: (id: string) => void;
}

// ─── UI Helper Components ───────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
    return (
        <label
            className="block text-[10px] font-semibold uppercase tracking-[0.05em] mb-1.5"
            style={{ color: 'var(--t-muted)' }}
        >
            {children}
        </label>
    );
}

function Input({
    value,
    onChange,
    placeholder,
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
}) {
    return (
        <input
            className="w-full rounded-lg px-2.5 py-1.5 text-[12px] outline-none"
            style={{
                background: 'var(--t-surface2)',
                border: '0.5px solid var(--t-border)',
                color: 'var(--t-text)',
                fontFamily: 'inherit',
            }}
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
        />
    );
}

function TextArea({
    value,
    onChange,
    placeholder,
    minHeight = '64px',
    helperText,
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    minHeight?: string;
    helperText?: string;
}) {
    return (
        <>
            <textarea
                className="w-full rounded-lg px-2.5 py-1.5 text-[12px] outline-none resize-none"
                style={{
                    background: 'var(--t-surface2)',
                    border: '0.5px solid var(--t-border)',
                    color: 'var(--t-text)',
                    fontFamily: 'inherit',
                    minHeight,
                }}
                value={value}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
            />
            {helperText && (
                <p
                    className="text-[10px] mt-1"
                    style={{ color: 'var(--t-muted)' }}
                >
                    {helperText}
                </p>
            )}
        </>
    );
}

function Group({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="mb-3">
            <Label>{label}</Label>
            {children}
        </div>
    );
}

// ─── Main Inspector Component ───────────────────────────────────────────────

export function Inspector({ widget, onUpdate, onDelete }: InspectorProps) {
    // Render empty state if no widget is selected
    if (!widget) {
        return (
            <aside
                className="w-54 shrink-0 p-4 overflow-y-auto"
                style={{
                    borderLeft: '0.5px solid var(--t-border)',
                    background: 'var(--t-surface)',
                }}
            >
                <p
                    className="text-[10px] font-semibold uppercase tracking-[0.08em] mb-3"
                    style={{ color: 'var(--t-muted)' }}
                >
                    Inspector
                </p>
                <p
                    className="text-[12px] text-center pt-8 leading-relaxed"
                    style={{ color: 'var(--t-muted)' }}
                >
                    Select a widget
                    <br />
                    to edit its content
                </p>
                <p
                    className="text-[11px] text-center mt-3"
                    style={{ color: 'rgba(200,255,87,0.35)' }}
                >
                    Resize by dragging
                    <br />
                    the bottom-right corner
                </p>
            </aside>
        );
    }

    // Helper function to dispatch partial updates to the current widget
    const patch = (p: Partial<Widget>) => onUpdate(widget.id, p);

    // Renders the specific configuration fields based on widget type
    const renderWidgetEditor = () => {
        switch (widget.type) {
            case 'about':
                return (
                    <>
                        <Group label="Name">
                            <Input
                                value={widget.name}
                                onChange={(v) => patch({ name: v } as any)}
                                placeholder="Your name"
                            />
                        </Group>
                        <Group label="Role">
                            <Input
                                value={widget.role}
                                onChange={(v) => patch({ role: v } as any)}
                                placeholder="Your role"
                            />
                        </Group>
                        <Group label="Bio">
                            <TextArea
                                value={widget.bio ?? ''}
                                onChange={(v) => patch({ bio: v } as any)}
                                placeholder="Short bio..."
                            />
                        </Group>
                    </>
                );

            case 'stat':
                return (
                    <>
                        <Group label="Number">
                            <Input
                                value={widget.number}
                                onChange={(v) => patch({ number: v } as any)}
                                placeholder="42"
                            />
                        </Group>
                        <Group label="Label">
                            <Input
                                value={widget.label}
                                onChange={(v) => patch({ label: v } as any)}
                                placeholder="Description"
                            />
                        </Group>
                    </>
                );

            case 'quote':
                return (
                    <Group label="Quote text">
                        <TextArea
                            value={widget.text}
                            onChange={(v) => patch({ text: v } as any)}
                            placeholder="Your quote..."
                            minHeight="80px"
                        />
                    </Group>
                );

            case 'location':
                return (
                    <>
                        <Group label="City">
                            <Input
                                value={widget.city}
                                onChange={(v) => patch({ city: v } as any)}
                            />
                        </Group>
                        <Group label="Country">
                            <Input
                                value={widget.country}
                                onChange={(v) => patch({ country: v } as any)}
                            />
                        </Group>
                        <Group label="Availability">
                            <Input
                                value={widget.available}
                                onChange={(v) => patch({ available: v } as any)}
                                placeholder="Open to remote"
                            />
                        </Group>
                    </>
                );

            case 'skills':
                return (
                    <Group label="Skills (one per line)">
                        <TextArea
                            value={widget.skills.map((s) => s.label).join('\n')}
                            onChange={(v) => {
                                // Cycle through predefined tag colors for visual variety
                                const colors: Array<
                                    'green' | 'purple' | 'amber' | 'blue'
                                > = ['blue', 'purple', 'green', 'amber'];
                                const skills = v
                                    .split('\n')
                                    .filter(Boolean)
                                    .map((label, i) => ({
                                        label,
                                        color: colors[i % 4],
                                    }));
                                patch({ skills } as any);
                            }}
                            minHeight="100px"
                        />
                    </Group>
                );

            case 'experience':
                return (
                    <Group label="Items (role | company | period)">
                        <TextArea
                            value={widget.items
                                .map(
                                    (i) =>
                                        `${i.role} | ${i.company} | ${i.period}`,
                                )
                                .join('\n')}
                            onChange={(v) => {
                                const items = v
                                    .split('\n')
                                    .filter(Boolean)
                                    .map((line) => {
                                        const [
                                            role = '',
                                            company = '',
                                            period = '',
                                        ] = line
                                            .split('|')
                                            .map((s) => s.trim());
                                        return { role, company, period };
                                    });
                                patch({ items } as any);
                            }}
                            minHeight="100px"
                            helperText="Each line: Role | Company | Period"
                        />
                    </Group>
                );

            case 'links':
                return (
                    <Group label="Links (label | url | icon)">
                        <TextArea
                            value={widget.links
                                .map((l) => `${l.label} | ${l.url} | ${l.icon}`)
                                .join('\n')}
                            onChange={(v) => {
                                const links = v
                                    .split('\n')
                                    .filter(Boolean)
                                    .map((line) => {
                                        const [
                                            label = '',
                                            url = '#',
                                            icon = '🔗',
                                        ] = line
                                            .split('|')
                                            .map((s) => s.trim());
                                        return { label, url, icon };
                                    });
                                patch({ links } as any);
                            }}
                            minHeight="80px"
                            helperText="Each line: Label | URL | Emoji"
                        />
                    </Group>
                );

            default:
                return null;
        }
    };

    return (
        <aside
            className="w-54 shrink-0 p-4 flex flex-col h-full overflow-y-auto"
            style={{
                borderLeft: '0.5px solid var(--t-border)',
                background: 'var(--t-surface)',
            }}
        >
            <div className="flex-1">
                <p
                    className="text-[10px] font-semibold uppercase tracking-[0.08em] mb-3"
                    style={{ color: 'var(--t-muted)' }}
                >
                    Inspector
                </p>

                <Group label="Type">
                    <span
                        className="text-[13px] font-medium capitalize"
                        style={{ color: 'var(--t-text)' }}
                    >
                        {widget.type}
                    </span>
                </Group>

                {renderWidgetEditor()}
            </div>

            {/* Delete Action Section */}
            <div
                className="mt-6 pt-4"
                style={{ borderTop: '0.5px solid var(--t-border)' }}
            >
                <button
                    className="w-full py-2 rounded-lg text-[12px] font-medium transition-colors hover:bg-[rgba(255,80,80,0.05)]"
                    style={{
                        background: 'transparent',
                        border: '0.5px solid rgba(255,80,80,0.2)',
                        color: 'rgba(255,100,100,0.7)',
                        fontFamily: 'inherit',
                        cursor: 'pointer',
                    }}
                    onClick={() => onDelete(widget.id)}
                >
                    Delete widget
                </button>
            </div>
        </aside>
    );
}
