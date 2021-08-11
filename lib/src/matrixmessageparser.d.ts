import { IDiscordEmoji } from "./discordtypes";
import { IMatrixMessage } from "./matrixtypes";
export interface IMatrixMessageParserCallbacks {
    canNotifyRoom: () => Promise<boolean>;
    getUserId: (mxid: string) => Promise<string | null>;
    getChannelId: (mxid: string) => Promise<string | null>;
    getEmoji: (mxc: string, name: string) => Promise<IDiscordEmoji | null>;
    mxcUrlToHttp: (mxc: string) => string;
}
export interface IMatrixMessageParserUrlShortener {
    endpoint?: string;
    extraBody?: any;
    urlParameter?: string;
    shortParameter?: string;
    method?: string;
}
export interface IMatrixMessageParserOpts {
    callbacks: IMatrixMessageParserCallbacks;
    displayname: string;
    urlShortener?: IMatrixMessageParserUrlShortener;
    listDepth?: number;
    determineCodeLanguage?: boolean;
}
export declare class MatrixMessageParser {
    private listDepth;
    private listBulletPoints;
    FormatMessage(opts: IMatrixMessageParserOpts, msg: IMatrixMessage): Promise<string>;
    private escapeDiscord;
    private parsePreContent;
    private parseUser;
    private parseChannel;
    private parseLinkContent;
    private parsePillContent;
    private parseImageContent;
    private parseBlockquoteContent;
    private parseSpanContent;
    private parseUlContent;
    private parseOlContent;
    private arrayChildNodes;
    private walkChildNodes;
    private walkNode;
}
