"use strict";
/*
Copyright 2018 - 2020 matrix-discord

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
exports.MatrixMessageParser = void 0;
const Parser = require("node-html-parser");
const util_1 = require("./util");
const highlightjs = require("highlight.js");
const unescapeHtml = require("unescape-html");
const got_1 = require("got");
const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 32;
const MATRIX_TO_LINK = "https://matrix.to/#/";
const DEFAULT_ROOM_NOTIFY_POWER_LEVEL = 50;
const DEFAULT_URL_SHORTENER = {
    endpoint: "https://mau.lu/api/shorten",
    method: "POST",
    shortParameter: "short_url",
    urlParameter: "url",
};
// these are the tags that are supposed to act like block tag markdown forming on the *discord* side
const BLOCK_TAGS = ["BLOCKQUOTE", "UL", "OL", "H1", "H2", "H3", "H4", "H5", "H6"];
class MatrixMessageParser {
    constructor() {
        this.listDepth = 0;
        this.listBulletPoints = ["●", "○", "■", "‣"];
    }
    FormatMessage(opts, msg) {
        return __awaiter(this, void 0, void 0, function* () {
            opts.listDepth = 0;
            let reply = "";
            if (msg.formatted_body) {
                const parsed = Parser.parse(msg.formatted_body, {
                    lowerCaseTagName: true,
                    pre: true,
                });
                reply = yield this.walkNode(opts, parsed);
                reply = reply.replace(/\s*$/, ""); // trim off whitespace at end
            }
            else {
                reply = yield this.escapeDiscord(opts, msg.body);
            }
            if (msg.msgtype === "m.emote") {
                if (opts.displayname.length >= MIN_NAME_LENGTH &&
                    opts.displayname.length <= MAX_NAME_LENGTH) {
                    reply = `_${yield this.escapeDiscord(opts, opts.displayname)} ${reply}_`;
                }
                else {
                    reply = `_${reply}_`;
                }
            }
            return reply;
        });
    }
    escapeDiscord(opts, msg) {
        return __awaiter(this, void 0, void 0, function* () {
            msg = unescapeHtml(msg);
            // \u200B is the zero-width space --> they still look the same but don't mention
            msg = msg.replace(/@everyone/g, "@\u200Beveryone");
            msg = msg.replace(/@here/g, "@\u200Bhere");
            // Check the Matrix permissions to see if this user has the required
            // power level to notify with @room; if so, replace it with @here.
            if (msg.includes("@room") && (yield opts.callbacks.canNotifyRoom())) {
                msg = msg.replace(/@room/g, "@here");
            }
            const escapeChars = ["\\", "*", "_", "~", "`", "|", ":", "<", ">"];
            const escapeDiscordInternal = (s) => {
                const match = s.match(/\bhttps?:\/\//);
                if (match) {
                    return escapeDiscordInternal(s.substring(0, match.index)) + s.substring(match.index);
                }
                escapeChars.forEach((char) => {
                    s = s.replace(new RegExp("\\" + char, "g"), "\\" + char);
                });
                return s;
            };
            const parts = msg.split(/\s/).map(escapeDiscordInternal);
            const whitespace = msg.replace(/\S/g, "");
            msg = parts[0];
            for (let i = 0; i < whitespace.length; i++) {
                msg += whitespace[i] + parts[i + 1];
            }
            return msg;
        });
    }
    parsePreContent(opts, node) {
        let text = node.text;
        const match = text.match(/^<code([^>]*)>/i);
        if (!match) {
            text = unescapeHtml(text);
            if (text[0] !== "\n") {
                text = "\n" + text;
            }
            return text;
        }
        // remove <code> opening-tag
        text = text.substr(match[0].length);
        // remove </code> closing tag
        text = text.replace(/<\/code>$/i, "");
        text = unescapeHtml(text);
        if (text[0] !== "\n") {
            text = "\n" + text;
        }
        const language = match[1].match(/language-(\w*)/i);
        if (language) {
            text = language[1] + text;
        }
        else if (opts.determineCodeLanguage) {
            text = highlightjs.highlightAuto(text).language + text;
        }
        return text;
    }
    parseUser(opts, id) {
        return __awaiter(this, void 0, void 0, function* () {
            const retId = yield opts.callbacks.getUserId(id);
            if (!retId) {
                return "";
            }
            return `<@${retId}>`;
        });
    }
    parseChannel(opts, id) {
        return __awaiter(this, void 0, void 0, function* () {
            const retId = yield opts.callbacks.getChannelId(id);
            if (!retId) {
                return "";
            }
            return `<#${retId}>`;
        });
    }
    parseLinkContent(opts, node) {
        return __awaiter(this, void 0, void 0, function* () {
            const attrs = node.attributes;
            const content = yield this.walkChildNodes(opts, node);
            if (!attrs.href || content === attrs.href) {
                return content;
            }
            return `[${content}](${attrs.href})`;
        });
    }
    parsePillContent(opts, node) {
        return __awaiter(this, void 0, void 0, function* () {
            const attrs = node.attributes;
            if (!attrs.href || !attrs.href.startsWith(MATRIX_TO_LINK)) {
                return yield this.parseLinkContent(opts, node);
            }
            const id = attrs.href.replace(MATRIX_TO_LINK, "");
            let reply = "";
            switch (id[0]) {
                case "@":
                    // user pill
                    reply = yield this.parseUser(opts, id);
                    break;
                case "#":
                    reply = yield this.parseChannel(opts, id);
                    break;
            }
            if (!reply) {
                return yield this.parseLinkContent(opts, node);
            }
            return reply;
        });
    }
    parseImageContent(opts, node) {
        return __awaiter(this, void 0, void 0, function* () {
            const EMOTE_NAME_REGEX = /^:?(\w+):?/;
            const attrs = node.attributes;
            const src = attrs.src || "";
            const name = attrs.alt || attrs.title || "";
            const emoji = yield opts.callbacks.getEmoji(src, name);
            if (!emoji) {
                const content = yield this.escapeDiscord(opts, name);
                if (!src) {
                    return content;
                }
                let url = opts.callbacks.mxcUrlToHttp(src);
                const shortener = opts.urlShortener || DEFAULT_URL_SHORTENER;
                if (shortener.endpoint && shortener.urlParameter && shortener.shortParameter) {
                    const body = shortener.extraBody || {}; // tslint:disable-line no-any
                    body[shortener.urlParameter] = url;
                    try {
                        const res = yield got_1.default({
                            json: body,
                            method: shortener.method || "POST",
                            url: shortener.endpoint,
                        }).json();
                        let resJson; // tslint:disable-line no-any
                        if (typeof res === "string") {
                            resJson = JSON.parse(res);
                        }
                        else {
                            resJson = res;
                        }
                        if (typeof resJson[shortener.shortParameter] === "string") {
                            url = resJson[shortener.shortParameter];
                        }
                    }
                    catch (err) { } // do nothing
                }
                return `[${content} ${url} ]`;
            }
            return `<${emoji.animated ? "a" : ""}:${emoji.name}:${emoji.id}>`;
        });
    }
    parseBlockquoteContent(opts, node) {
        return __awaiter(this, void 0, void 0, function* () {
            let msg = yield this.walkChildNodes(opts, node);
            msg = msg.split("\n").map((s) => {
                return "> " + s;
            }).join("\n");
            msg = msg + "\n"; // discord quotes don't require an extra new line to end them
            return msg;
        });
    }
    parseSpanContent(opts, node) {
        return __awaiter(this, void 0, void 0, function* () {
            const content = yield this.walkChildNodes(opts, node);
            const attrs = node.attributes;
            // matrix spoilers are still in MSC stage
            // see https://github.com/matrix-org/matrix-doc/pull/2010
            if (attrs["data-mx-spoiler"] !== undefined) {
                const spoilerReason = attrs["data-mx-spoiler"];
                if (spoilerReason) {
                    return `(${spoilerReason})||${content}||`;
                }
                return `||${content}||`;
            }
            return content;
        });
    }
    parseUlContent(opts, node) {
        return __awaiter(this, void 0, void 0, function* () {
            this.listDepth++;
            const entries = yield this.arrayChildNodes(opts, node, ["LI"]);
            this.listDepth--;
            const bulletPoint = this.listBulletPoints[this.listDepth % this.listBulletPoints.length];
            let msg = entries.map((s) => {
                return `${"    ".repeat(this.listDepth)}${bulletPoint} ${s}`;
            }).join("\n");
            if (this.listDepth === 0) {
                msg = `${msg}\n\n`;
            }
            return msg;
        });
    }
    parseOlContent(opts, node) {
        return __awaiter(this, void 0, void 0, function* () {
            this.listDepth++;
            const entries = yield this.arrayChildNodes(opts, node, ["LI"]);
            this.listDepth--;
            let entry = 0;
            const attrs = node.attributes;
            if (attrs.start && attrs.start.match(/^[0-9]+$/)) {
                entry = parseInt(attrs.start, 10) - 1;
            }
            let msg = entries.map((s) => {
                entry++;
                return `${"    ".repeat(this.listDepth)}${entry}. ${s}`;
            }).join("\n");
            if (this.listDepth === 0) {
                msg = `${msg}\n\n`;
            }
            return msg;
        });
    }
    arrayChildNodes(opts, node, types = []) {
        return __awaiter(this, void 0, void 0, function* () {
            const replies = [];
            yield util_1.Util.AsyncForEach(node.childNodes, (child) => __awaiter(this, void 0, void 0, function* () {
                if (types.length && (child.nodeType === Parser.NodeType.TEXT_NODE
                    || !types.includes(child.tagName))) {
                    return;
                }
                replies.push(yield this.walkNode(opts, child));
            }));
            return replies;
        });
    }
    walkChildNodes(opts, node) {
        return __awaiter(this, void 0, void 0, function* () {
            let reply = "";
            let lastTag = "";
            yield util_1.Util.AsyncForEach(node.childNodes, (child) => __awaiter(this, void 0, void 0, function* () {
                const thisTag = child.nodeType === Parser.NodeType.ELEMENT_NODE
                    ? child.tagName : "";
                if (thisTag === "P" && lastTag === "P") {
                    reply += "\n\n";
                }
                else if (BLOCK_TAGS.includes(thisTag) && reply && reply[reply.length - 1] !== "\n") {
                    reply += "\n";
                }
                reply += yield this.walkNode(opts, child);
                lastTag = thisTag;
            }));
            return reply;
        });
    }
    walkNode(opts, node) {
        return __awaiter(this, void 0, void 0, function* () {
            if (node.nodeType === Parser.NodeType.TEXT_NODE) {
                // ignore \n between single nodes
                if (node.text === "\n") {
                    return "";
                }
                return yield this.escapeDiscord(opts, node.text);
            }
            else if (node.nodeType === Parser.NodeType.ELEMENT_NODE) {
                const nodeHtml = node;
                switch (nodeHtml.tagName) {
                    case "EM":
                    case "I":
                        return `*${yield this.walkChildNodes(opts, nodeHtml)}*`;
                    case "STRONG":
                    case "B":
                        return `**${yield this.walkChildNodes(opts, nodeHtml)}**`;
                    case "U":
                    case "INS":
                        return `__${yield this.walkChildNodes(opts, nodeHtml)}__`;
                    case "DEL":
                    case "STRIKE":
                    case "S":
                        return `~~${yield this.walkChildNodes(opts, nodeHtml)}~~`;
                    case "CODE":
                        return `\`${nodeHtml.text}\``;
                    case "PRE":
                        return `\`\`\`${this.parsePreContent(opts, nodeHtml)}\`\`\``;
                    case "A":
                        return yield this.parsePillContent(opts, nodeHtml);
                    case "IMG":
                        return yield this.parseImageContent(opts, nodeHtml);
                    case "BR":
                        return "\n";
                    case "BLOCKQUOTE":
                        return yield this.parseBlockquoteContent(opts, nodeHtml);
                    case "UL":
                        return yield this.parseUlContent(opts, nodeHtml);
                    case "OL":
                        return yield this.parseOlContent(opts, nodeHtml);
                    case "MX-REPLY":
                        return "";
                    case "HR":
                        return "\n----------\n";
                    case "H1":
                    case "H2":
                    case "H3":
                    case "H4":
                    case "H5":
                    case "H6": {
                        const level = parseInt(nodeHtml.tagName[1], 10);
                        let content = yield this.walkChildNodes(opts, nodeHtml);
                        const MAX_UPPERCASE_LEVEL = 2;
                        if (level <= MAX_UPPERCASE_LEVEL) {
                            content = content.toUpperCase();
                        }
                        let prefix = "";
                        if (level > 1) {
                            prefix = "#".repeat(level) + " ";
                        }
                        return `**${prefix}${content}**\n`;
                    }
                    case "SPAN":
                        return yield this.parseSpanContent(opts, nodeHtml);
                    default:
                        return yield this.walkChildNodes(opts, nodeHtml);
                }
            }
            return "";
        });
    }
}
exports.MatrixMessageParser = MatrixMessageParser;
