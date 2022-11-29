// ==UserScript==
// @name         Trello Style (Jonas Reich)
// @namespace    https://github.com/JonasReich/
// @version      0.1
// @description  Style Adjustments for Trello
// @author       Jonas Reich
// @match        https://trello.com/b/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=trello.com
// @updateURL    https://github.com/JonasReich/UserScripts/raw/main/Trello/trello_style.user.js
// @updateURL    https://github.com/JonasReich/UserScripts/raw/main/Trello/trello_style.user.js
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // Make collapsed strelloids lists smaller
    // Modifies divs created by this extension: https://addons.mozilla.org/en-US/firefox/addon/strelloids/
    GM_addStyle ( `.list-wrapper {
        height: inherit;
    }`);
})();
