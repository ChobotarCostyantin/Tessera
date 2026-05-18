import { WidgetLayout } from '@/types/widget';
import { GRID_COLS } from '@/lib/widgetConfig'; // Додаємо імпорт

export function findFreePosition(
    layouts: WidgetLayout[],
    w: number,
    h: number,
) {
    let row = 0;

    while (true) {
        for (let col = 0; col <= GRID_COLS - w; col++) {
            const overlaps = layouts.some(
                (l) =>
                    col < l.x + l.w &&
                    col + w > l.x &&
                    row < l.y + l.h &&
                    row + h > l.y,
            );
            if (!overlaps) return { x: col, y: row };
        }
        row++;
    }
}
