import { WidgetLayout } from '@/types/widget';
import { GRID_COLS } from '@/lib/widgetConfig';

export function checkOverlap(a: WidgetLayout, b: WidgetLayout): boolean {
    if (a.id === b.id) return false;
    return (
        a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
    );
}

export function resolveCollisions(
    layouts: WidgetLayout[],
    activeId: string,
): WidgetLayout[] {
    const activeItem = layouts.find((l) => l.id === activeId);
    if (!activeItem) return layouts;

    const others = layouts.filter((l) => l.id !== activeId);
    others.sort((a, b) => a.y - b.y || a.x - b.x);

    const resolved: WidgetLayout[] = [{ ...activeItem }];

    for (const item of others) {
        let current = { ...item };
        let hasCollision = true;
        let safety = 0;

        while (hasCollision && safety < 100) {
            hasCollision = false;
            for (const placed of resolved) {
                if (checkOverlap(current, placed)) {
                    hasCollision = true;
                    const candidateX = placed.x + placed.w;
                    if (candidateX + current.w <= GRID_COLS) {
                        current.x = candidateX;
                    } else {
                        current.x = 0;
                        current.y = placed.y + placed.h;
                    }
                    break;
                }
            }
            safety++;
        }
        resolved.push(current);
    }

    return resolved;
}
