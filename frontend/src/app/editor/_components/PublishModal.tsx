'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
    createPortfolio,
    publishPortfolio,
    unpublishPortfolio,
} from '@/lib/api/portfolios';
import { PublishPortfolioSchema } from '@/lib/schemas/portfolio';
import { Widget, WidgetLayout, PageConfig } from '@/types/widget';
import { PortfolioPreview } from './PortfolioPreview';

interface PublishModalProps {
    isOpen: boolean;
    onClose: () => void;
    widgets: Widget[];
    layouts: WidgetLayout[];
    portfolioId: string | null;
    isPublished: boolean;
    onPublished: (portfolioId: string, slug: string) => void;
    onUnpublished: () => void;
}

type FormErrors = Partial<Record<'slug' | 'title', string>>;

export function PublishModal({
    isOpen,
    onClose,
    widgets,
    layouts,
    portfolioId,
    isPublished,
    onPublished,
    onUnpublished,
}: PublishModalProps) {
    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [errors, setErrors] = useState<FormErrors>({});
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState('');
    const [tab, setTab] = useState<'form' | 'preview'>('form');

    // Auto-generate slug from title
    const handleTitleChange = useCallback((val: string) => {
        setTitle(val);
        setSlug(
            val
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-'),
        );
    }, []);

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setErrors({});
            setApiError('');
            setLoading(false);
            setTab('form');
        }
    }, [isOpen]);

    const handlePublish = useCallback(async () => {
        setErrors({});
        setApiError('');

        const result = PublishPortfolioSchema.safeParse({ title, slug });
        if (!result.success) {
            const fieldErrors: FormErrors = {};
            result.error.issues.forEach((e) => {
                const field = e.path[0] as keyof FormErrors;
                fieldErrors[field] = e.message;
            });
            setErrors(fieldErrors);
            return;
        }

        setLoading(true);
        try {
            const config: PageConfig = { widgets, layouts };
            const pageConfig = config as unknown as Record<string, unknown>;

            let id = portfolioId;

            if (!id) {
                // First publish: create record then publish
                const created = await createPortfolio({
                    slug: result.data.slug,
                    title: result.data.title,
                    pageConfig,
                });
                id = created.id;
            }

            const published = await publishPortfolio(id, {
                slug: result.data.slug,
                title: result.data.title,
            });

            onPublished(published.id, published.slug);
            onClose();
        } catch (err: unknown) {
            const msg =
                err instanceof Error ? err.message : 'Something went wrong';
            // Handle conflict (slug taken)
            if (msg.includes('409') || msg.toLowerCase().includes('conflict')) {
                setErrors({ slug: 'This slug is already taken' });
            } else {
                setApiError(msg);
            }
        } finally {
            setLoading(false);
        }
    }, [title, slug, widgets, layouts, portfolioId, onPublished, onClose]);

    const handleUnpublish = useCallback(async () => {
        if (!portfolioId) return;
        setLoading(true);
        setApiError('');
        try {
            await unpublishPortfolio(portfolioId);
            onUnpublished();
            onClose();
        } catch (err: unknown) {
            setApiError(
                err instanceof Error ? err.message : 'Something went wrong',
            );
        } finally {
            setLoading(false);
        }
    }, [portfolioId, onUnpublished, onClose]);

    // Close on Escape
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const publicUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/p/${slug || 'your-slug'}`;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40"
                style={{
                    background: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(4px)',
                }}
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                style={{ pointerEvents: 'none' }}
            >
                <div
                    className="relative flex flex-col w-full max-w-5xl rounded-2xl overflow-hidden"
                    style={{
                        background: 'var(--t-surface)',
                        border: '0.5px solid var(--t-border)',
                        boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
                        maxHeight: '90vh',
                        pointerEvents: 'auto',
                    }}
                >
                    {/* Header */}
                    <div
                        className="flex items-center justify-between px-6 py-4 shrink-0"
                        style={{ borderBottom: '0.5px solid var(--t-border)' }}
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className="w-2 h-2 rounded-full animate-pulse"
                                style={{ background: 'var(--t-accent)' }}
                            />
                            <span
                                className="text-[15px] font-semibold tracking-tight"
                                style={{ color: 'var(--t-text)' }}
                            >
                                Publish Portfolio
                            </span>
                        </div>

                        {/* Tabs */}
                        <div
                            className="flex gap-1 rounded-lg p-1"
                            style={{ background: 'var(--t-surface2)' }}
                        >
                            {(['form', 'preview'] as const).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTab(t)}
                                    className="px-4 py-1.5 rounded-md text-[12px] font-medium capitalize transition-all"
                                    style={{
                                        background:
                                            tab === t
                                                ? 'var(--t-surface)'
                                                : 'transparent',
                                        color:
                                            tab === t
                                                ? 'var(--t-text)'
                                                : 'var(--t-muted)',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontFamily: 'inherit',
                                    }}
                                >
                                    {t === 'form' ? '⚙ Settings' : '👁 Preview'}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={onClose}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-[14px] transition-colors"
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--t-muted)',
                                cursor: 'pointer',
                            }}
                            onMouseEnter={(e) =>
                                ((
                                    e.currentTarget as HTMLElement
                                ).style.background = 'var(--t-surface2)')
                            }
                            onMouseLeave={(e) =>
                                ((
                                    e.currentTarget as HTMLElement
                                ).style.background = 'transparent')
                            }
                        >
                            ✕
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex flex-1 overflow-hidden justify-center">
                        {tab === 'form' ? (
                            <FormPanel
                                title={title}
                                slug={slug}
                                errors={errors}
                                apiError={apiError}
                                loading={loading}
                                publicUrl={publicUrl}
                                onTitleChange={handleTitleChange}
                                onSlugChange={setSlug}
                                onPublish={handlePublish}
                                onClose={onClose}
                                isPublished={isPublished}
                                onUnpublish={handleUnpublish}
                            />
                        ) : (
                            <div className="flex-1 overflow-auto p-4">
                                <PortfolioPreview
                                    initialWidgets={widgets}
                                    initialLayouts={layouts}
                                    portfolioId={portfolioId}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

// ── Form panel ────────────────────────────────────────────────────────────────

interface FormPanelProps {
    title: string;
    slug: string;
    errors: FormErrors;
    apiError: string;
    loading: boolean;
    publicUrl: string;
    onTitleChange: (v: string) => void;
    onSlugChange: (v: string) => void;
    onPublish: () => void;
    onClose: () => void;
    isPublished: boolean;
    onUnpublish: () => void;
}

function FormPanel({
    title,
    slug,
    errors,
    apiError,
    loading,
    publicUrl,
    onTitleChange,
    onSlugChange,
    onPublish,
    onClose,
    isPublished,
    onUnpublish,
}: FormPanelProps) {
    return (
        <div
            className="flex flex-col justify-between w-full p-8 gap-6"
            style={{ maxWidth: 500 }}
        >
            <div className="flex flex-col gap-5">
                <p
                    className="text-[13px] leading-relaxed"
                    style={{ color: 'var(--t-muted)' }}
                >
                    Your portfolio will be publicly accessible at the URL below.
                    Choose a memorable title and a clean slug.
                </p>

                {/* Title field */}
                <Field
                    label="Portfolio title"
                    error={errors.title}
                    hint="Shown on your public page"
                >
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => onTitleChange(e.target.value)}
                        placeholder="e.g. John's Creative Portfolio"
                        style={inputStyle(!!errors.title)}
                    />
                </Field>

                {/* Slug field */}
                <Field
                    label="URL slug"
                    error={errors.slug}
                    hint="Only lowercase letters, numbers, hyphens"
                >
                    <div
                        className="flex items-center gap-0"
                        style={{ position: 'relative' }}
                    >
                        <span
                            className="px-3 text-[12px] rounded-l-lg h-full flex items-center shrink-0"
                            style={{
                                background: 'var(--t-surface)',
                                border: '0.5px solid var(--t-border)',
                                borderRight: 'none',
                                color: 'var(--t-muted)',
                                height: 36,
                            }}
                        >
                            /p/
                        </span>
                        <input
                            type="text"
                            value={slug}
                            onChange={(e) => onSlugChange(e.target.value)}
                            placeholder="your-portfolio"
                            style={{
                                ...inputStyle(!!errors.slug),
                                borderRadius: '0 8px 8px 0',
                            }}
                        />
                    </div>
                </Field>

                {/* Public URL preview */}
                <div
                    className="rounded-xl px-4 py-3"
                    style={{
                        background: 'rgba(200,255,87,0.04)',
                        border: '0.5px solid rgba(200,255,87,0.15)',
                    }}
                >
                    <p
                        className="text-[10px] font-semibold uppercase tracking-widest mb-1.5"
                        style={{ color: 'var(--t-accent)' }}
                    >
                        Public URL
                    </p>
                    <p
                        className="text-[12px] font-mono break-all"
                        style={{ color: 'var(--t-text)', opacity: 0.8 }}
                    >
                        {publicUrl}
                    </p>
                </div>

                {/* API error */}
                {apiError && (
                    <div
                        className="rounded-xl px-4 py-3 text-[12px]"
                        style={{
                            background: 'rgba(255,80,80,0.06)',
                            border: '0.5px solid rgba(255,80,80,0.2)',
                            color: 'rgba(255,120,120,0.9)',
                        }}
                    >
                        {apiError}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
                <button
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl text-[13px] font-medium transition-colors"
                    style={{
                        background: 'transparent',
                        border: '0.5px solid var(--t-border)',
                        color: 'var(--t-muted)',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                    }}
                >
                    Cancel
                </button>

                {isPublished && (
                    <button
                        onClick={onUnpublish}
                        disabled={loading}
                        className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-all"
                        style={{
                            background: 'rgba(255,80,80,0.12)',
                            border: '0.5px solid rgba(255,80,80,0.3)',
                            color: 'rgba(255,120,120,0.9)',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontFamily: 'inherit',
                            opacity: loading ? 0.7 : 1,
                        }}
                    >
                        {loading ? 'Unpublishing...' : '🔒 Unpublish'}
                    </button>
                )}

                <button
                    onClick={onPublish}
                    disabled={loading}
                    className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-all"
                    style={{
                        background: loading
                            ? 'rgba(200,255,87,0.4)'
                            : 'var(--t-accent)',
                        border: 'none',
                        color: '#0f0f10',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontFamily: 'inherit',
                        opacity: loading ? 0.7 : 1,
                    }}
                >
                    {loading ? 'Publishing...' : '🚀 Publish'}
                </button>
            </div>
        </div>
    );
}

// ── Field wrapper ─────────────────────────────────────────────────────────────

function Field({
    label,
    error,
    hint,
    children,
}: {
    label: string;
    error?: string;
    hint?: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label
                className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5"
                style={{
                    color: error ? 'rgba(255,120,120,0.9)' : 'var(--t-muted)',
                }}
            >
                {label}
            </label>
            {children}
            {hint && !error && (
                <p
                    className="text-[10px] mt-1"
                    style={{ color: 'var(--t-muted)', opacity: 0.6 }}
                >
                    {hint}
                </p>
            )}
            {error && (
                <p
                    className="text-[10px] mt-1"
                    style={{ color: 'rgba(255,120,120,0.9)' }}
                >
                    {error}
                </p>
            )}
        </div>
    );
}

function inputStyle(hasError: boolean): React.CSSProperties {
    return {
        width: '100%',
        height: 36,
        padding: '0 12px',
        borderRadius: 8,
        background: 'var(--t-surface2)',
        border: `0.5px solid ${hasError ? 'rgba(255,80,80,0.5)' : 'var(--t-border)'}`,
        color: 'var(--t-text)',
        fontSize: 13,
        outline: 'none',
        fontFamily: 'inherit',
    };
}
