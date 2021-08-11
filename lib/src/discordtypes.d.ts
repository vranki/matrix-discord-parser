export interface IDiscordEmoji {
    id: string;
    animated: boolean;
    name: string;
}
export interface IDiscordRole {
    id: string;
    name: string;
    color: number;
}
export interface IDiscordGuild {
    id: string;
    roles: {
        resolve?: (id: string) => IDiscordRole | undefined | null;
        get?: (id: string) => IDiscordRole | undefined | null;
    };
}
export interface IDiscordMessageEmbed {
    author?: {
        name?: string;
        url?: string;
        iconURL?: string;
        proxyIconURL?: string;
    } | null;
    color?: number | null;
    createdAt?: Date | null;
    description?: string | null;
    fields: {
        name: string;
        value: string;
        inline: boolean;
    }[];
    footer?: {
        text?: string | null;
        iconURL?: string | null;
        proxyIconURL?: string | null;
    } | null;
    hexColor?: string | null;
    image?: {
        url: string;
        proxyURL?: string | null;
        height?: number | null;
        width?: number | null;
    } | null;
    timestamp: number | null;
    title?: string | null;
    type: string;
    url?: string | null;
}
export interface IDiscordMessage {
    id: string;
    mention_everyone?: boolean;
    mentions?: {
        everyone: boolean;
    };
    author: {
        bot: boolean;
    };
    guild?: IDiscordGuild | null;
    content: string;
    embeds: IDiscordMessageEmbed[];
}
