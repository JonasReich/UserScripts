// ==UserScript==
// @name          Trello Style (Jonas Reich)
// @namespace     https://github.com/JonasReich/
// @version       0.3.0
// @description   Style Adjustments for Trello
// @author        Jonas Reich
// @match         https://trello.com/*
// @icon          https://www.google.com/s2/favicons?sz=64&domain=trello.com
// @updateURL     https://github.com/JonasReich/UserScripts/raw/main/Trello/trello_style.user.js
// @downloadURL   https://github.com/JonasReich/UserScripts/raw/main/Trello/trello_style.user.js
// @require       https://ajax.googleapis.com/ajax/libs/jquery/3.6.1/jquery.min.js
// @grant         GM_addStyle
// ==/UserScript==

function replaceSeparatorsTick()
{
    // Replace all cards containing the separator string with a card-separator element + Remove the separator string from card text.
    let separator_string = "---";
    let dividers_card_titles = $(`.list-card-title:contains('${separator_string}')`);
    let cards = dividers_card_titles.closest(".list-card");
    $(cards).find(".list-card-title:contains('done')").css("--card-separator-color", "#55b755"); // some shade of green
    $(cards).find(".list-card-title:contains('todo')").css("--card-separator-color", "grey");
    $(cards).find(".list-card-title:contains('started')").css("--card-separator-color", "#5050f7"); // some shade of blue

    dividers_card_titles.closest(".list-card").addClass("card-separator");
    dividers_card_titles.each(function() {
        var str = $(this).contents().filter(function() {
            // only the immediate text. There are some hidden text elements (invisible card ID text) that we need to ignore.
            return this.nodeType == Node.TEXT_NODE;
        }).text().replace(divider_string, "");
        $(this).text(str);
    });
}

(function() {
    'use strict';

    // Make collapsed lists smaller
    // Make compatible with column limits
    // Make lists wider than default -> change images to contain instead of cover
    GM_addStyle ( `
    .list-wrapper {
        /*width: 350px;*/
    }
    .list-wrapper:first-of-type {
        /*width: auto;*/
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

    // list separators
    GM_addStyle(`
    * {
        --card-separator-color: black;
    }

    .card-separator {
        min-height: 35px;
        border-radius: 0px;
        background-color: transparent !important;
        box-shadow: none;
    }

    .card-separator .list-card-title {
        color: var(--card-separator-color) !important;
        font-weight: 600;
        font-size: 1.1rem;
        text-align: center;
        font-variant: all-small-caps;
        padding-bottom: 10px;
    }

    .card-separator .list-card-details {
        padding: 0;
    }

    .card-separator .list-card-title::before, .card-separator .list-card-title::after {
        content: "";
        flex-grow: 1;
        display: inline;
        border-bottom: 2px solid;
        margin-left: 5px;
        margin-right: 5px;
        height: 12px;
    }

    .card-separator .list-card-title.js-card-name {
        display: flex;
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
    .window-sidebar .button-link, .card-detail-window .button-link-container {
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

    setInterval(replaceSeparatorsTick, 100);
})();
