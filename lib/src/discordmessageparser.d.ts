import { IDiscordMessage } from "./discordtypes";
export interface IDiscordMessageParserEntity {
    mxid: string;
    name: string;
}
export interface IDiscordMessageParserCallbacks {
    getUser: (id: string) => Promise<IDiscordMessageParserEntity | null>;
    getChannel: (id: string) => Promise<IDiscordMessageParserEntity | null>;
    getEmoji: (name: string, animated: boolean, id: string) => Promise<string | null>;
}
export interface IDiscordMessageParserOpts {
    callbacks: IDiscordMessageParserCallbacks;
}
export interface IDiscordMessageParserResult {
    formattedBody: string;
    body: string;
    msgtype: string;
}
interface ISpoilerNode {
    content: string;
}
interface IDiscordNode {
    id: string;
}
interface IEmojiNode extends IDiscordNode {
    animated: boolean;
    name: string;
}
export declare class DiscordMessageParser {
    FormatMessage(opts: IDiscordMessageParserOpts, msg: IDiscordMessage): Promise<IDiscordMessageParserResult>;
    FormatEdit(opts: IDiscordMessageParserOpts, oldMsg: IDiscordMessage, newMsg: IDiscordMessage, link?: string): Promise<IDiscordMessageParserResult>;
    InsertEmbeds(opts: IDiscordMessageParserOpts, content: string, msg: IDiscordMessage): string;
    InsertEmbedsPostmark(opts: IDiscordMessageParserOpts, content: string, msg: IDiscordMessage): string;
    InsertUser(opts: IDiscordMessageParserOpts, node: IDiscordNode, msg: IDiscordMessage): string;
    InsertSpoiler(opts: IDiscordMessageParserOpts, node: ISpoilerNode, html?: boolean): string;
    InsertChannel(opts: IDiscordMessageParserOpts, node: IDiscordNode): string;
    InsertRole(opts: IDiscordMessageParserOpts, node: IDiscordNode, msg: IDiscordMessage, html?: boolean): string;
    InsertEmoji(opts: IDiscordMessageParserOpts, node: IEmojiNode): string;
    InsertRoom(opts: IDiscordMessageParserOpts, msg: IDiscordMessage, def: string): string;
    InsertMxcImages(opts: IDiscordMessageParserOpts, content: string, msg: IDiscordMessage, html?: boolean): Promise<string>;
    InsertUserPills(opts: IDiscordMessageParserOpts, content: string, msg: IDiscordMessage, html?: boolean): Promise<string>;
    InsertChannelPills(opts: IDiscordMessageParserOpts, content: string, msg: IDiscordMessage, html?: boolean): Promise<string>;
    private isEmbedInBody;
    private getDiscordParseCallbacks;
    private getDiscordParseCallbacksHTML;
}
export {};
