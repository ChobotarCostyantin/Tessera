export interface WidgetLayout {
    id: string;
    x: number; // grid column (0-based)
    y: number; // grid row (0-based)
    w: number; // width in grid units
    h: number; // height in grid units
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

export type Theme = 'dark' | 'light' | 'warm';

export interface PageConfig {
    widgets: Widget[];
    layouts: WidgetLayout[];
    theme: Theme;
}
