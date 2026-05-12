import {WidgetLayout} from "@/types/widget";

export function findFreePosition(layouts: WidgetLayout[], w: number, h: number) {
    for (let row = 0; row < 100; row++) {
        for (let col = 0; col <= 12 - w; col++) {
            const overlaps = layouts.some(l =>
                col < l.x + l.w && col + w > l.x &&
                row < l.y + l.h && row + h > l.y
            );
            if (!overlaps) return { x: col, y: row };
        }
    }
    return { x: 0, y: 0 };
}