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
        <label
            className="block text-[10px] font-semibold uppercase tracking-[0.05em] mb-1.5"
            style={{ color: 'var(--t-muted)' }}
        >
            {children}
        </label>
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

function PlainInput({
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

// function PlainTextArea({
//                            value,
//                            onChange,
//                            placeholder,
//                            minHeight = '64px',
//                            helperText,
//                        }: {
//     value: string;
//     onChange: (v: string) => void;
//     placeholder?: string;
//     minHeight?: string;
//     helperText?: string;
// }) {
//     const [localValue, setLocalValue] = React.useState(value);
//     const [isFocused, setIsFocused] = React.useState(false);
//     React.useEffect(() => {
//         if (!isFocused) {
//             setLocalValue(value);
//         }
//     }, [value, isFocused]);
//
//     const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
//         setLocalValue(e.target.value); // Показуємо юзеру його сирий текст
//         onChange(e.target.value);      // Відправляємо дані для збереження
//     };
//
//     return (
//         <>
//             <textarea
//                 className="w-full rounded-lg px-2.5 py-1.5 text-[12px] outline-none resize-none"
//                 style={{
//                     background: 'var(--t-surface2)',
//                     border: '0.5px solid var(--t-border)',
//                     color: 'var(--t-text)',
//                     fontFamily: 'inherit',
//                     minHeight,
//                 }}
//                 value={isFocused ? localValue : value}
//                 onFocus={() => setIsFocused(true)}
//                 onBlur={() => {
//                     setIsFocused(false);
//                     setLocalValue(value);
//                 }}
//                 placeholder={placeholder}
//                 onChange={handleChange}
//             />
//             {helperText && (
//                 <p
//                     className="text-[10px] mt-1"
//                     style={{ color: 'var(--t-muted)' }}
//                 >
//                     {helperText}
//                 </p>
//             )}
//         </>
//     );
// }

// ── Color picker popover ──────────────────────────────────────────────────────

function ColorField({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (c: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const safeValue = value || '#1a1a1d';

    return (
        <div className="mb-3">
            <Label>{label}</Label>
            <div style={{ position: 'relative', display: 'inline-block' }}>
                <button
                    onClick={() => setOpen((p) => !p)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        background: 'var(--t-surface2)',
                        border: '0.5px solid var(--t-border)',
                        borderRadius: 8,
                        padding: '5px 10px',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                    }}
                >
                    <span
                        style={{
                            width: 16,
                            height: 16,
                            borderRadius: 4,
                            background: safeValue,
                            display: 'inline-block',
                            border: '1px solid rgba(255,255,255,0.12)',
                        }}
                    />
                    <span
                        style={{
                            fontSize: 11,
                            color: 'var(--t-muted)',
                            fontFamily: 'monospace',
                        }}
                    >
                        {safeValue}
                    </span>
                </button>
                {open && (
                    <>
                        <div
                            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                            onClick={() => setOpen(false)}
                        />
                        <div
                            style={{
                                position: 'absolute',
                                top: '110%',
                                left: 0,
                                zIndex: 50,
                                padding: 8,
                                background: 'var(--t-surface2)',
                                border: '0.5px solid var(--t-border)',
                                borderRadius: 12,
                                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                            }}
                        >
                            <HexColorPicker
                                color={safeValue}
                                onChange={onChange}
                            />
                            <input
                                value={safeValue}
                                onChange={(e) => onChange(e.target.value)}
                                style={{
                                    marginTop: 8,
                                    width: '100%',
                                    background: 'var(--t-surface)',
                                    border: '0.5px solid var(--t-border)',
                                    borderRadius: 6,
                                    padding: '3px 8px',
                                    fontSize: 11,
                                    color: 'var(--t-text)',
                                    fontFamily: 'monospace',
                                    outline: 'none',
                                }}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ── Slider ────────────────────────────────────────────────────────────────────

function SliderField({
    label,
    value,
    min,
    max,
    unit = '',
    onChange,
}: {
    label: string;
    value: number;
    min: number;
    max: number;
    unit?: string;
    onChange: (v: number) => void;
}) {
    return (
        <div className="mb-3">
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 6,
                }}
            >
                <Label>{label}</Label>
                <span
                    style={{
                        fontSize: 10,
                        color: 'var(--t-accent)',
                        fontFamily: 'monospace',
                    }}
                >
                    {value}
                    {unit}
                </span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                style={{
                    width: '100%',
                    accentColor: 'var(--t-accent)',
                    cursor: 'pointer',
                }}
            />
        </div>
    );
}

// ── Hover animation select ────────────────────────────────────────────────────

const HOVER_OPTIONS: {
    value: WidgetAppearance['hoverAnimation'];
    label: string;
    desc: string;
}[] = [
    { value: 'none', label: 'None', desc: 'No animation' },
    { value: 'lift', label: 'Lift', desc: 'Rises up with shadow' },
    { value: 'glow', label: 'Glow', desc: 'Accent color glow' },
    { value: 'scale', label: 'Scale', desc: 'Slight zoom in' },
];

function HoverAnimationField({
    value,
    onChange,
}: {
    value: WidgetAppearance['hoverAnimation'];
    onChange: (v: WidgetAppearance['hoverAnimation']) => void;
}) {
    return (
        <div className="mb-3">
            <Label>Hover animation</Label>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 4,
                }}
            >
                {HOVER_OPTIONS.map((opt) => (
                    <button
                        key={opt.value}
                        onClick={() => onChange(opt.value)}
                        style={{
                            background:
                                value === opt.value
                                    ? 'rgba(200,255,87,0.08)'
                                    : 'var(--t-surface2)',
                            border:
                                value === opt.value
                                    ? '0.5px solid var(--t-accent)'
                                    : '0.5px solid var(--t-border)',
                            borderRadius: 8,
                            padding: '6px 8px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontFamily: 'inherit',
                        }}
                    >
                        <div
                            style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color:
                                    value === opt.value
                                        ? 'var(--t-accent)'
                                        : 'var(--t-text)',
                            }}
                        >
                            {opt.label}
                        </div>
                        <div
                            style={{
                                fontSize: 9,
                                color: 'var(--t-muted)',
                                marginTop: 1,
                            }}
                        >
                            {opt.desc}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

type Tab = 'content' | 'style';

function Tabs({
    active,
    onChange,
}: {
    active: Tab;
    onChange: (t: Tab) => void;
}) {
    return (
        <div
            style={{
                display: 'flex',
                gap: 2,
                marginBottom: 12,
                background: 'var(--t-surface2)',
                borderRadius: 8,
                padding: 2,
            }}
        >
            {(['content', 'style'] as Tab[]).map((t) => (
                <button
                    key={t}
                    onClick={() => onChange(t)}
                    style={{
                        flex: 1,
                        padding: '4px 0',
                        borderRadius: 6,
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 11,
                        fontWeight: 600,
                        fontFamily: 'inherit',
                        textTransform: 'capitalize',
                        background:
                            active === t ? 'var(--t-surface)' : 'transparent',
                        color:
                            active === t ? 'var(--t-text)' : 'var(--t-muted)',
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

function StyleTab({
    widget,
    onAppearanceChange,
}: {
    widget: Widget;
    onAppearanceChange: (a: Partial<WidgetAppearance>) => void;
}) {
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
                min={0}
                max={28}
                unit="px"
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

function ContentTab({
    widget,
    patch,
}: {
    widget: any;
    patch: (p: any) => void;
}) {
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            alert('Файл занадто великий! Максимум 2MB.');
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) =>
            patch({ imageUrl: event.target?.result as string });
        reader.readAsDataURL(file);
    };

    switch (widget.type) {
        case 'text':
            return (
                <Group label="Content">
                    <RichTextEditor
                        value={widget.content || widget.bio || ''}
                        onChange={(v) =>
                            patch(
                                widget.type === 'about'
                                    ? { bio: v }
                                    : { content: v },
                            )
                        }
                        placeholder="Write something..."
                        minHeight={150}
                    />
                </Group>
            );

        case 'image':
            return (
                <>
                    <Group label="Upload from PC">
                        <label
                            className="flex flex-col items-center justify-center w-full p-4 rounded-lg cursor-pointer transition-colors hover:bg-(--t-surface)"
                            style={{
                                background: 'var(--t-surface2)',
                                border: '1px dashed var(--t-border)',
                                color: 'var(--t-text)',
                            }}
                        >
                            <span className="text-xl mb-1">📁</span>
                            <span className="text-[11px] font-medium">
                                Choose a photo
                            </span>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileUpload}
                            />
                        </label>
                    </Group>
                    <Group label="Or paste the URL">
                        <PlainInput
                            value={widget.imageUrl || ''}
                            onChange={(v) => patch({ imageUrl: v })}
                            placeholder="https://..."
                        />
                    </Group>
                    <Group label="Object Fit">
                        <div className="flex gap-2">
                            {['cover', 'contain'].map((fit) => (
                                <button
                                    key={fit}
                                    onClick={() => patch({ objectFit: fit })}
                                    className={`flex-1 py-1.5 text-[11px] rounded border transition-colors ${widget.objectFit === fit ? 'border-(--t-accent) text-(--t-accent) bg-[rgba(200,255,87,0.1)]' : 'border-(--t-border) text-(--t-muted)'}`}
                                >
                                    {fit}
                                </button>
                            ))}
                        </div>
                    </Group>
                </>
            );

        case 'experience':
            return (
                <div className="flex flex-col gap-4">
                    {(widget.items || []).map((item: any, idx: number) => (
                        <div
                            key={idx}
                            className="p-3 rounded-xl"
                            style={{
                                background: 'var(--t-surface2)',
                                border: '0.5px solid var(--t-border)',
                            }}
                        >
                            <div className="mb-2">
                                <Label>Experience {idx + 1}</Label>
                                <RichTextEditor
                                    value={item.content || ''}
                                    onChange={(v) => {
                                        const newItems = [...widget.items];
                                        newItems[idx].content = v;
                                        patch({ items: newItems });
                                    }}
                                    placeholder="Describe the experience..."
                                    minHeight={100}
                                />
                            </div>
                            <button
                                onClick={() =>
                                    patch({
                                        items: widget.items.filter(
                                            (_: any, i: number) => i !== idx,
                                        ),
                                    })
                                }
                                className="w-full mt-2 py-1.5 text-[11px] font-medium rounded-lg text-[rgba(255,100,100,0.8)] border border-[rgba(255,80,80,0.2)]"
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={() =>
                            patch({
                                items: [
                                    ...(widget.items || []),
                                    { content: '<p>New experience...</p>' },
                                ],
                            })
                        }
                        className="w-full py-2.5 text-[11px] font-semibold rounded-xl border border-dashed border-(--t-border) text-(--t-text) hover:bg-(--t-surface2)"
                    >
                        + Add experience
                    </button>
                </div>
            );

        case 'links':
            return (
                <div className="flex flex-col gap-4">
                    {(widget.links || []).map((link: any, idx: number) => (
                        <div
                            key={idx}
                            className="p-3 rounded-xl"
                            style={{
                                background: 'var(--t-surface2)',
                                border: '0.5px solid var(--t-border)',
                            }}
                        >
                            <div className="mb-2">
                                <Label>Name</Label>
                                <PlainInput
                                    value={link.label || ''}
                                    onChange={(v) => {
                                        const n = [...widget.links];
                                        n[idx].label = v;
                                        patch({ links: n });
                                    }}
                                    placeholder="Наприклад: Instagram"
                                />
                            </div>
                            <div>
                                <Label>URL</Label>
                                <PlainInput
                                    value={link.url || ''}
                                    onChange={(v) => {
                                        const n = [...widget.links];
                                        n[idx].url = v;
                                        patch({ links: n });
                                    }}
                                    placeholder="https://..."
                                />
                            </div>
                            <button
                                onClick={() =>
                                    patch({
                                        links: widget.links.filter(
                                            (_: any, i: number) => i !== idx,
                                        ),
                                    })
                                }
                                className="w-full mt-3 py-1.5 text-[11px] font-medium rounded-lg text-[rgba(255,100,100,0.8)] border border-[rgba(255,80,80,0.2)]"
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={() =>
                            patch({
                                links: [
                                    ...(widget.links || []),
                                    { label: 'New link', url: '#' },
                                ],
                            })
                        }
                        className="w-full py-2.5 text-[11px] font-semibold rounded-xl border border-dashed border-(--t-border) text-(--t-text) hover:bg-(--t-surface2)"
                    >
                        + Add link
                    </button>
                </div>
            );

        case 'progress':
            return (
                <div className="flex flex-col gap-4">
                    {(widget.items || []).map((item: any, idx: number) => (
                        <div
                            key={idx}
                            className="p-3 rounded-xl"
                            style={{
                                background: 'var(--t-surface2)',
                                border: '0.5px solid var(--t-border)',
                            }}
                        >
                            <div className="mb-2">
                                <Label>name</Label>
                                <PlainInput
                                    value={item.label || ''}
                                    onChange={(v) => {
                                        const n = [...widget.items];
                                        n[idx].label = v;
                                        patch({ items: n });
                                    }}
                                />
                            </div>
                            <SliderField
                                label="Percentage"
                                value={item.progress || 0}
                                min={0}
                                max={100}
                                unit="%"
                                onChange={(v) => {
                                    const n = [...widget.items];
                                    n[idx].progress = v;
                                    patch({ items: n });
                                }}
                            />
                            <ColorField
                                label="Color"
                                value={item.color || '#a89bff'}
                                onChange={(c) => {
                                    const n = [...widget.items];
                                    n[idx].color = c;
                                    patch({ items: n });
                                }}
                            />
                            <button
                                onClick={() =>
                                    patch({
                                        items: widget.items.filter(
                                            (_: any, i: number) => i !== idx,
                                        ),
                                    })
                                }
                                className="w-full mt-2 py-1.5 text-[11px] font-medium rounded-lg text-[rgba(255,100,100,0.8)] border border-[rgba(255,80,80,0.2)]"
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={() =>
                            patch({
                                items: [
                                    ...(widget.items || []),
                                    {
                                        label: 'New skill',
                                        progress: 50,
                                        color: '#a89bff',
                                    },
                                ],
                            })
                        }
                        className="w-full py-2.5 text-[11px] font-semibold rounded-xl border border-dashed border-(--t-border) text-(--t-text) hover:bg-(--t-surface2)"
                    >
                        + Add slider
                    </button>
                </div>
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
            <aside
                className="w-60 shrink-0 p-4 overflow-y-auto"
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

    const patch = (p: Partial<Widget>) => onUpdate(widget.id, p);

    const handleAppearanceChange = (ap: Partial<WidgetAppearance>) => {
        onUpdate(widget.id, {
            appearance: { ...widget.appearance, ...ap },
        } as any);
    };

    return (
        <aside
            className="w-60 shrink-0 p-4 flex flex-col h-full overflow-y-auto"
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

                <div className="mb-3">
                    <Label>Type</Label>
                    <span
                        className="text-[13px] font-medium capitalize"
                        style={{ color: 'var(--t-text)' }}
                    >
                        {widget.type}
                    </span>
                </div>

                <Tabs active={tab} onChange={setTab} />

                {tab === 'content' && (
                    <ContentTab widget={widget} patch={patch} />
                )}
                {tab === 'style' && (
                    <StyleTab
                        widget={widget}
                        onAppearanceChange={handleAppearanceChange}
                    />
                )}
            </div>

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
