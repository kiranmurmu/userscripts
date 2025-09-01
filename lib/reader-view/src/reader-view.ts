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
// @grant                   GM_getResourceURL
// @icon                    https://www.tampermonkey.net/images/icon.png
// @require                 https://cdnjs.cloudflare.com/ajax/libs/readability/0.6.0/Readability.min.js
// @resource reader.css     https://github.com/kiranmurmu/userscripts/raw/refs/heads/main/lib/reader-view/style/reader.css
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
    faviconUrl: string;
    article: ReadabilityResult | null;
}

interface ShowPlainTextOptions {
    title: string;
    faviconUrl: string;
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

    function showPlainText({ title, faviconUrl, article }: ShowPlainTextOptions) {
        const { parentNode } = document.documentElement;
        const documentElement = document.implementation.createHTMLDocument(title);
        const container = document.createElement("pre");
        const iconLink = document.createElement("link");
        const styleLink = document.createElement("link");

        try {
            const articleTitle = document.createTextNode(article!.title);
            const articleContent = document.createTextNode(article!.textContent);
            const styleData = GM_getResourceURL("reader.css");

            iconLink.rel = "shortcut icon";
            iconLink.href = faviconUrl;
            styleLink.rel = "stylesheet";
            styleLink.href = styleData;

            container.appendChild(articleTitle);
            container.appendChild(articleContent);

            documentElement.head.appendChild(iconLink);
            documentElement.head.appendChild(styleLink);
            documentElement.body.appendChild(container);
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

    function showArticle({ title, url, faviconUrl, article }: ShowArticleOptions) {
        const { parentNode } = document.documentElement;
        const documentElement = document.implementation.createHTMLDocument(title);
        const favIcon = document.createElement("link");
        const heading = document.createElement("h1");
        const container = document.createElement("div");

        try {
            favIcon.rel = "shortcut icon";
            favIcon.href = faviconUrl;
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

    const favicon = document.head.querySelector<HTMLLinkElement>("link[rel*='icon']");
    const title = document.title;
    const url = location.href.replace(/\/$/g, "");
    const faviconUrl = favicon?.href ?? `https://icons.duckduckgo.com/ip3/${location.hostname}.ico`;

    GM_registerMenuCommand("Enable reader view", (_event) => {
        const article = getArticle();
        showArticle({ title, url, faviconUrl, article });
    });

    GM_registerMenuCommand("Extract article text", (_event) => {
        const article = getArticle();
        showPlainText({ title, faviconUrl, article });
    });
})();
