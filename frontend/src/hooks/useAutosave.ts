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

    const lastSavedConfigRef = useRef(JSON.stringify(config));

    const isFirstRender = useRef(true);

    const notify = useCallback(
        (status: AutosaveStatus) => onStatusChange?.(status),
        [onStatusChange],
    );

    useEffect(() => {
        if (!portfolioId) return;

        const serializedConfig = JSON.stringify(config);

        if (isFirstRender.current) {
            isFirstRender.current = false;
            lastSavedConfigRef.current = serializedConfig;
            return;
        }

        if (serializedConfig === lastSavedConfigRef.current) {
            return;
        }

        latestConfigRef.current = config;

        notify('pending');

        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        timerRef.current = setTimeout(async () => {
            notify('saving');

            try {
                await updateConfig(portfolioId, {
                    pageConfig: latestConfigRef.current as unknown as Record<
                        string,
                        unknown
                    >,
                });

                lastSavedConfigRef.current = JSON.stringify(
                    latestConfigRef.current,
                );

                notify('saved');

                setTimeout(() => notify('idle'), 2000);
            } catch {
                notify('error');
            }
        }, debounceMs);

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [config, portfolioId, debounceMs, notify]);
}
