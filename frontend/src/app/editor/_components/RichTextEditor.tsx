'use client';

import React, { useEffect } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { FontFamily } from '@tiptap/extension-font-family';
import { Underline } from '@tiptap/extension-underline';
import { Extension } from '@tiptap/core';

const FontSize = Extension.create({
    name: 'fontSize',
    addOptions() {
        return { types: ['textStyle'] };
    },
    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    fontSize: {
                        default: null,
                        parseHTML: (el) => el.style.fontSize || null,
                        renderHTML: (attrs) =>
                            attrs.fontSize
                                ? { style: `font-size:${attrs.fontSize}` }
                                : {},
                    },
                },
            },
        ];
    },
    addCommands() {
        return {
            setFontSize:
                (size: string) =>
                ({ chain }: { chain: () => ReturnType<Editor['chain']> }) =>
                    chain().setMark('textStyle', { fontSize: size }).run(),
            unsetFontSize:
                () =>
                ({ chain }: { chain: () => ReturnType<Editor['chain']> }) =>
                    chain().setMark('textStyle', { fontSize: null }).run(),
        } as never;
    },
});

function ToolBtn({
    active,
    onClick,
    title,
    children,
}: {
    active?: boolean;
    onClick: () => void;
    title?: string;
    children: React.ReactNode;
}) {
    return (
        <button
            title={title}
            onMouseDown={(e) => {
                e.preventDefault();
                onClick();
            }}
            style={{
                background: active ? 'rgba(200,255,87,0.15)' : 'transparent',
                border: active
                    ? '0.5px solid rgba(200,255,87,0.4)'
                    : '0.5px solid transparent',
                color: active ? 'var(--t-accent)' : 'var(--t-muted)',
                borderRadius: 6,
                padding: '2px 6px',
                cursor: 'pointer',
                fontSize: 12,
                fontFamily: 'inherit',
                lineHeight: 1.6,
                transition: 'all 0.1s',
            }}
        >
            {children}
        </button>
    );
}

const FONTS = [
    { label: 'Default', value: '' },
    { label: 'DM Sans', value: "'DM Sans', sans-serif" },
    { label: 'Georgia', value: 'Georgia, serif' },
    { label: 'Courier', value: "'Courier New', monospace" },
    { label: 'Helvetica', value: 'Helvetica, Arial, sans-serif' },
];

const FONT_SIZES = [
    '10', '11', '12', '13', '14', '16', '18', '20', '24', '28', '32', '36', '48',
];

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    minHeight?: number;
    singleLine?: boolean;
}

export function RichTextEditor({
    value,
    onChange,
    placeholder = 'Type here...',
    minHeight = 60,
    singleLine = false,
}: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({ heading: false }),
            TextStyle,
            Color,
            FontFamily,
            Underline,
            FontSize,
        ],
        content: value || `<p></p>`,
        onUpdate({ editor }) {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                style: `min-height:${minHeight}px; outline:none; padding:6px 4px; color:var(--t-text); font-size:12px; line-height:1.6;`,
                'data-placeholder': placeholder,
            },
            handleKeyDown(_, event) {
                if (singleLine && event.key === 'Enter') {
                    event.preventDefault();
                    return true;
                }
                return false;
            },
        },
        immediatelyRender: false,
    });

    useEffect(() => {
        if (!editor) return;
        if (editor.getHTML() !== value) {
            editor.commands.setContent(value || '<p></p>', {
                emitUpdate: false,
            });
        }
    }, [value, editor]);

    if (!editor) return null;

    const currentColor = editor.getAttributes('textStyle').color || '#f0efee';

    return (
        <div
            style={{
                background: 'var(--t-surface2)',
                border: '0.5px solid var(--t-border)',
                borderRadius: 10,
                overflow: 'hidden',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 2,
                    padding: '4px 6px',
                    borderBottom: '0.5px solid var(--t-border)',
                    alignItems: 'center',
                }}
            >
                <ToolBtn
                    active={editor.isActive('bold')}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    title="Bold"
                >
                    <b>B</b>
                </ToolBtn>
                <ToolBtn
                    active={editor.isActive('italic')}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    title="Italic"
                >
                    <i>I</i>
                </ToolBtn>
                <ToolBtn
                    active={editor.isActive('underline')}
                    onClick={() =>
                        editor.chain().focus().toggleUnderline().run()
                    }
                    title="Underline"
                >
                    <u>U</u>
                </ToolBtn>
                <ToolBtn
                    active={editor.isActive('strike')}
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    title="Strikethrough"
                >
                    <s>S</s>
                </ToolBtn>

                <div
                    style={{
                        width: 1,
                        height: 14,
                        background: 'var(--t-border)',
                        margin: '0 2px',
                    }}
                />

                <select
                    title="Font family"
                    value={editor.getAttributes('textStyle').fontFamily || ''}
                    onChange={(e) => {
                        if (e.target.value) {
                            editor
                                .chain()
                                .focus()
                                .setFontFamily(e.target.value)
                                .run();
                        } else {
                            editor.chain().focus().unsetFontFamily().run();
                        }
                    }}
                    style={{
                        background: 'var(--t-surface)',
                        border: '0.5px solid var(--t-border)',
                        color: 'var(--t-muted)',
                        borderRadius: 6,
                        fontSize: 11,
                        padding: '2px 4px',
                        fontFamily: 'inherit',
                        cursor: 'pointer',
                    }}
                >
                    {FONTS.map((f) => (
                        <option key={f.value} value={f.value}>
                            {f.label}
                        </option>
                    ))}
                </select>

                <select
                    title="Font size"
                    value={
                        editor
                            .getAttributes('textStyle')
                            .fontSize?.replace('px', '') || ''
                    }
                    onChange={(e) => {
                        if (e.target.value) {
                            (editor.chain().focus() as any)
                                .setFontSize(`${e.target.value}px`)
                                .run();
                        } else {
                            (editor.chain().focus() as any)
                                .unsetFontSize()
                                .run();
                        }
                    }}
                    style={{
                        background: 'var(--t-surface)',
                        border: '0.5px solid var(--t-border)',
                        color: 'var(--t-muted)',
                        borderRadius: 6,
                        fontSize: 11,
                        padding: '2px 4px',
                        fontFamily: 'inherit',
                        cursor: 'pointer',
                        width: 52,
                    }}
                >
                    <option value="">Size</option>
                    {FONT_SIZES.map((s) => (
                        <option key={s} value={s}>
                            {s}px
                        </option>
                    ))}
                </select>

                <div
                    style={{
                        width: 1,
                        height: 14,
                        background: 'var(--t-border)',
                        margin: '0 2px',
                    }}
                />

                <label
                    title="Text color"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        cursor: 'pointer',
                    }}
                >
                    <span style={{ fontSize: 11, color: 'var(--t-muted)' }}>
                        A
                    </span>
                    <input
                        type="color"
                        value={
                            currentColor.startsWith('#')
                                ? currentColor
                                : '#f0efee'
                        }
                        onChange={(e) =>
                            editor
                                .chain()
                                .focus()
                                .setColor(e.target.value)
                                .run()
                        }
                        style={{
                            width: 18,
                            height: 18,
                            border: 'none',
                            borderRadius: 4,
                            padding: 0,
                            cursor: 'pointer',
                            background: 'transparent',
                        }}
                    />
                </label>

                <ToolBtn
                    onClick={() =>
                        editor
                            .chain()
                            .focus()
                            .clearNodes()
                            .unsetAllMarks()
                            .run()
                    }
                    title="Clear formatting"
                >
                    ✕
                </ToolBtn>
            </div>

            <div style={{ padding: '2px 4px' }}>
                <EditorContent editor={editor} />
            </div>

            <style>{`
                .tiptap p { margin: 0; }
                .tiptap:focus { outline: none; }
                .tiptap p.is-editor-empty:first-child::before {
                    content: attr(data-placeholder);
                    color: rgba(240,239,238,0.2);
                    pointer-events: none;
                    float: left;
                    height: 0;
                }
            `}</style>
        </div>
    );
}
