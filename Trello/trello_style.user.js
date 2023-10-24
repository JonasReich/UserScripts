// ==UserScript==
// @name          Trello Style (Grimlore)
// @namespace     https://github.com/JonasReich/
// @version       0.4.0
// @description   Style Adjustments for Trello (for work at Grimlore)
// @author        Jonas Reich
// @match         https://trello.com/*
// @icon          https://www.google.com/s2/favicons?sz=64&domain=trello.com
// @updateURL     https://github.com/JonasReich/UserScripts/raw/main/Trello/trello_style.user.js
// @downloadURL   https://github.com/JonasReich/UserScripts/raw/main/Trello/trello_style.user.js
// @require       https://gist.github.com/raw/2625891/waitForKeyElements.js
// @require       https://ajax.googleapis.com/ajax/libs/jquery/3.6.1/jquery.min.js
// @grant         GM_addStyle
// @grant         GM_setValue
// @grant         GM_getValue
// ==/UserScript==

function replaceSeparatorsTick()
{
    // Replace all cards containing the separator string with a card-separator element + Remove the separator string from card text.
    let separator_string = "---";
    let dividers_card_titles = $(`.list-card-title:contains('${separator_string}')`);
    let cards = dividers_card_titles.closest(".list-card");
    $(cards).find(".list-card-title:contains('done')").css("--card-separator-color", "#55b755").closest(".list-card").addClass("js-card-separator-done"); // some shade of green
    $(cards).find(".list-card-title:contains('todo')").css("--card-separator-color", "grey").closest(".list-card").addClass("js-card-separator-todo");
    $(cards).find(".list-card-title:contains('started')").css("--card-separator-color", "#5050f7").closest(".list-card").addClass("js-card-separator-wip"); // some shade of blue
    $(cards).find(".list-card-title:contains('in progress')").css("--card-separator-color", "#5050f7").closest(".list-card").addClass("js-card-separator-wip"); // some shade of blue

    dividers_card_titles.closest(".list-card").addClass("js-card-separator");
    dividers_card_titles.each(function() {
        var str = $(this).contents().filter(function() {
            // only the immediate text. There are some hidden text elements (invisible card ID text) that we need to ignore.
            return this.nodeType == Node.TEXT_NODE;
        }).text().replace(separator_string, "");
        $(this).text(str);
    });

    // mark done cards
    $(".js-done-card").removeClass("js-done-card");
    $(".js-card-separator-done").nextUntil(".js-card-separator-wip").addClass("js-done-card");

    // mark wip cards
    $(".js-wip-card").removeClass("js-wip-card");
    $(".js-card-separator-wip").nextUntil(".js-card-separator-todo").addClass("js-wip-card");

    // mark todo cards
    $(".js-todo-card").removeClass("js-todo-card");
    $(".js-card-separator-todo").nextAll().addClass("js-todo-card");
}

function updateDueDateButtonLabel() {
    let show = GM_getValue(KEY_SHOW_DUES);
    let btn_text = (show == "none") ? "🙈 Due Dates" : "👀 Due Dates";
    $("#toggle-due-visibility-button-label").text(btn_text);
}

var KEY_SHOW_DUES = "trello-show-due-dates";
function toggleDueDateVisibility()
{
    let display_status = $(":root").css("--js-display-due-badge");
    if (display_status == "none") {
        display_status = "inline-block";
    } else {
        display_status = "none";
    }
    GM_setValue(KEY_SHOW_DUES, display_status);
    $(":root").css("--js-display-due-badge", display_status);
    updateDueDateButtonLabel();
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

    .js-card-separator {
        min-height: 35px;
        border-radius: 0px;
        background-color: transparent !important;
        box-shadow: none;
    }

    .js-card-separator .list-card-title {
        color: var(--card-separator-color) !important;
        font-weight: 600;
        font-size: 1.1rem;
        text-align: center;
        font-variant: all-small-caps;
        padding-bottom: 10px;
    }

    .js-card-separator .list-card-details {
        padding: 0;
    }

    .js-card-separator .list-card-title::before, .js-card-separator .list-card-title::after {
        content: "";
        flex-grow: 1;
        display: inline;
        border-bottom: 2px solid;
        margin-left: 5px;
        margin-right: 5px;
        height: 12px;
    }

    .js-card-separator .list-card-title.js-card-name {
        display: flex;
    }
    `);

    // done/wip/todo cards
     GM_addStyle(`
     .js-done-card {
         opacity: 50%;
     }
     .js-done-card .badges, .js-done-card .list-card-members {
         display: none;
     }

     .js-todo-card {
         opacity: 80%;
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

    GM_addStyle(`
    :root {
        --js-display-due-badge: inline-block;
    }
    .js-due-date-badge {
        display: var(--js-display-due-badge) !important;
    }
    `);

    setInterval(replaceSeparatorsTick, 100);

    var added_button = false;
    waitForKeyElements("div.board-header-btns", function(){
        if (!added_button)
        {
            let button_template = `<div><div><div role="presentation"><button id="toggle-due-visibility-button" type="button" aria-label="Toggle Due Date Visibility" aria-describedby="36val-tooltip"><span id="toggle-due-visibility-button-label">Toggle Due Dates</span></button></div></div></div>`;
            $(".board-header-btns").append(button_template);
            $("#toggle-due-visibility-button").click(function(){toggleDueDateVisibility();});
            updateDueDateButtonLabel();
        }
        added_button = true;
    });

    let due_visibility = GM_getValue(KEY_SHOW_DUES);
    if (due_visibility != undefined) {
        $(":root").css("--js-display-due-badge", due_visibility);
    } else {
        GM_setValue("inline-block");
    }
})();
