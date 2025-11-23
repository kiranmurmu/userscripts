// ==UserScript==
// @name                 Reader View (Readability)
// @namespace            https://kiranmurmu.github.io/
// @description          Reader View (UserScript) for Tampermonkey
// @match                *://*/*
// @author               Kiran Murmu <44278642+kiranmurmu@users.noreply.github.com>
// @version              2025-11-23
// @homepage             https://github.com/kiranmurmu/userscripts
// @source               https://github.com/kiranmurmu/userscripts/tree/main/reader-view
// @license              MIT
// @run-at               document-start
// @grant                GM_registerMenuCommand
// @grant                GM_getResourceURL
// @icon                 https://www.tampermonkey.net/images/icon.png
// @require              https://cdnjs.cloudflare.com/ajax/libs/readability/0.6.0/Readability.min.js
// @resource reader.css  https://github.com/kiranmurmu/userscripts/raw/refs/heads/main/lib/reader-view/style/reader.css
// ==/UserScript==

(function () {
    'use strict';
    if (typeof Readability == "undefined") {
        return;
    }
    function getArticle() {
        return new Readability(document.cloneNode(true)).parse();
    }
    function showPlainText({ title, faviconUrl, article }) {
        const { parentNode } = document.documentElement;
        const documentElement = document.implementation.createHTMLDocument(title);
        const container = document.createElement("pre");
        const iconLink = document.createElement("link");
        const styleLink = document.createElement("link");
        try {
            const articleTitle = document.createTextNode(article.title);
            const articleContent = document.createTextNode(article.textContent);
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
            parentNode.replaceChild(documentElement.documentElement, document.documentElement);
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
    function showArticle({ title, url, faviconUrl, article }) {
        const { parentNode } = document.documentElement;
        const documentElement = document.implementation.createHTMLDocument(title);
        const iconLink = document.createElement("link");
        const styleLink = document.createElement("link");
        const heading = document.createElement("h1");
        const container = document.createElement("div");
        const header = document.createElement("div");
        const content = document.createElement("div");
        try {
            iconLink.rel = "shortcut icon";
            iconLink.href = faviconUrl;
            styleLink.rel = "stylesheet";
            styleLink.href = GM_getResourceURL("reader.css");
            heading.className = "title";
            heading.textContent = article.title;
            header.className = "header";
            header.appendChild(heading);
            content.className = "content";
            content.innerHTML = article.content;
            container.className = "container";
            container.appendChild(header);
            container.appendChild(content);
            documentElement.head.appendChild(iconLink);
            documentElement.head.appendChild(styleLink);
            documentElement.body.appendChild(container);
            parentNode.replaceChild(documentElement.documentElement, document.documentElement);
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
    const favicon = document.head.querySelector("link[rel*='icon']");
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
