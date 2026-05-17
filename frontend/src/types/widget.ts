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
    | 'quote'
    | 'location';

export interface BaseWidget {
    id: string;
    type: WidgetType;
    appearance?: WidgetAppearance;
}

export interface AboutWidget extends BaseWidget {
    type: 'about';
    name: string;
    role: string;
    bio?: string;
    avatarEmoji?: string;
}

export interface SkillsWidget extends BaseWidget {
    type: 'skills';
    skills: Array<{
        label: string;
        color: 'green' | 'purple' | 'amber' | 'blue';
    }>;
}

export interface ExperienceWidget extends BaseWidget {
    type: 'experience';
    items: Array<{ role: string; company: string; period: string }>;
}

export interface LinksWidget extends BaseWidget {
    type: 'links';
    links: Array<{ label: string; url: string; icon: string }>;
}

export interface StatWidget extends BaseWidget {
    type: 'stat';
    number: string;
    label: string;
}

export interface QuoteWidget extends BaseWidget {
    type: 'quote';
    text: string;
}

export interface LocationWidget extends BaseWidget {
    type: 'location';
    city: string;
    country: string;
    available: string;
}

export type Widget =
    | AboutWidget
    | SkillsWidget
    | ExperienceWidget
    | LinksWidget
    | StatWidget
    | QuoteWidget
    | LocationWidget;

export interface PageConfig {
    widgets: Widget[];
    layouts: WidgetLayout[];
}
