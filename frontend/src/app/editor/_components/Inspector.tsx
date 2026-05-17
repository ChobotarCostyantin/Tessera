'use client';

import React, { useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Widget, WidgetAppearance } from '@/types/widget';
import { RichTextEditor } from './RichTextEditor';

interface InspectorProps {
    widget: Widget | null;
    onUpdate: (id: string, patch: Partial<Widget>) => void;
    onDelete: (id: string) => void;
}

// ── Shared UI ─────────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
    return (
        <label className="block text-[10px] font-semibold uppercase tracking-[0.05em] mb-1.5" style={{ color: 'var(--t-muted)' }}>
            {children}
        </label>
    );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="mb-3">
            <Label>{label}</Label>
            {children}
        </div>
    );
}

function PlainInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
    return (
        <input
            className="w-full rounded-lg px-2.5 py-1.5 text-[12px] outline-none"
            style={{ background: 'var(--t-surface2)', border: '0.5px solid var(--t-border)', color: 'var(--t-text)', fontFamily: 'inherit' }}
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
        />
    );
}

function PlainTextArea({ value, onChange, placeholder, minHeight = '64px', helperText }: {
    value: string; onChange: (v: string) => void; placeholder?: string; minHeight?: string; helperText?: string;
}) {
    return (
        <>
            <textarea
                className="w-full rounded-lg px-2.5 py-1.5 text-[12px] outline-none resize-none"
                style={{ background: 'var(--t-surface2)', border: '0.5px solid var(--t-border)', color: 'var(--t-text)', fontFamily: 'inherit', minHeight }}
                value={value}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
            />
            {helperText && <p className="text-[10px] mt-1" style={{ color: 'var(--t-muted)' }}>{helperText}</p>}
        </>
    );
}

// ── Color picker popover ──────────────────────────────────────────────────────

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (c: string) => void }) {
    const [open, setOpen] = useState(false);
    const safeValue = value || '#1a1a1d';

    return (
        <div className="mb-3">
            <Label>{label}</Label>
            <div style={{ position: 'relative', display: 'inline-block' }}>
                <button
                    onClick={() => setOpen((p) => !p)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        background: 'var(--t-surface2)', border: '0.5px solid var(--t-border)',
                        borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontFamily: 'inherit',
                    }}
                >
                    <span style={{ width: 16, height: 16, borderRadius: 4, background: safeValue, display: 'inline-block', border: '1px solid rgba(255,255,255,0.12)' }} />
                    <span style={{ fontSize: 11, color: 'var(--t-muted)', fontFamily: 'monospace' }}>{safeValue}</span>
                </button>
                {open && (
                    <>
                        <div
                            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                            onClick={() => setOpen(false)}
                        />
                        <div style={{ position: 'absolute', top: '110%', left: 0, zIndex: 50, padding: 8, background: 'var(--t-surface2)', border: '0.5px solid var(--t-border)', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                            <HexColorPicker color={safeValue} onChange={onChange} />
                            <input
                                value={safeValue}
                                onChange={(e) => onChange(e.target.value)}
                                style={{ marginTop: 8, width: '100%', background: 'var(--t-surface)', border: '0.5px solid var(--t-border)', borderRadius: 6, padding: '3px 8px', fontSize: 11, color: 'var(--t-text)', fontFamily: 'monospace', outline: 'none' }}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ── Slider ────────────────────────────────────────────────────────────────────

function SliderField({ label, value, min, max, unit = '', onChange }: {
    label: string; value: number; min: number; max: number; unit?: string; onChange: (v: number) => void;
}) {
    return (
        <div className="mb-3">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <Label>{label}</Label>
                <span style={{ fontSize: 10, color: 'var(--t-accent)', fontFamily: 'monospace' }}>{value}{unit}</span>
            </div>
            <input
                type="range" min={min} max={max} value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--t-accent)', cursor: 'pointer' }}
            />
        </div>
    );
}

// ── Hover animation select ────────────────────────────────────────────────────

const HOVER_OPTIONS: { value: WidgetAppearance['hoverAnimation']; label: string; desc: string }[] = [
    { value: 'none', label: 'None', desc: 'No animation' },
    { value: 'lift', label: 'Lift', desc: 'Rises up with shadow' },
    { value: 'glow', label: 'Glow', desc: 'Accent color glow' },
    { value: 'scale', label: 'Scale', desc: 'Slight zoom in' },
];

function HoverAnimationField({ value, onChange }: {
    value: WidgetAppearance['hoverAnimation']; onChange: (v: WidgetAppearance['hoverAnimation']) => void;
}) {
    return (
        <div className="mb-3">
            <Label>Hover animation</Label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                {HOVER_OPTIONS.map((opt) => (
                    <button
                        key={opt.value}
                        onClick={() => onChange(opt.value)}
                        style={{
                            background: value === opt.value ? 'rgba(200,255,87,0.08)' : 'var(--t-surface2)',
                            border: value === opt.value ? '0.5px solid var(--t-accent)' : '0.5px solid var(--t-border)',
                            borderRadius: 8, padding: '6px 8px', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                        }}
                    >
                        <div style={{ fontSize: 11, fontWeight: 600, color: value === opt.value ? 'var(--t-accent)' : 'var(--t-text)' }}>{opt.label}</div>
                        <div style={{ fontSize: 9, color: 'var(--t-muted)', marginTop: 1 }}>{opt.desc}</div>
                    </button>
                ))}
            </div>
        </div>
    );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

type Tab = 'content' | 'style';

function Tabs({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
    return (
        <div style={{ display: 'flex', gap: 2, marginBottom: 12, background: 'var(--t-surface2)', borderRadius: 8, padding: 2 }}>
            {(['content', 'style'] as Tab[]).map((t) => (
                <button
                    key={t}
                    onClick={() => onChange(t)}
                    style={{
                        flex: 1, padding: '4px 0', borderRadius: 6, border: 'none', cursor: 'pointer',
                        fontSize: 11, fontWeight: 600, fontFamily: 'inherit', textTransform: 'capitalize',
                        background: active === t ? 'var(--t-surface)' : 'transparent',
                        color: active === t ? 'var(--t-text)' : 'var(--t-muted)',
                        transition: 'all 0.15s',
                    }}
                >
                    {t}
                </button>
            ))}
        </div>
    );
}

// ── Style tab ─────────────────────────────────────────────────────────────────

function StyleTab({ widget, onAppearanceChange }: { widget: Widget; onAppearanceChange: (a: Partial<WidgetAppearance>) => void }) {
    const ap = widget.appearance ?? {};

    return (
        <>
            <ColorField
                label="Background color"
                value={ap.bgColor || '#1a1a1d'}
                onChange={(c) => onAppearanceChange({ bgColor: c })}
            />
            <SliderField
                label="Border radius"
                value={ap.borderRadius ?? 14}
                min={0} max={28} unit="px"
                onChange={(v) => onAppearanceChange({ borderRadius: v })}
            />
            <HoverAnimationField
                value={ap.hoverAnimation ?? 'none'}
                onChange={(v) => onAppearanceChange({ hoverAnimation: v })}
            />
        </>
    );
}

// ── Content tab ───────────────────────────────────────────────────────────────

function ContentTab({ widget, patch }: { widget: Widget; patch: (p: Partial<Widget>) => void }) {
    switch (widget.type) {
        case 'about':
            return (
                <>
                    <Group label="Name">
                        <RichTextEditor value={widget.name} onChange={(v) => patch({ name: v } as any)} placeholder="Your name" singleLine minHeight={36} />
                    </Group>
                    <Group label="Role">
                        <RichTextEditor value={widget.role} onChange={(v) => patch({ role: v } as any)} placeholder="Your role" singleLine minHeight={36} />
                    </Group>
                    <Group label="Bio">
                        <RichTextEditor value={widget.bio ?? ''} onChange={(v) => patch({ bio: v } as any)} placeholder="Short bio..." minHeight={80} />
                    </Group>
                </>
            );

        case 'stat':
            return (
                <>
                    <Group label="Number">
                        <RichTextEditor value={widget.number} onChange={(v) => patch({ number: v } as any)} placeholder="42" singleLine minHeight={36} />
                    </Group>
                    <Group label="Label">
                        <RichTextEditor value={widget.label} onChange={(v) => patch({ label: v } as any)} placeholder="Description" singleLine minHeight={36} />
                    </Group>
                </>
            );

        case 'quote':
            return (
                <Group label="Quote text">
                    <RichTextEditor value={widget.text} onChange={(v) => patch({ text: v } as any)} placeholder="Your quote..." minHeight={80} />
                </Group>
            );

        case 'location':
            return (
                <>
                    <Group label="City"><PlainInput value={widget.city} onChange={(v) => patch({ city: v } as any)} /></Group>
                    <Group label="Country"><PlainInput value={widget.country} onChange={(v) => patch({ country: v } as any)} /></Group>
                    <Group label="Availability"><PlainInput value={widget.available} onChange={(v) => patch({ available: v } as any)} placeholder="Open to remote" /></Group>
                </>
            );

        case 'skills':
            return (
                <Group label="Skills (one per line)">
                    <PlainTextArea
                        value={widget.skills.map((s) => s.label).join('\n')}
                        onChange={(v) => {
                            const colors: Array<'green' | 'purple' | 'amber' | 'blue'> = ['blue', 'purple', 'green', 'amber'];
                            const skills = v.split('\n').filter(Boolean).map((label, i) => ({ label, color: colors[i % 4] }));
                            patch({ skills } as any);
                        }}
                        minHeight="100px"
                    />
                </Group>
            );

        case 'experience':
            return (
                <Group label="Items (role | company | period)">
                    <PlainTextArea
                        value={widget.items.map((i) => `${i.role} | ${i.company} | ${i.period}`).join('\n')}
                        onChange={(v) => {
                            const items = v.split('\n').filter(Boolean).map((line) => {
                                const [role = '', company = '', period = ''] = line.split('|').map((s) => s.trim());
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
                    <PlainTextArea
                        value={widget.links.map((l) => `${l.label} | ${l.url} | ${l.icon}`).join('\n')}
                        onChange={(v) => {
                            const links = v.split('\n').filter(Boolean).map((line) => {
                                const [label = '', url = '#', icon = '🔗'] = line.split('|').map((s) => s.trim());
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
}

// ── Main component ────────────────────────────────────────────────────────────

export function Inspector({ widget, onUpdate, onDelete }: InspectorProps) {
    const [tab, setTab] = useState<Tab>('content');

    if (!widget) {
        return (
            <aside className="w-54 shrink-0 p-4 overflow-y-auto" style={{ borderLeft: '0.5px solid var(--t-border)', background: 'var(--t-surface)' }}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] mb-3" style={{ color: 'var(--t-muted)' }}>Inspector</p>
                <p className="text-[12px] text-center pt-8 leading-relaxed" style={{ color: 'var(--t-muted)' }}>
                    Select a widget<br />to edit its content
                </p>
                <p className="text-[11px] text-center mt-3" style={{ color: 'rgba(200,255,87,0.35)' }}>
                    Resize by dragging<br />the bottom-right corner
                </p>
            </aside>
        );
    }

    const patch = (p: Partial<Widget>) => onUpdate(widget.id, p);

    const handleAppearanceChange = (ap: Partial<WidgetAppearance>) => {
        onUpdate(widget.id, { appearance: { ...widget.appearance, ...ap } } as any);
    };

    return (
        <aside className="w-54 shrink-0 p-4 flex flex-col h-full overflow-y-auto" style={{ borderLeft: '0.5px solid var(--t-border)', background: 'var(--t-surface)' }}>
            <div className="flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] mb-3" style={{ color: 'var(--t-muted)' }}>Inspector</p>

                <div className="mb-3">
                    <Label>Type</Label>
                    <span className="text-[13px] font-medium capitalize" style={{ color: 'var(--t-text)' }}>{widget.type}</span>
                </div>

                <Tabs active={tab} onChange={setTab} />

                {tab === 'content' && <ContentTab widget={widget} patch={patch} />}
                {tab === 'style' && <StyleTab widget={widget} onAppearanceChange={handleAppearanceChange} />}
            </div>

            <div className="mt-6 pt-4" style={{ borderTop: '0.5px solid var(--t-border)' }}>
                <button
                    className="w-full py-2 rounded-lg text-[12px] font-medium transition-colors hover:bg-[rgba(255,80,80,0.05)]"
                    style={{ background: 'transparent', border: '0.5px solid rgba(255,80,80,0.2)', color: 'rgba(255,100,100,0.7)', fontFamily: 'inherit', cursor: 'pointer' }}
                    onClick={() => onDelete(widget.id)}
                >
                    Delete widget
                </button>
            </div>
        </aside>
    );
}