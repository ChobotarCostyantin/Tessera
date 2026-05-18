export interface WidgetAppearance {
    bgColor?: string;
    borderRadius?: number;
    hoverAnimation?: 'none' | 'lift' | 'glow' | 'scale';
    textColor?: string;
    fontFamily?: string;
    fontSize?: number;
}

export interface WidgetLayout {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
}

export type WidgetType =
    | 'about'
    | 'skills'
    | 'experience'
    | 'links'
    | 'stat'
    | 'location'
    | 'text'
    | 'image'
    | 'progress';

export interface BaseWidget {
    id: string;
    type: WidgetType;
    appearance?: WidgetAppearance;
}

export interface ExperienceWidget extends BaseWidget {
    type: 'experience';
    items: Array<{ content: string }>;
}

export interface LinksWidget extends BaseWidget {
    type: 'links';
    links: Array<{ label: string; url: string }>;
}

export interface TextWidget extends BaseWidget {
    type: 'text';
    content: string;
}

export interface ImageWidget extends BaseWidget {
    type: 'image';
    imageUrl: string;
    altText?: string;
    objectFit: 'cover' | 'contain';
}

export interface ProgressItem {
    label: string;
    progress: number;
    color: string;
}

export interface ProgressWidget extends BaseWidget {
    type: 'progress';
    items: ProgressItem[];
}

export type Widget =
    | ExperienceWidget
    | LinksWidget
    | TextWidget
    | ImageWidget
    | ProgressWidget;

export interface PageConfig {
    widgets: Widget[];
    layouts: WidgetLayout[];
}
