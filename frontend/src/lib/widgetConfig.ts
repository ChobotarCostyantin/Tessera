import { Widget, WidgetLayout } from '@/types/widget';

export const GRID_COLS = 21;
export const CELL_PX = 57;
export const GAP_PX = 10;

export function gridToPx(units: number): number {
    return units * CELL_PX + (units - 1) * GAP_PX;
}
export function pxToGrid(px: number): number {
    return Math.max(1, Math.round((px + GAP_PX) / (CELL_PX + GAP_PX)));
}
export function gridToOffset(pos: number): number {
    return pos * (CELL_PX + GAP_PX);
}

export const CANVAS_W = gridToOffset(GRID_COLS) - GAP_PX;

export const DEFAULT_WIDGETS: Widget[] = [
    {
        id: 'w1',
        type: 'about',
        name: 'John Doe',
        role: 'Full-Stack Developer',
        bio: 'I build web products people love.',
        avatarEmoji: '👤',
    },
    {
        id: 'w2',
        type: 'skills',
        skills: [
            { label: 'React', color: 'blue' },
            { label: 'TypeScript', color: 'purple' },
            { label: 'Node.js', color: 'green' },
            { label: 'Figma', color: 'amber' },
            { label: 'Next.js', color: 'blue' },
            { label: 'PostgreSQL', color: 'green' },
            { label: 'Docker', color: 'blue' },
            { label: 'GraphQL', color: 'purple' },
        ],
    },
    {
        id: 'w3',
        type: 'experience',
        items: [
            {
                role: 'Senior Frontend Dev',
                company: 'Acme Corp',
                period: '2022 — now',
            },
            {
                role: 'Frontend Developer',
                company: 'StartupXYZ',
                period: '2020 — 2022',
            },
            {
                role: 'Junior Dev',
                company: 'Agency Co.',
                period: '2019 — 2020',
            },
        ],
    },
    { id: 'w4', type: 'stat', number: '3+', label: 'Years of experience' },
    {
        id: 'w5',
        type: 'location',
        city: 'Kyiv',
        country: 'Ukraine',
        available: 'Open to remote',
    },
    {
        id: 'w6',
        type: 'links',
        links: [
            { label: 'GitHub', url: 'https://github.com', icon: '🐙' },
            { label: 'LinkedIn', url: 'https://linkedin.com', icon: '💼' },
            { label: 'Portfolio', url: '#', icon: '🌐' },
        ],
    },
    {
        id: 'w7',
        type: 'quote',
        text: "Building beautiful things is not a gift — it's a skill you sharpen every day.",
    },
    { id: 'w8', type: 'stat', number: '12', label: 'Projects shipped' },
    { id: 'w9', type: 'stat', number: '99%', label: 'Client satisfaction' },
];

export const DEFAULT_LAYOUTS: WidgetLayout[] = [
    { id: 'w1', x: 0, y: 0, w: 3, h: 4 },
    { id: 'w2', x: 3, y: 0, w: 6, h: 3 },
    { id: 'w3', x: 9, y: 0, w: 3, h: 7 },
    { id: 'w4', x: 0, y: 4, w: 3, h: 3 },
    { id: 'w5', x: 3, y: 3, w: 3, h: 4 },
    { id: 'w6', x: 6, y: 3, w: 3, h: 4 },
    { id: 'w7', x: 0, y: 7, w: 6, h: 3 },
    { id: 'w8', x: 6, y: 7, w: 3, h: 3 },
    { id: 'w9', x: 9, y: 7, w: 3, h: 3 },
];

export const WIDGET_CATALOG = [
    {
        type: 'about' as const,
        label: 'About Me',
        icon: '👤',
        color: 'rgba(124,109,255,0.15)',
        defaultW: 3,
        defaultH: 4,
    },
    {
        type: 'skills' as const,
        label: 'Skills',
        icon: '⚡',
        color: 'rgba(99,153,34,0.15)',
        defaultW: 5,
        defaultH: 3,
    },
    {
        type: 'experience' as const,
        label: 'Experience',
        icon: '💼',
        color: 'rgba(186,117,23,0.15)',
        defaultW: 3,
        defaultH: 5,
    },
    {
        type: 'links' as const,
        label: 'Links',
        icon: '🔗',
        color: 'rgba(55,138,221,0.15)',
        defaultW: 3,
        defaultH: 3,
    },
    {
        type: 'stat' as const,
        label: 'Stat',
        icon: '📊',
        color: 'rgba(200,255,87,0.1)',
        defaultW: 3,
        defaultH: 3,
    },
    {
        type: 'quote' as const,
        label: 'Quote',
        icon: '💬',
        color: 'rgba(237,147,177,0.12)',
        defaultW: 6,
        defaultH: 3,
    },
    {
        type: 'location' as const,
        label: 'Location',
        icon: '📍',
        color: 'rgba(93,202,165,0.12)',
        defaultW: 3,
        defaultH: 3,
    },
];

export function createDefaultWidget(type: Widget['type'], id: string): Widget {
    switch (type) {
        case 'about':
            return {
                id,
                type,
                name: 'Your Name',
                role: 'Your Role',
                bio: '',
                avatarEmoji: '👤',
            };
        case 'skills':
            return { id, type, skills: [{ label: 'Skill', color: 'blue' }] };
        case 'experience':
            return {
                id,
                type,
                items: [{ role: 'Role', company: 'Company', period: '2024' }],
            };
        case 'links':
            return {
                id,
                type,
                links: [{ label: 'Link', url: '#', icon: '🔗' }],
            };
        case 'stat':
            return { id, type, number: '00', label: 'Label' };
        case 'quote':
            return { id, type, text: 'Your quote here.' };
        case 'location':
            return {
                id,
                type,
                city: 'Your City',
                country: 'Country',
                available: 'Available',
            };
    }
}
