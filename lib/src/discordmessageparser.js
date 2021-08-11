"use strict";
/*
Copyright 2017 - 2020 matrix-discord

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscordMessageParser = void 0;
const markdown = require("discord-markdown");
const escapeHtml = require("escape-html");
const util_1 = require("./util");
const MATRIX_TO_LINK = "https://matrix.to/#/";
// somehow the regex works properly if it isn't global
// as we replace the match fully anyways this shouldn't be an issue
const MXC_INSERT_REGEX = /\x01emoji\x01(\w+)\x01([01])\x01([0-9]*)\x01/;
const NAME_MXC_INSERT_REGEX_GROUP = 1;
const ANIMATED_MXC_INSERT_REGEX_GROUP = 2;
const ID_MXC_INSERT_REGEX_GROUP = 3;
const EMOJI_SIZE = 32;
const MAX_EDIT_MSG_LENGTH = 50;
// same as above, no global flag here, too
const CHANNEL_INSERT_REGEX = /\x01chan\x01([0-9]*)\x01/;
const ID_CHANNEL_INSERT_REGEX = 1;
// same as above, no global flag here, too
const USER_INSERT_REGEX = /\x01user\x01([0-9]*)\x01/;
const ID_USER_INSERT_REGEX = 1;
class DiscordMessageParser {
    FormatMessage(opts, msg) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = {
                body: "",
                msgtype: "",
                formattedBody: "",
            };
            let content = msg.content;
            // for the formatted body we need to parse markdown first
            // as else it'll HTML escape the result of the discord syntax
            let contentPostmark = markdown.toHTML(content, {
                discordCallback: this.getDiscordParseCallbacksHTML(opts, msg),
                isBot: msg.author ? msg.author.bot : false,
                noExtraSpanTags: true,
                noHighlightCode: true,
            });
            // parse the plain text stuff
            content = markdown.toHTML(content, {
                discordCallback: this.getDiscordParseCallbacks(opts, msg),
                discordOnly: true,
                escapeHTML: false,
                isBot: msg.author ? msg.author.bot : false,
                noExtraSpanTags: true,
                noHighlightCode: true,
            });
            content = this.InsertEmbeds(opts, content, msg);
            content = yield this.InsertMxcImages(opts, content, msg);
            content = yield this.InsertUserPills(opts, content, msg);
            content = yield this.InsertChannelPills(opts, content, msg);
            // parse postmark stuff
            contentPostmark = this.InsertEmbedsPostmark(opts, contentPostmark, msg);
            contentPostmark = yield this.InsertMxcImages(opts, contentPostmark, msg, true);
            contentPostmark = yield this.InsertUserPills(opts, contentPostmark, msg, true);
            contentPostmark = yield this.InsertChannelPills(opts, contentPostmark, msg, true);
            result.body = content;
            result.formattedBody = contentPostmark;
            result.msgtype = msg.author.bot ? "m.notice" : "m.text";
            return result;
        });
    }
    FormatEdit(opts, oldMsg, newMsg, link) {
        return __awaiter(this, void 0, void 0, function* () {
            oldMsg.embeds = []; // we don't want embeds on old msg
            const oldMsgParsed = yield this.FormatMessage(opts, oldMsg);
            const newMsgParsed = yield this.FormatMessage(opts, newMsg);
            const result = {
                body: `*edit:* ~~${oldMsgParsed.body}~~ -> ${newMsgParsed.body}`,
                msgtype: newMsgParsed.msgtype,
                formattedBody: "",
            };
            oldMsg.content = `*edit:* ~~${oldMsg.content}~~ -> ${newMsg.content}`;
            const linkStart = link ? `<a href="${escapeHtml(link)}">` : "";
            const linkEnd = link ? "</a>" : "";
            if (oldMsg.content.includes("\n") || newMsg.content.includes("\n")
                || newMsg.content.length > MAX_EDIT_MSG_LENGTH) {
                result.formattedBody = `<p>${linkStart}<em>edit:</em>${linkEnd}</p><p><del>${oldMsgParsed.formattedBody}` +
                    `</del></p><hr><p>${newMsgParsed.formattedBody}</p>`;
            }
            else {
                result.formattedBody = `${linkStart}<em>edit:</em>${linkEnd} <del>${oldMsgParsed.formattedBody}</del>` +
                    ` -&gt; ${newMsgParsed.formattedBody}`;
            }
            return result;
        });
    }
    InsertEmbeds(opts, content, msg) {
        for (const embed of msg.embeds) {
            if (embed.title === undefined && embed.description === undefined) {
                continue;
            }
            if (this.isEmbedInBody(opts, msg, embed)) {
                continue;
            }
            let embedContent = content ? "\n\n----" : "";
            const embedTitle = embed.url ? `[${embed.title}](${embed.url})` : embed.title;
            if (embedTitle) {
                embedContent += "\n##### " + embedTitle; // h5 is probably best.
            }
            if (embed.author && embed.author.name) {
                embedContent += `\n**${escapeHtml(embed.author.name)}**`;
            }
            if (embed.description) {
                embedContent += "\n" + markdown.toHTML(embed.description, {
                    discordCallback: this.getDiscordParseCallbacks(opts, msg),
                    discordOnly: true,
                    escapeHTML: false,
                    isBot: msg.author ? msg.author.bot : false,
                    noExtraSpanTags: true,
                    noHighlightCode: true,
                });
            }
            if (embed.fields) {
                for (const field of embed.fields) {
                    embedContent += `\n**${field.name}**\n`;
                    embedContent += markdown.toHTML(field.value, {
                        discordCallback: this.getDiscordParseCallbacks(opts, msg),
                        discordOnly: true,
                        escapeHTML: false,
                        isBot: msg.author ? msg.author.bot : false,
                        noExtraSpanTags: true,
                        noHighlightCode: true,
                    });
                }
            }
            if (embed.image) {
                embedContent += "\nImage: " + embed.image.url;
            }
            if (embed.footer) {
                embedContent += "\n" + markdown.toHTML(embed.footer.text, {
                    discordCallback: this.getDiscordParseCallbacks(opts, msg),
                    discordOnly: true,
                    escapeHTML: false,
                    isBot: msg.author ? msg.author.bot : false,
                    noExtraSpanTags: true,
                    noHighlightCode: true,
                });
            }
            content += embedContent;
        }
        return content;
    }
    InsertEmbedsPostmark(opts, content, msg) {
        for (const embed of msg.embeds) {
            if (embed.title === undefined && embed.description === undefined) {
                continue;
            }
            if (this.isEmbedInBody(opts, msg, embed)) {
                continue;
            }
            let embedContent = content ? "<hr>" : "";
            const embedTitle = embed.url ?
                `<a href="${escapeHtml(embed.url)}">${escapeHtml(embed.title)}</a>`
                : (embed.title ? escapeHtml(embed.title) : undefined);
            if (embedTitle) {
                embedContent += `<h5>${embedTitle}</h5>`; // h5 is probably best.
            }
            if (embed.author && embed.author.name) {
                embedContent += `<strong>${escapeHtml(embed.author.name)}</strong><br>`;
            }
            if (embed.description) {
                embedContent += "<p>";
                embedContent += markdown.toHTML(embed.description, {
                    discordCallback: this.getDiscordParseCallbacksHTML(opts, msg),
                    embed: true,
                    isBot: msg.author ? msg.author.bot : false,
                    noExtraSpanTags: true,
                    noHighlightCode: true,
                }) + "</p>";
            }
            if (embed.fields) {
                for (const field of embed.fields) {
                    embedContent += `<p><strong>${escapeHtml(field.name)}</strong><br>`;
                    embedContent += markdown.toHTML(field.value, {
                        discordCallback: this.getDiscordParseCallbacks(opts, msg),
                        embed: true,
                        isBot: msg.author ? msg.author.bot : false,
                        noExtraSpanTags: true,
                        noHighlightCode: true,
                    }) + "</p>";
                }
            }
            if (embed.image) {
                const imgUrl = escapeHtml(embed.image.url);
                embedContent += `<p>Image: <a href="${imgUrl}">${imgUrl}</a></p>`;
            }
            if (embed.footer) {
                embedContent += "<p>";
                embedContent += markdown.toHTML(embed.footer.text, {
                    discordCallback: this.getDiscordParseCallbacksHTML(opts, msg),
                    embed: true,
                    isBot: msg.author ? msg.author.bot : false,
                    noExtraSpanTags: true,
                    noHighlightCode: true,
                }) + "</p>";
            }
            content += embedContent;
        }
        return content;
    }
    InsertUser(opts, node, msg) {
        // unfortunately these callbacks are sync, so we flag our channel with some special stuff
        // and later on grab the real channel pill async
        const FLAG = "\x01";
        return `${FLAG}user${FLAG}${node.id}${FLAG}`;
    }
    InsertSpoiler(opts, node, html = false) {
        // matrix spoilers are still in MSC stage
        // see https://github.com/matrix-org/matrix-doc/pull/2010
        if (!html) {
            return `(Spoiler: ${node.content})`;
        }
        return `<span data-mx-spoiler>${node.content}</span>`;
    }
    InsertChannel(opts, node) {
        // unfortunately these callbacks are sync, so we flag our channel with some special stuff
        // and later on grab the real channel pill async
        const FLAG = "\x01";
        return `${FLAG}chan${FLAG}${node.id}${FLAG}`;
    }
    InsertRole(opts, node, msg, html = false) {
        const id = node.id;
        const role = msg.guild ? (msg.guild.roles.resolve || msg.guild.roles.get).bind(msg.guild.roles)(id) : null;
        if (!role) {
            return html ? `&lt;@&amp;${id}&gt;` : `<@&${id}>`;
        }
        if (!html) {
            return `@${role.name}`;
        }
        const color = util_1.Util.NumberToHTMLColor(role.color);
        return `<span data-mx-color="${color}"><strong>@${escapeHtml(role.name)}</strong></span>`;
    }
    InsertEmoji(opts, node) {
        // unfortunately these callbacks are sync, so we flag our url with some special stuff
        // and later on grab the real url async
        const FLAG = "\x01";
        return `${FLAG}emoji${FLAG}${node.name}${FLAG}${node.animated ? 1 : 0}${FLAG}${node.id}${FLAG}`;
    }
    InsertRoom(opts, msg, def) {
        return (msg.mentions && msg.mentions.everyone) || msg.mention_everyone ? "@room" : def;
    }
    InsertMxcImages(opts, content, msg, html = false) {
        return __awaiter(this, void 0, void 0, function* () {
            let results = MXC_INSERT_REGEX.exec(content);
            while (results !== null) {
                const name = results[NAME_MXC_INSERT_REGEX_GROUP];
                const animated = results[ANIMATED_MXC_INSERT_REGEX_GROUP] === "1";
                const id = results[ID_MXC_INSERT_REGEX_GROUP];
                let replace = "";
                const nameHtml = escapeHtml(name);
                const mxcUrl = yield opts.callbacks.getEmoji(name, animated, id);
                if (mxcUrl) {
                    if (html) {
                        replace = `<img alt=":${nameHtml}:" title=":${nameHtml}:" ` +
                            `height="${EMOJI_SIZE}" src="${mxcUrl}" data-mx-emoticon />`;
                    }
                    else {
                        replace = `:${name}:`;
                    }
                }
                else {
                    if (html) {
                        replace = `&lt;${animated ? "a" : ""}:${nameHtml}:${id}&gt;`;
                    }
                    else {
                        replace = `<${animated ? "a" : ""}:${name}:${id}>`;
                    }
                }
                content = content.replace(results[0], replace);
                results = MXC_INSERT_REGEX.exec(content);
            }
            return content;
        });
    }
    InsertUserPills(opts, content, msg, html = false) {
        return __awaiter(this, void 0, void 0, function* () {
            let results = USER_INSERT_REGEX.exec(content);
            while (results !== null) {
                const id = results[ID_USER_INSERT_REGEX];
                const user = yield opts.callbacks.getUser(id);
                let replace = "";
                if (user) {
                    replace = html ? `<a href="${MATRIX_TO_LINK}${escapeHtml(user.mxid)}">` +
                        `${escapeHtml(user.name)}</a>` : `${user.name} (${user.mxid})`;
                }
                else {
                    replace = html ? `&lt;@${escapeHtml(id)}&gt;` : `<@${id}>`;
                }
                content = content.replace(results[0], replace);
                results = USER_INSERT_REGEX.exec(content);
            }
            return content;
        });
    }
    InsertChannelPills(opts, content, msg, html = false) {
        return __awaiter(this, void 0, void 0, function* () {
            let results = CHANNEL_INSERT_REGEX.exec(content);
            while (results !== null) {
                const id = results[ID_CHANNEL_INSERT_REGEX];
                const channel = yield opts.callbacks.getChannel(id);
                let replace = "";
                if (channel) {
                    const name = "#" + channel.name;
                    replace = html ? `<a href="${MATRIX_TO_LINK}${escapeHtml(channel.mxid)}">` +
                        `${escapeHtml(name)}</a>` : name;
                }
                else {
                    replace = html ? `&lt;#${escapeHtml(id)}&gt;` : `<#${id}>`;
                }
                content = content.replace(results[0], replace);
                results = CHANNEL_INSERT_REGEX.exec(content);
            }
            return content;
        });
    }
    isEmbedInBody(opts, msg, embed) {
        if (!embed.url) {
            return false;
        }
        let url = embed.url;
        if (url.substr(url.length - 1) === "/") {
            url = url.substr(0, url.length - 1);
        }
        if (msg.content.includes(url)) {
            return true;
        }
        // alright, let's special-case youtu.be as it is meh
        // match for youtube URLs the video ID part
        const matchesFromUrl = url.match(/^https?:\/\/(?:www\.)youtube\.com\/watch\?.*v=([^&]+)/);
        if (matchesFromUrl) {
            const matchesFromContent = msg.content.match(/https?:\/\/youtu\.be\/([^\/? ]+)/);
            if (matchesFromContent && matchesFromUrl[1] === matchesFromContent[1]) {
                // okay, said youtube link is already in
                return true;
            }
        }
        return false;
    }
    getDiscordParseCallbacks(opts, msg) {
        return {
            channel: (node) => this.InsertChannel(opts, node),
            emoji: (node) => this.InsertEmoji(opts, node),
            everyone: (_) => this.InsertRoom(opts, msg, "@everyone"),
            here: (_) => this.InsertRoom(opts, msg, "@here"),
            role: (node) => this.InsertRole(opts, node, msg),
            spoiler: (node) => this.InsertSpoiler(opts, node),
            user: (node) => this.InsertUser(opts, node, msg),
        };
    }
    getDiscordParseCallbacksHTML(opts, msg) {
        return {
            channel: (node) => this.InsertChannel(opts, node),
            emoji: (node) => this.InsertEmoji(opts, node),
            everyone: (_) => this.InsertRoom(opts, msg, "@everyone"),
            here: (_) => this.InsertRoom(opts, msg, "@here"),
            role: (node) => this.InsertRole(opts, node, msg, true),
            spoiler: (node) => this.InsertSpoiler(opts, node, true),
            user: (node) => this.InsertUser(opts, node, msg),
        };
    }
}
exports.DiscordMessageParser = DiscordMessageParser;
