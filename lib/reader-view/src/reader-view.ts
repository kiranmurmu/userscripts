// ==UserScript==
// @name                    Reader View (Readability)
// @namespace               https://github.com/kiranmurmu/userscripts
// @description             Reader View (Mozilla Readability) for Tampermonkey
// @copyright               2025+, Kiran Murmu
// @match                   *://*/*
// @author                  kiranmurmu
// @version                 0.1.1
// @homepage                https://github.com/kiranmurmu/userscripts
// @source                  https://github.com/kiranmurmu/userscripts/tree/main/reader-view
// @license                 MIT
// @run-at                  document-start
// @grant                   GM_registerMenuCommand
// @grant                   GM_addElement
// @icon                    https://www.tampermonkey.net/images/icon.png
// @require                 https://cdnjs.cloudflare.com/ajax/libs/readability/0.6.0/Readability.min.js
// @resource plaintext.css  https://github.com/kiranmurmu/userscripts/raw/refs/heads/main/lib/reader-view/style/plaintext.css
// ==/UserScript==

import type MozillaReadability from "mozilla-readability";

type Readability = MozillaReadability;
type ReadabilityResult = MozillaReadability.ParseResult;

interface ReadabilityConstructor extends Readability {
    new(document: Document | Node): Readability;
}

interface ShowArticleOptions {
    title: string;
    url: string;
    favIconUrl: string;
    article: ReadabilityResult | null;
}

declare var Readability: ReadabilityConstructor;

(function () {
    'use strict';

    if (typeof Readability == "undefined") {
        return;
    }

    function getArticle() {
        return new Readability(document.cloneNode(true)).parse();
    }

    function showArticle({ title, url, favIconUrl, article }: ShowArticleOptions) {
        const { parentNode } = document.documentElement;
        const documentElement = document.implementation.createHTMLDocument(title);
        const favIcon = document.createElement("link");
        const heading = document.createElement("h1");
        const container = document.createElement("div");

        try {
            favIcon.rel = "shortcut icon";
            favIcon.href = favIconUrl;
            documentElement.head.appendChild(favIcon);

            heading.id = "readability-title";
            heading.textContent = article!.title;
            container.innerHTML = article!.content;
            container.className = "article-container";
            container.insertBefore(heading, container.firstChild);

            documentElement.body.appendChild(container);
            documentElement.documentElement.setAttribute("lang", "en-US");
            parentNode!.replaceChild(documentElement.documentElement, document.documentElement);
        }
        catch (error) {
            if (error instanceof Error) {
                console.error(error.message);
            }
            else {
                console.error(error);
            }
        }
    }

    GM_registerMenuCommand("Enable Reader View", function (_event) {
        const favIcon = document.head.querySelector<HTMLLinkElement>("link[rel*='icon']");
        const title = document.title;
        const url = location.href.replace(/\/$/g, "");
        const favIconUrl = favIcon?.href ?? `https://icons.duckduckgo.com/ip3/${location.hostname}.ico`;
        const article = getArticle();
        showArticle({ title, url, favIconUrl, article });
    });
})();
