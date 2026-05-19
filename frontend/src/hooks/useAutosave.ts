'use client';

import { useEffect, useRef, useCallback } from 'react';
import { updateConfig } from '@/lib/api/portfolios';
import { PageConfig } from '@/types/widget';

type AutosaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

interface UseAutosaveOptions {
    portfolioId: string | null;
    config: PageConfig;
    debounceMs?: number;
    onStatusChange?: (status: AutosaveStatus) => void;
}

export function useAutosave({
    portfolioId,
    config,
    debounceMs = 3000,
    onStatusChange,
}: UseAutosaveOptions) {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const latestConfigRef = useRef(config);
    const isFirstRender = useRef(true);

    latestConfigRef.current = config;

    const notify = useCallback(
        (status: AutosaveStatus) => onStatusChange?.(status),
        [onStatusChange],
    );

    useEffect(() => {
        // Skip autosave on first render (no changes yet)
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        if (!portfolioId) return;

        notify('pending');

        if (timerRef.current) clearTimeout(timerRef.current);

        timerRef.current = setTimeout(async () => {
            notify('saving');
            try {
                await updateConfig(portfolioId, {
                    pageConfig: latestConfigRef.current as unknown as Record<
                        string,
                        unknown
                    >,
                });
                notify('saved');
                // Reset to idle after 2s
                setTimeout(() => notify('idle'), 2000);
            } catch {
                notify('error');
            }
        }, debounceMs);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
        // config changes trigger the debounce
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [config, portfolioId, debounceMs]);
}
