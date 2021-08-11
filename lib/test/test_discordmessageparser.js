"use strict";
/*
Copyright 2019, 2020 matrix-discord

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
require("mocha");
const chai_1 = require("chai");
const discordmessageparser_1 = require("../src/discordmessageparser");
// we are a test file and thus need those
/* tslint:disable:no-unused-expression max-file-line-count no-any */
function getMessageParserOpts(callbacksSet = {}) {
    const callbacks = Object.assign({
        getChannel: (id) => __awaiter(this, void 0, void 0, function* () {
            if (id === "123") {
                return null;
            }
            return {
                mxid: "#_discord_1234_12345:localhost",
                name: "foxies",
            };
        }),
        getEmoji: (name, animated, id) => __awaiter(this, void 0, void 0, function* () { return name !== "unknown" ? "mxc://localhost/" + name : null; }),
        getUser: (id) => __awaiter(this, void 0, void 0, function* () {
            if (id === "123") {
                return null;
            }
            return {
                mxid: "@_discord_12345:localhost",
                name: "foxies",
            };
        }),
    }, callbacksSet);
    return {
        callbacks,
    };
}
function getMessage(str, bot = false, mentionEveryone = false, embeds = []) {
    const guild = {
        id: "1234",
        roles: new Map(),
    };
    const role = {
        color: 0x123456,
        id: "123456",
        name: "Fox Lover",
    };
    guild.roles.set("123456", role);
    const author = {
        bot,
    };
    const msg = {
        id: "123456789",
        content: str,
        embeds,
        mentions: {
            everyone: mentionEveryone,
        },
        author,
        guild,
    };
    return msg;
}
const defaultOpts = getMessageParserOpts();
describe("DiscordMessageParser", () => {
    describe("FormatMessage", () => {
        it("processes plain text messages correctly", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new discordmessageparser_1.DiscordMessageParser();
            const msg = getMessage("hello world!");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result.body).is.equal("hello world!");
            chai_1.expect(result.formattedBody).is.equal("hello world!");
        }));
        it("processes markdown messages correctly", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new discordmessageparser_1.DiscordMessageParser();
            const msg = getMessage("Hello *World*!");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result.body).is.equal("Hello *World*!");
            chai_1.expect(result.formattedBody).is.equal("Hello <em>World</em>!");
        }));
        it("processes non-discord markdown correctly", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new discordmessageparser_1.DiscordMessageParser();
            let msg = getMessage(">inb4 tests");
            let result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result.body).is.equal(">inb4 tests");
            chai_1.expect(result.formattedBody).is.equal("&gt;inb4 tests");
            msg = getMessage("[test](http://example.com)");
            result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result.body).is.equal("[test](http://example.com)");
            chai_1.expect(result.formattedBody).is.equal("[test](<a href=\"http://example.com\">http://example.com</a>)");
        }));
        it("processes discord-specific markdown correctly", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new discordmessageparser_1.DiscordMessageParser();
            const msg = getMessage("_ italic _");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result.body).is.equal("_ italic _");
            chai_1.expect(result.formattedBody).is.equal("<em> italic </em>");
        }));
        it("replaces @everyone correctly", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new discordmessageparser_1.DiscordMessageParser();
            let msg = getMessage("hey @everyone!");
            let result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result.body).is.equal("hey @everyone!");
            chai_1.expect(result.formattedBody).is.equal("hey @everyone!");
            msg = getMessage("hey @everyone!", false, true);
            result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result.body).is.equal("hey @room!");
            chai_1.expect(result.formattedBody).is.equal("hey @room!");
        }));
        it("replaces @here correctly", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new discordmessageparser_1.DiscordMessageParser();
            let msg = getMessage("hey @here!");
            let result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result.body).is.equal("hey @here!");
            chai_1.expect(result.formattedBody).is.equal("hey @here!");
            msg = getMessage("hey @here!", false, true);
            result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result.body).is.equal("hey @room!");
            chai_1.expect(result.formattedBody).is.equal("hey @room!");
        }));
        it("replaces blockquotes correctly", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new discordmessageparser_1.DiscordMessageParser();
            let msg = getMessage("> quote\nfox");
            let result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result.body).is.equal("> quote\nfox");
            chai_1.expect(result.formattedBody).is.equal("<blockquote>quote<br></blockquote>fox");
            msg = getMessage("text\n>>> quote\nmultiline", false, true);
            result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result.body).is.equal("text\n>>> quote\nmultiline");
            chai_1.expect(result.formattedBody).is.equal("text<br><blockquote>quote<br>multiline</blockquote>");
        }));
        it("should leave emoji-shortcodes alone for users", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new discordmessageparser_1.DiscordMessageParser();
            const msg = getMessage(":fox:");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result.body).is.equal(":fox:");
            chai_1.expect(result.formattedBody).is.equal(":fox:");
        }));
        it("should emojify shortcodes for bots", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new discordmessageparser_1.DiscordMessageParser();
            const msg = getMessage(":fox:", true);
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result.body).is.equal("🦊");
            chai_1.expect(result.formattedBody).is.equal("🦊");
        }));
    });
    describe("FormatEmbeds", () => {
        it("processes discord-specific markdown correctly", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new discordmessageparser_1.DiscordMessageParser();
            const msg = getMessage("message", false, false, [
                {
                    author: {},
                    client: {},
                    color: {},
                    createdAt: {},
                    createdTimestamp: {},
                    description: "Description",
                    fields: [],
                    footer: undefined,
                    hexColor: {},
                    image: undefined,
                    message: {},
                    provider: {},
                    thumbnail: {},
                    title: "Title",
                    type: {},
                    url: "http://example.com",
                    video: {},
                },
            ]);
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result.body).is.equal("message\n\n----\n##### [Title](http://example.com)\nDescription");
            chai_1.expect(result.formattedBody).is.equal("message<hr><h5><a href=\"http://example.com\">Title</a>" +
                "</h5><p>Description</p>");
        }));
        it("should ignore same-url embeds", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new discordmessageparser_1.DiscordMessageParser();
            const msg = getMessage("message http://example.com", false, false, [
                {
                    author: {},
                    client: {},
                    color: {},
                    createdAt: {},
                    createdTimestamp: {},
                    description: "Description",
                    fields: [],
                    footer: {},
                    hexColor: {},
                    image: {},
                    message: {},
                    provider: {},
                    thumbnail: {},
                    title: "Title",
                    type: {},
                    url: "http://example.com",
                    video: {},
                },
            ]);
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result.body).is.equal("message http://example.com");
            chai_1.expect(result.formattedBody).is.equal("message <a href=\"http://example.com\">" +
                "http://example.com</a>");
        }));
        it("should ignore same-url embeds with trailing slash", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new discordmessageparser_1.DiscordMessageParser();
            const msg = getMessage("message http://example.com", false, false, [
                {
                    author: {},
                    client: {},
                    color: {},
                    createdAt: {},
                    createdTimestamp: {},
                    description: "Description",
                    fields: [],
                    footer: {},
                    hexColor: {},
                    image: {},
                    message: {},
                    provider: {},
                    thumbnail: {},
                    title: "Title",
                    type: {},
                    url: "http://example.com/",
                    video: {},
                },
            ]);
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result.body).is.equal("message http://example.com");
            chai_1.expect(result.formattedBody).is.equal("message <a href=\"http://example.com\">" +
                "http://example.com</a>");
        }));
        it("should ignore same-url embeds that are youtu.be", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new discordmessageparser_1.DiscordMessageParser();
            const msg = getMessage("message https://youtu.be/blah blubb", false, false, [
                {
                    author: {},
                    client: {},
                    color: {},
                    createdAt: {},
                    createdTimestamp: {},
                    description: "Description",
                    fields: [],
                    footer: {},
                    hexColor: {},
                    image: {},
                    message: {},
                    provider: {},
                    thumbnail: {},
                    title: "Title",
                    type: {},
                    url: "https://www.youtube.com/watch?v=blah",
                    video: {},
                },
            ]);
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result.body).is.equal("message https://youtu.be/blah blubb");
            chai_1.expect(result.formattedBody).is.equal("message <a href=\"https://youtu.be/blah\">" +
                "https://youtu.be/blah</a> blubb");
        }));
    });
    describe("FormatEdit", () => {
        it("should format basic edits appropriately", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new discordmessageparser_1.DiscordMessageParser();
            const msg1 = getMessage("a");
            const msg2 = getMessage("b");
            const result = yield mp.FormatEdit(defaultOpts, msg1, msg2);
            chai_1.expect(result.body).is.equal("*edit:* ~~a~~ -> b");
            chai_1.expect(result.formattedBody).is.equal("<em>edit:</em> <del>a</del> -&gt; b");
        }));
        it("should format markdown heavy edits apropriately", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new discordmessageparser_1.DiscordMessageParser();
            const msg1 = getMessage("a slice of **cake**");
            const msg2 = getMessage("*a* slice of cake");
            const result = yield mp.FormatEdit(defaultOpts, msg1, msg2);
            chai_1.expect(result.body).is.equal("*edit:* ~~a slice of **cake**~~ -> *a* slice of cake");
            chai_1.expect(result.formattedBody).is.equal("<em>edit:</em> <del>a slice of <strong>" +
                "cake</strong></del> -&gt; <em>a</em> slice of cake");
        }));
        it("should format discord fail edits correctly", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new discordmessageparser_1.DiscordMessageParser();
            const msg1 = getMessage("~~fail~");
            const msg2 = getMessage("~~fail~~");
            const result = yield mp.FormatEdit(defaultOpts, msg1, msg2);
            chai_1.expect(result.body).is.equal("*edit:* ~~~~fail~~~ -> ~~fail~~");
            chai_1.expect(result.formattedBody).is.equal("<em>edit:</em> <del>~~fail~</del> -&gt; <del>fail</del>");
        }));
        it("should format multiline edits correctly", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new discordmessageparser_1.DiscordMessageParser();
            const msg1 = getMessage("multi\nline");
            const msg2 = getMessage("multi\nline\nfoxies");
            const result = yield mp.FormatEdit(defaultOpts, msg1, msg2);
            chai_1.expect(result.body).is.equal("*edit:* ~~multi\nline~~ -> multi\nline\nfoxies");
            chai_1.expect(result.formattedBody).is.equal("<p><em>edit:</em></p><p><del>multi<br>line</del></p><hr>" +
                "<p>multi<br>line<br>foxies</p>");
        }));
        it("should add old message link", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new discordmessageparser_1.DiscordMessageParser();
            const msg1 = getMessage("fox");
            const msg2 = getMessage("foxies");
            const result = yield mp.FormatEdit(defaultOpts, msg1, msg2, "https://matrix.to/#/old");
            chai_1.expect(result.body).is.equal("*edit:* ~~fox~~ -> foxies");
            chai_1.expect(result.formattedBody).is.equal("<a href=\"https://matrix.to/#/old\"><em>edit:</em></a>" +
                " <del>fox</del> -&gt; foxies");
        }));
    });
    describe("Discord Replacements", () => {
        it("processes members correctly", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new discordmessageparser_1.DiscordMessageParser();
            const msg = getMessage("<@12345>");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result.body).is.equal("foxies (@_discord_12345:localhost)");
            chai_1.expect(result.formattedBody).is.equal("<a href=\"https://matrix.to/#/@_discord_12345:localhost\">foxies</a>");
        }));
        it("ignores unknown roles", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new discordmessageparser_1.DiscordMessageParser();
            const msg = getMessage("<@&1234>");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result.body).is.equal("<@&1234>");
            chai_1.expect(result.formattedBody).is.equal("&lt;@&amp;1234&gt;");
        }));
        it("parses known roles", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new discordmessageparser_1.DiscordMessageParser();
            const msg = getMessage("<@&123456>");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result.body).is.equal("@Fox Lover");
            chai_1.expect(result.formattedBody).is.equal("<span data-mx-color=\"#123456\"><strong>@Fox Lover</strong></span>");
        }));
        it("parses spoilers", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new discordmessageparser_1.DiscordMessageParser();
            const msg = getMessage("||foxies||");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result.body).is.equal("(Spoiler: foxies)");
            chai_1.expect(result.formattedBody).is.equal("<span data-mx-spoiler>foxies</span>");
        }));
        it("processes unknown emoji correctly", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new discordmessageparser_1.DiscordMessageParser();
            const msg = getMessage("<:unknown:1234>");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result.body).is.equal("<:unknown:1234>");
            chai_1.expect(result.formattedBody).is.equal("&lt;:unknown:1234&gt;");
        }));
        it("processes emoji correctly", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new discordmessageparser_1.DiscordMessageParser();
            const msg = getMessage("<:fox:1234>");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result.body).is.equal(":fox:");
            chai_1.expect(result.formattedBody).is.equal("<img alt=\":fox:\" title=\":fox:\" height=\"32\" src=\"mxc://localhost/fox\" data-mx-emoticon />");
        }));
        it("processes double-emoji correctly", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new discordmessageparser_1.DiscordMessageParser();
            const msg = getMessage("<:fox:1234> <:fox:1234>");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result.body).is.equal(":fox: :fox:");
            chai_1.expect(result.formattedBody).is.equal("<img alt=\":fox:\" title=\":fox:\" height=\"32\" src=\"mxc://localhost/fox\" data-mx-emoticon /> " +
                "<img alt=\":fox:\" title=\":fox:\" height=\"32\" src=\"mxc://localhost/fox\" data-mx-emoticon />");
        }));
        it("processes unknown channel correctly", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new discordmessageparser_1.DiscordMessageParser();
            const msg = getMessage("<#123>");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result.body).is.equal("<#123>");
            chai_1.expect(result.formattedBody).is.equal("&lt;#123&gt;");
        }));
        it("processes channels correctly", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new discordmessageparser_1.DiscordMessageParser();
            const msg = getMessage("<#12345>");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result.body).is.equal("#foxies");
            chai_1.expect(result.formattedBody).is.equal("<a href=\"https://matrix.to/#/#_discord_1234" +
                "_12345:localhost\">#foxies</a>");
        }));
        it("processes multiple channels correctly", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new discordmessageparser_1.DiscordMessageParser();
            const msg = getMessage("<#12345> <#12345>");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result.body).is.equal("#foxies #foxies");
            chai_1.expect(result.formattedBody).is.equal("<a href=\"https://matrix.to/#/#_discord_1234" +
                "_12345:localhost\">#foxies</a> <a href=\"https://matrix.to/#/#_discord_1234" +
                "_12345:localhost\">#foxies</a>");
        }));
    });
    describe("InsertEmbes", () => {
        it("processes discord-specific markdown correctly", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new discordmessageparser_1.DiscordMessageParser();
            const msg = getMessage("", false, false, [
                {
                    description: "TestDescription",
                },
            ]);
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result.body).is.equal("\nTestDescription");
            chai_1.expect(result.formattedBody).is.equal("<p>TestDescription</p>");
        }));
        it("processes urlless embeds properly", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new discordmessageparser_1.DiscordMessageParser();
            const msg = getMessage("", false, false, [
                {
                    description: "TestDescription",
                    title: "TestTitle",
                },
            ]);
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result.body).is.equal("\n##### TestTitle\nTestDescription");
            chai_1.expect(result.formattedBody).is.equal("<h5>TestTitle</h5><p>TestDescription</p>");
        }));
        it("processes linked embeds properly", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new discordmessageparser_1.DiscordMessageParser();
            const msg = getMessage("", false, false, [
                {
                    description: "TestDescription",
                    title: "TestTitle",
                    url: "testurl",
                },
            ]);
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result.body).is.equal("\n##### [TestTitle](testurl)\nTestDescription");
            chai_1.expect(result.formattedBody).is.equal("<h5><a href=\"testurl\">" +
                "TestTitle</a></h5><p>TestDescription</p>");
        }));
        it("rejects titleless and descriptionless embeds", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new discordmessageparser_1.DiscordMessageParser();
            const msg = getMessage("Some content...", false, false, [
                {
                    url: "testurl",
                },
            ]);
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result.body).is.equal("Some content...");
            chai_1.expect(result.formattedBody).is.equal("Some content...");
        }));
        it("processes multiple embeds properly", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new discordmessageparser_1.DiscordMessageParser();
            const msg = getMessage("", false, false, [
                {
                    description: "TestDescription",
                    title: "TestTitle",
                    url: "testurl",
                },
                {
                    description: "TestDescription2",
                    title: "TestTitle2",
                    url: "testurl2",
                },
            ]);
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result.body).is.equal(`
##### [TestTitle](testurl)
TestDescription

----
##### [TestTitle2](testurl2)
TestDescription2`);
            chai_1.expect(result.formattedBody).is.equal("<h5><a href=\"testurl\">TestTitle" +
                "</a></h5><p>TestDescription</p><hr><h5><a href=\"testurl2\">" +
                "TestTitle2</a></h5><p>TestDescription2</p>");
        }));
        it("inserts embeds properly", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new discordmessageparser_1.DiscordMessageParser();
            const msg = getMessage("Content that goes in the message", false, false, [
                {
                    description: "TestDescription",
                    title: "TestTitle",
                    url: "testurl",
                },
            ]);
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result.body).is.equal(`Content that goes in the message

----
##### [TestTitle](testurl)
TestDescription`);
            chai_1.expect(result.formattedBody).is.equal("Content that goes in the message<hr><h5><a " +
                "href=\"testurl\">TestTitle</a></h5><p>TestDescription</p>");
        }));
        it("adds fields properly", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new discordmessageparser_1.DiscordMessageParser();
            const msg = getMessage("Content that goes in the message", false, false, [
                {
                    description: "TestDescription",
                    fields: [{
                            inline: false,
                            name: "fox",
                            value: "floof",
                        }],
                    title: "TestTitle",
                    url: "testurl",
                },
            ]);
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result.body).is.equal(`Content that goes in the message

----
##### [TestTitle](testurl)
TestDescription
**fox**
floof`);
            chai_1.expect(result.formattedBody).is.equal("Content that goes in the message<hr><h5><a" +
                " href=\"testurl\">TestTitle</a></h5><p>TestDescription</p><p><strong>fox" +
                "</strong><br>floof</p>");
        }));
        it("adds images properly", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new discordmessageparser_1.DiscordMessageParser();
            const msg = getMessage("Content that goes in the message", false, false, [
                {
                    description: "TestDescription",
                    image: {
                        url: "http://example.com",
                    },
                    title: "TestTitle",
                    url: "testurl",
                },
            ]);
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result.body).is.equal(`Content that goes in the message

----
##### [TestTitle](testurl)
TestDescription
Image: http://example.com`);
            chai_1.expect(result.formattedBody).is.equal("Content that goes in the message<hr><h5>" +
                "<a href=\"testurl\">TestTitle</a></h5><p>TestDescription</p><p>Image" +
                ": <a href=\"http://example.com\">http://example.com</a></p>");
        }));
        it("adds a footer properly", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new discordmessageparser_1.DiscordMessageParser();
            const msg = getMessage("Content that goes in the message", false, false, [
                {
                    description: "TestDescription",
                    footer: {
                        text: "footer",
                    },
                    title: "TestTitle",
                    url: "testurl",
                },
            ]);
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result.body).is.equal(`Content that goes in the message

----
##### [TestTitle](testurl)
TestDescription
footer`);
            chai_1.expect(result.formattedBody).is.equal("Content that goes in the message<hr>" +
                "<h5><a href=\"testurl\">TestTitle</a></h5><p>TestDescription</p><p>footer</p>");
        }));
        it("adds an author properly", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new discordmessageparser_1.DiscordMessageParser();
            const msg = getMessage("Content that goes in the message", false, false, [
                {
                    description: "TestDescription",
                    author: {
                        name: "Foxies",
                    },
                },
            ]);
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result.body).is.equal(`Content that goes in the message

----
**Foxies**
TestDescription`);
            chai_1.expect(result.formattedBody).is.equal("Content that goes in the message<hr>" +
                "<strong>Foxies</strong><br><p>TestDescription</p>");
        }));
    });
    describe("Message Type", () => {
        it("sets non-bot messages as m.text", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new discordmessageparser_1.DiscordMessageParser();
            const msg = getMessage("no bot", false);
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result.msgtype).is.equal("m.text");
        }));
        it("sets bot messages as m.notice", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new discordmessageparser_1.DiscordMessageParser();
            const msg = getMessage("a bot", true);
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result.msgtype).is.equal("m.notice");
        }));
    });
});
