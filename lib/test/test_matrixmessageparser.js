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
const matrixmessageparser_1 = require("../src/matrixmessageparser");
// we are a test file and thus need those
/* tslint:disable:no-unused-expression max-file-line-count no-any */
function getMessageParserOpts(callbacksSet = {}, displayname = "Foxer") {
    const callbacks = Object.assign({
        canNotifyRoom: () => __awaiter(this, void 0, void 0, function* () { return true; }),
        getChannelId: (mxid) => __awaiter(this, void 0, void 0, function* () { return mxid.includes("12345") ? "12345" : null; }),
        getEmoji: (mxid, name) => __awaiter(this, void 0, void 0, function* () {
            return mxid.includes("real_emote") ? {
                id: "123456",
                name: "test_emoji",
                animated: false,
            } : null;
        }),
        getUserId: (mxid) => __awaiter(this, void 0, void 0, function* () { return mxid.includes("12345") ? "12345" : null; }),
        mxcUrlToHttp: (mxc) => mxc,
    }, callbacksSet);
    return {
        callbacks,
        displayname,
    };
}
function getPlainMessage(msg, msgtype = "m.text") {
    return {
        body: msg,
        msgtype,
    };
}
function getHtmlMessage(msg, msgtype = "m.text") {
    return {
        body: msg,
        formatted_body: msg,
        msgtype,
    };
}
const defaultOpts = getMessageParserOpts();
describe("MatrixMessageParser", () => {
    describe("FormatMessage / body / simple", () => {
        it("leaves blank stuff untouched", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getPlainMessage("hello world!");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result).is.equal("hello world!");
        }));
        it("escapes simple stuff", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getPlainMessage("hello *world* how __are__ you?");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result).is.equal("hello \\*world\\* how \\_\\_are\\_\\_ you?");
        }));
        it("escapes more complex stuff", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getPlainMessage("wow \\*this\\* is cool");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result).is.equal("wow \\\\\\*this\\\\\\* is cool");
        }));
        it("escapes ALL the stuff", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getPlainMessage("\\ * _ ~ ` |");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result).is.equal("\\\\ \\* \\_ \\~ \\` \\|");
        }));
        it("leaves URLs alone", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getPlainMessage("*hey* https://example.org/_blah_");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result).is.equal("\\*hey\\* https://example.org/_blah_");
        }));
        it("leaves URLs after line breaks alone", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getPlainMessage("*hey*\nhttps://example.org/_blah_");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result).is.equal("\\*hey\\*\nhttps://example.org/_blah_");
        }));
        it("leaves URLs between parentheses alone", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getPlainMessage("*hey* (https://example.org/_blah_)");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result).is.equal("\\*hey\\* (https://example.org/_blah_)");
        }));
    });
    describe("FormatMessage / formatted_body / simple", () => {
        it("leaves blank stuff untouched", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getHtmlMessage("hello world!");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result).is.equal("hello world!");
        }));
        it("un-escapes simple stuff", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getHtmlMessage("foxes &amp; foxes");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result).is.equal("foxes & foxes");
        }));
        it("converts italic formatting", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getHtmlMessage("this text is <em>italic</em> and so is <i>this one</i>");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result).is.equal("this text is *italic* and so is *this one*");
        }));
        it("converts bold formatting", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getHtmlMessage("wow some <b>bold</b> and <strong>more</strong> boldness!");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result).is.equal("wow some **bold** and **more** boldness!");
        }));
        it("converts underline formatting", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getHtmlMessage("to be <u>underlined</u> or not to be?");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result).is.equal("to be __underlined__ or not to be?");
        }));
        it("converts del formatting", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getHtmlMessage("does <del>this text</del> exist <strike>today</strike>?");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result).is.equal("does ~~this text~~ exist ~~today~~?");
        }));
        it("converts code", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getHtmlMessage("WOW this is <code>some awesome</code> code");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result).is.equal("WOW this is `some awesome` code");
        }));
        it("converts multiline-code", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getHtmlMessage("<p>here</p><pre><code>is\ncode\n</code></pre><p>yay</p>");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result).is.equal("here```\nis\ncode\n```yay");
        }));
        it("converts multiline language code", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getHtmlMessage(`<p>here</p>
<pre><code class="language-js">is
code
</code></pre>
<p>yay</p>`);
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result).is.equal("here```js\nis\ncode\n```yay");
        }));
        it("autodetects the language, if enabled", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getHtmlMessage(`<p>here</p>
<pre><code>&lt;strong&gt;yay&lt;/strong&gt;
</code></pre>
<p>yay</p>`);
            const opts = getMessageParserOpts();
            opts.determineCodeLanguage = true;
            const result = yield mp.FormatMessage(opts, msg);
            chai_1.expect(result).is.equal(`here\`\`\`xml
<strong>yay</strong>
\`\`\`yay`);
        }));
        it("handles linebreaks", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getHtmlMessage("line<br>break");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result).is.equal("line\nbreak");
        }));
        it("handles <hr>", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getHtmlMessage("test<hr>foxes");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result).is.equal("test\n----------\nfoxes");
        }));
        it("handles headings", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getHtmlMessage(`<h1>fox</h1>
<h2>floof</h2>
<h3>pony</h3>
<h4>hooves</h4>
<h5>tail</h5>
<h6>foxies</h6>`);
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result).is.equal(`**FOX**
**## FLOOF**
**### pony**
**#### hooves**
**##### tail**
**###### foxies**`);
        }));
        it("strips simple span tags", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getHtmlMessage("<span>bunny</span>");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result).is.equal("bunny");
        }));
        it("formats p tags", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getHtmlMessage("<p>1</p><p>2</p>");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result).is.equal("1\n\n2");
        }));
    });
    describe("FormatMessage / formatted_body / complex", () => {
        it("html unescapes stuff inside of code", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getHtmlMessage("<code>is &lt;em&gt;italic&lt;/em&gt;?</code>");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result).is.equal("`is <em>italic</em>?`");
        }));
        it("html unescapes inside of pre", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getHtmlMessage("<pre><code>wow &amp;</code></pre>");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result).is.equal("```\nwow &```");
        }));
        it("doesn't parse inside of code", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getHtmlMessage("<code>*yay*</code>");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result).is.equal("`*yay*`");
        }));
        it("doesn't parse inside of pre", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getHtmlMessage("<pre><code>*yay*</code></pre>");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result).is.equal("```\n*yay*```");
        }));
        it("parses new lines", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getHtmlMessage("<em>test</em><br><strong>ing</strong>");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result).is.equal("*test*\n**ing**");
        }));
        it("drops mx-reply", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getHtmlMessage("<mx-reply><blockquote>message</blockquote></mx-reply>test reply");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result).is.equal("test reply");
        }));
        it("parses links", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getHtmlMessage("<a href=\"http://example.com\">link</a>");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result).is.equal("[link](http://example.com)");
        }));
        it("parses links with same content", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getHtmlMessage("<a href=\"http://example.com\">http://example.com</a>");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result).is.equal("http://example.com");
        }));
        it("doesn't discord-escape links", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getHtmlMessage("<a href=\"http://example.com/_blah_/\">link</a>");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result).is.equal("[link](http://example.com/_blah_/)");
        }));
        it("doesn't discord-escape links with same content", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getHtmlMessage("<a href=\"http://example.com/_blah_/\">http://example.com/_blah_/</a>");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result).is.equal("http://example.com/_blah_/");
        }));
        it("should handle multiple quotes within a message", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getHtmlMessage("<blockquote>\n<p>Here is something</p>\n</blockquote>\n<p>That sure is a cool something</p>\n<blockquote>\n<p>Here is something else!</p>\n</blockquote>\n<p>Oh no, I wasn't expecting that</p>\n");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result).is.equal("> Here is something\nThat sure is a cool something\n> Here is something else!\nOh no, I wasn't expecting that");
        }));
    });
    describe("FormatMessage / formatted_body / discord", () => {
        it("Parses user pills", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getHtmlMessage("<a href=\"https://matrix.to/#/@_discord_12345:localhost\">TestUsername</a>");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result).is.equal("<@12345>");
        }));
        it("Ignores invalid user pills", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getHtmlMessage("<a href=\"https://matrix.to/#/@_discord_789:localhost\">TestUsername</a>");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result).is.equal("[TestUsername](https://matrix.to/#/@_discord_789:localhost)");
        }));
        it("Parses channel pills", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getHtmlMessage("<a href=\"https://matrix.to/#/#_discord_1234_12345:" +
                "localhost\">#SomeChannel</a>");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result).is.equal("<#12345>");
        }));
        it("Handles invalid channel pills", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getHtmlMessage("<a href=\"https://matrix.to/#/#_discord_1234_789:localhost\">#SomeChannel</a>");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result).is.equal("[#SomeChannel](https://matrix.to/#/#_discord_1234_789:localhost)");
        }));
        it("Ignores links without href", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getHtmlMessage("<a><em>yay?</em></a>");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result).is.equal("*yay?*");
        }));
        it("Ignores links with non-matrix href", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getHtmlMessage("<a href=\"http://example.com\"><em>yay?</em></a>");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result).is.equal("[*yay?*](http://example.com)");
        }));
        it("Handles spoilers", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getHtmlMessage("<span data-mx-spoiler>foxies</span>");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result).is.equal("||foxies||");
        }));
        it("Handles spoilers with reason", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getHtmlMessage("<span data-mx-spoiler=\"floof\">foxies</span>");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result).is.equal("(floof)||foxies||");
        }));
        it("Inserts emojis", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getHtmlMessage("<img src=\"mxc://real_emote:localhost\">");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result).is.equal("<:test_emoji:123456>");
        }));
        it("Handles invalid emojis", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getHtmlMessage("<img alt=\"yay\" src=\"mxc://fake_emote:localhost\">");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result).is.equal("[yay mxc://fake_emote:localhost ]");
        }));
        it("Ignores images without alt / title / src", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getHtmlMessage("<img>");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result).is.equal("");
        }));
    });
    describe("FormatMessage / formatted_body / matrix", () => {
        it("escapes @everyone", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getPlainMessage("hey @everyone");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result).is.equal("hey @\u200Beveryone");
        }));
        it("escapes @here", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getPlainMessage("hey @here");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result).is.equal("hey @\u200Bhere");
        }));
        it("converts @room to @here, if sufficient power", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getPlainMessage("hey @room");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result).is.equal("hey @here");
        }));
        it("ignores @room to @here conversion, if insufficient power", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getPlainMessage("hey @room");
            const result = yield mp.FormatMessage(getMessageParserOpts({
                canNotifyRoom: () => __awaiter(void 0, void 0, void 0, function* () { return false; }),
            }), msg);
            chai_1.expect(result).is.equal("hey @room");
        }));
        it("handles /me for normal names", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getPlainMessage("floofs", "m.emote");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result).is.equal("_Foxer floofs_");
        }));
        it("handles /me for short names", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getPlainMessage("floofs", "m.emote");
            const result = yield mp.FormatMessage(getMessageParserOpts({}, "f"), msg);
            chai_1.expect(result).is.equal("_floofs_");
        }));
        it("handles /me for long names", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getPlainMessage("floofs", "m.emote");
            const result = yield mp.FormatMessage(getMessageParserOpts({}, "foxfoxfoxfoxfoxfoxfoxfoxfoxfoxfoxfox"), msg);
            chai_1.expect(result).is.equal("_floofs_");
        }));
        it("discord escapes nicks in /me", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getPlainMessage("floofs", "m.emote");
            const result = yield mp.FormatMessage(getMessageParserOpts({}, "fox_floof"), msg);
            chai_1.expect(result).is.equal("_fox\\_floof floofs_");
        }));
    });
    describe("FormatMessage / formatted_body / blockquotes", () => {
        it("parses single blockquotes", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getHtmlMessage("<blockquote>hey</blockquote>there");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result).is.equal("> hey\nthere");
        }));
        it("parses double blockquotes", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getHtmlMessage("<blockquote><blockquote>hey</blockquote>you</blockquote>there");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result).is.equal("> > hey\n> you\nthere");
        }));
        it("parses blockquotes with <p>", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getHtmlMessage("<blockquote>\n<p>spoky</p>\n</blockquote>\n<p>test</p>\n");
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result).is.equal("> spoky\ntest");
        }));
        it("parses double blockquotes with <p>", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getHtmlMessage(`<blockquote>
<blockquote>
<p>spoky</p>
</blockquote>
<p>testing</p>
</blockquote>
<p>test</p>
`);
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result).is.equal("> > spoky\n> testing\ntest");
        }));
    });
    describe("FormatMessage / formatted_body / lists", () => {
        it("parses simple unordered lists", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getHtmlMessage(`<p>soru</p>
<ul>
<li>test</li>
<li>ing</li>
</ul>
<p>more</p>
`);
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result).is.equal("soru\n● test\n● ing\n\nmore");
        }));
        it("parses nested unordered lists", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getHtmlMessage(`<p>foxes</p>
<ul>
<li>awesome</li>
<li>floofy
<ul>
<li>fur</li>
<li>tail</li>
</ul>
</li>
</ul>
<p>yay!</p>
`);
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result).is.equal("foxes\n● awesome\n● floofy\n    ○ fur\n    ○ tail\n\nyay!");
        }));
        it("parses more nested unordered lists", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getHtmlMessage(`<p>foxes</p>
<ul>
<li>awesome</li>
<li>floofy
<ul>
<li>fur</li>
<li>tail</li>
</ul>
</li>
<li>cute</li>
</ul>
<p>yay!</p>
`);
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result).is.equal("foxes\n● awesome\n● floofy\n    ○ fur\n    ○ tail\n● cute\n\nyay!");
        }));
        it("parses simple ordered lists", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getHtmlMessage(`<p>oookay</p>
<ol>
<li>test</li>
<li>test more</li>
</ol>
<p>ok?</p>
`);
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result).is.equal("oookay\n1. test\n2. test more\n\nok?");
        }));
        it("parses nested ordered lists", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getHtmlMessage(`<p>and now</p>
<ol>
<li>test</li>
<li>test more
<ol>
<li>and more</li>
<li>more?</li>
</ol>
</li>
<li>done!</li>
</ol>
<p>ok?</p>
`);
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result).is.equal("and now\n1. test\n2. test more\n    1. and more\n    2. more?\n3. done!\n\nok?");
        }));
        it("parses ordered lists with different start", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getHtmlMessage(`<ol start="5">
<li>test</li>
<li>test more</li>
</ol>`);
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result).is.equal("5. test\n6. test more");
        }));
        it("parses ul in ol", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getHtmlMessage(`<ol>
<li>test</li>
<li>test more
<ul>
<li>asdf</li>
<li>jklö</li>
</ul>
</li>
</ol>`);
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result).is.equal("1. test\n2. test more\n    ○ asdf\n    ○ jklö");
        }));
        it("parses ol in ul", () => __awaiter(void 0, void 0, void 0, function* () {
            const mp = new matrixmessageparser_1.MatrixMessageParser();
            const msg = getHtmlMessage(`<ul>
<li>test</li>
<li>test more
<ol>
<li>asdf</li>
<li>jklö</li>
</ol>
</li>
</ul>`);
            const result = yield mp.FormatMessage(defaultOpts, msg);
            chai_1.expect(result).is.equal("● test\n● test more\n    1. asdf\n    2. jklö");
        }));
    });
});
