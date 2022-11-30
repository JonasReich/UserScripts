// ==UserScript==
// @name         Trello Style (Jonas Reich)
// @namespace    https://github.com/JonasReich/
// @version      0.1
// @description  Style Adjustments for Trello
// @author       Jonas Reich
// @match        https://trello.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=trello.com
// @updateURL    https://github.com/JonasReich/UserScripts/raw/main/Trello/trello_style.user.js
// @updateURL    https://github.com/JonasReich/UserScripts/raw/main/Trello/trello_style.user.js
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // Make collapsed strelloids lists smaller
    // Modifies divs created by this extension: https://addons.mozilla.org/en-US/firefox/addon/strelloids/
    GM_addStyle ( `
    .list-wrapper {
        height: inherit;
        width: 390px;
    }
    .list-card { max-width: none; }
    #board:not(.board-table-view) .list-hidden .list-header .list-header-extras {
        top: 30px;
    }
    #board:not(.board-table-view) .list-hidden .list-header-name-assist {
        margin-top: 50px;
    }
    `);

    // Make card details window bigger (useful on 1440k and bigger monitors)
    GM_addStyle ( `
    .window { width: 80%; max-width:1400px; }
	.window-main-col { width: 68%; padding: 0 1% 1% 2%; }
	.window-sidebar { width: 25%; }
	.small-window .window-sidebar { position: static; }
    .button-link, .card-detail-window .button-link-container { max-width: none; }
    `);
})();
