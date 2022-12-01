// ==UserScript==
// @name         Trello Style (Jonas Reich)
// @namespace    https://github.com/JonasReich/
// @version      0.1
// @description  Style Adjustments for Trello
// @author       Jonas Reich
// @match        https://trello.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=trello.com
// @updateURL    https://github.com/JonasReich/UserScripts/raw/main/Trello/trello_style.user.js
// @downloadURL    https://github.com/JonasReich/UserScripts/raw/main/Trello/trello_style.user.js
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // Modifies divs created by this extension: https://addons.mozilla.org/en-US/firefox/addon/strelloids/
    // Make collapsed lists smaller
    // Make compatible with column limits
    // Make lists wider than default -> change images to contain instead of cover
    GM_addStyle ( `
    .list-wrapper {
        width: 350px;
    }
    .js-add-list.list-wrapper.mod-add.is-idle {
        width: max-content;
    }
    .list-wrapper.list-hidden {
        height: inherit;
    }
    .list-card { max-width: none; }
    #board:not(.board-table-view) .list-hidden .list-header .list-header-extras {
        top: 30px;
        left: 5px;
    }
    #board:not(.board-table-view) .list-hidden .list-header-name-assist {
        margin-top: 100px;
    }
    .list-card.is-covered .list-card-cover {
        background-size: contain !important;
        max-height: 100px;
    }
    #board:not(.board-table-view) .list-hidden .list-header-extras-limit-badge {
        padding: 8px 2px;
        margin-left: 3px;
        margin-bottom: 3px;
    }
    `);

    // Hide strelloids card counter no matter the setting (it's a bit buggy)
    // Reccommendation: Use column limits instead.
    GM_addStyle(`.list-header-num-cards.js-num-cards {display: none;}`);

    // Hide unwanted buttons from card edit window
    GM_addStyle ( `
    .button-link.js-edit-location { display: none; }
    `);

    // Make member list on card more compact
    GM_addStyle(`
    .list-card-members .member{margin-right: -15px; right: 15px;}
    .badges {width: 90%;}
    .list-card .list-card-details { align-items: flex-end; }
    `);

    // Make card details window bigger (useful on 1440k and bigger monitors)
    GM_addStyle ( `
    .window { width: 80%; max-width:1400px; }
	.window-main-col { width: 68%; padding: 0 1% 1% 2%; }
	.window-sidebar { width: 25%; }
	.small-window .window-sidebar { position: static; }
    .button-link, .card-detail-window .button-link-container {
        max-width: none;
        width: 45%;
        display: inline-block;
        margin: 1px;
    }
    .js-butler-card-buttons .u-clearfix .u-clearfix div {
        display: inline;
    }
    .checklist-item-details .checklist-item-row .checklist-item-text-and-controls {
        padding: 2px 0px;
    }
    .window-module, .checklist {
        margin-bottom:0;
    }
    `);
})();
