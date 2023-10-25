// ==UserScript==
// @name          Trello Style (Grimlore)
// @namespace     https://github.com/JonasReich/
// @version       0.6.0
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

function updateDynamicTaskListElements()
{
    // Replace all cards containing the separator string with a card-separator element + Remove the separator string from card text.
    let separator_string = "---";
    let dividers_card_titles = $(`.list-card-title:contains('${separator_string}')`);
    let cards = dividers_card_titles.closest(".list-card").not(".placeholder");
    $(cards).find(".list-card-title:contains('done')").closest(".list-card").addClass("js-card-separator-done");
    $(cards).find(".list-card-title:contains('todo')").closest(".list-card").addClass("js-card-separator-todo");
    $(cards).find(".list-card-title:contains('started')").closest(".list-card").addClass("js-card-separator-wip");
    $(cards).find(".list-card-title:contains('in progress')").closest(".list-card").addClass("js-card-separator-wip");

    dividers_card_titles.closest(".list-card").addClass("js-card-separator");
    dividers_card_titles.each(function() {
        var str = $(this).contents().filter(function() {
            // only the immediate text. There are some hidden text elements (invisible card ID text) that we need to ignore.
            return this.nodeType == Node.TEXT_NODE;
        }).text().replace(separator_string, "");
        $(this).text(str);
    });

    // bug workaround: remove task label every time we add it, otherwise some cards get it by accident when dragging cards around.
    $(".js-task-card").removeClass("js-task-card");

    // mark done cards
    $(".js-done-card").removeClass("js-done-card");
    $(".js-card-separator-done").nextUntil(".js-card-separator-wip").filter(".list-card").not(".placeholder").addClass("js-done-card").addClass("js-task-card");

    // mark wip cards
    $(".js-wip-card").removeClass("js-wip-card");
    $(".js-card-separator-wip").nextUntil(".js-card-separator-todo").filter(".list-card").not(".placeholder").addClass("js-wip-card").addClass("js-task-card");

    // mark todo cards
    $(".js-todo-card").removeClass("js-todo-card");
    $(".js-card-separator-todo").nextAll().filter(".list-card").not(".placeholder").addClass("js-todo-card").addClass("js-task-card");

    // Mark about column
    $(".list-header-name:contains('ABOUT')").closest(".list").addClass("js-about-list");

    // Mark cards labeled with "bug"
    $("button:contains('Bug')").closest(".list-card").not(".js-bug-card").addClass("js-bug-card");

    let task_list_summary_template = `<div class="js-task-list-summary"></div>`;
    let new_task_lists = $(".js-card-separator-done").closest(".list").not(".js-task-list").addClass("js-task-list");
    $(new_task_lists).find(".list-header").append(task_list_summary_template);
    // toggle class: mod-warning
    let limit_badge_template = `<span class="js-task-limit-badge" title="This is a Grimlore task counter that excludes dividers and 'done' tasks."></span>`;
    $(new_task_lists).find(".list-header-extras-limit-badge").before(limit_badge_template);

    $(".js-task-list-summary").each(function(){
        let open_cards = $(this).closest(".list").find(".js-task-card").not(".js-done-card");
        let remaining_days_prefix = "Remaining Days: ";
        let num_days = 0;
        $(open_cards).find(".badge-text").each(function(){
            let badge_txt = $(this).text();
            if (badge_txt.includes(remaining_days_prefix)) {
                let num_days_card = parseInt(badge_txt.replace(remaining_days_prefix, ""));
                num_days += num_days_card;
            }
        });
        let list_limit_txt = $(this).closest(".js-list").find(".list-header-extras-limit-badge").text();
        let list_limit = parseInt(list_limit_txt.split("/")[1]);

        let num_open_tasks = open_cards.length;
        let b_exceeds_limit = num_open_tasks > list_limit;
        $(this).closest(".list").toggleClass("js-exceeds-task-limit", b_exceeds_limit);

        // html() supports <br> newlines, text() doesn't
        $(this).html(remaining_days_prefix + num_days);
        $(this).closest(".list").find(".js-task-limit-badge").text(num_open_tasks + " / " + list_limit).toggleClass("mod-warning", b_exceeds_limit);
    });
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

function updateDoneTasksButtonLabel() {
    let show = GM_getValue(KEY_SHOW_DONE);
    let btn_text = (show == "none") ? "🙈 Done Tasks" : "👀 Done Tasks";
    $("#toggle-done-visibility-button-label").text(btn_text);
}

var KEY_SHOW_DONE = "trello-show-done-tasks";
function toggleDoneTasksVisibility()
{
    let display_status = $(":root").css("--js-display-done-tasks");
    if (display_status == "none") {
        display_status = "inline-block";
    } else {
        display_status = "none";
    }
    GM_setValue(KEY_SHOW_DONE, display_status);
    $(":root").css("--js-display-done-tasks", display_status);
    updateDoneTasksButtonLabel();
}

(function() {
    'use strict';

    // Make collapsed lists smaller
    // Make compatible with column limits
    // Make lists wider than default -> change images to contain instead of cover
    GM_addStyle ( `
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
    :root { --card-separator-color: black; }
    .js-card-separator-done { --card-separator-color: #0e910e; }
    .js-card-separator-wip { --card-separator-color: #5050f7; }
    .js-card-separator-todo { --card-separator-color: #686868; }

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
         font-size: 0.7em;
     }
     .js-done-card .badges, .js-done-card .list-card-members {
         display: none;
     }

     .js-todo-card {
         opacity: 80%;
     }
     `);

    // alternative display for list summary / list limit
    // hide the default limiter
    GM_addStyle(`
    .js-task-list .list-header-extras-limit-badge { display: none; }
    .js-task-list-summary {
         color: var(--ds-text-subtlest,#626f86);
         margin: 0;
         padding: 0 12px;
         font-size: 0.7rem;
    }
    .js-task-limit-badge {
        background-color: var(--ds-background-accent-gray-subtler,#dcdfe4);
        border-radius: 20px;
        color: var(--ds-text-subtle,#44546f);
        font-size: 12px;
        font-weight: 700;
        font-weight: 400;
        line-height: 20px;
        padding: 2px 8px;
        text-align: center;
    }
    .js-task-limit-badge.mod-warning {
        background-color: var(--ds-background-warning-bold,#e2b203);
        color: var(--ds-text-warning-inverse,#172b4d);
    }
    `);

    // about list
    GM_addStyle(`
    .js-about-list { opacity: 50%; }
    .js-about-list:hover { opacity: 100%; }
    `);

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

    // custom toolbar buttons (main button bar on board)
    GM_addStyle(`
    .js-custom-toolbar-button {
        background-color: var(--dynamic-button);
        color: var(--dynamic-text);
    }
    .js-custom-toolbar-button:hover {
        background-color: var(--dynamic-button-hovered);
    }
    `);

    // due toggling
    GM_addStyle(`
    :root {
        --js-display-due-badge: inline-block;
    }
    .js-due-date-badge {
        display: var(--js-display-due-badge) !important;
    }
    `);

    // done task toggling
    GM_addStyle(`
    .js-done-card {
        display: var(--js-display-done-tasks);
    }
    `);

    // alternate list backgrounds...
    // ...for NON task lists
    GM_addStyle(`
    .list {
        --js-default-background-color: #ffffffab;
        --js-exceed-limit-background-color: #ffecabc7;
        background-color: var(--js-default-background-color);
    }
    .list.exceeds-list-limit {
        background-color: var(--js-exceed-limit-background-color);
    }`);
    // ...and for task lists
    GM_addStyle(`
    .js-task-list.exceeds-list-limit {
        background-color: var(--js-default-background-color);
    }
    .js-task-list.js-exceeds-task-limit {
        background-color: var(--js-exceed-limit-background-color);
    }
    `);

    // bugs
    GM_addStyle(`
    .js-bug-card {
        border-left: 8px #c9372c solid;
    }`);

    setInterval(updateDynamicTaskListElements, 100);

    // ---

    var added_due_button = false;
    var added_done_vis_button = false;
    waitForKeyElements("div.board-header-btns", function(){
        if (!added_due_button)
        {
            let due_button_template = `<div><div><div role="presentation"><button id="toggle-due-visibility-button" class="js-custom-toolbar-button" type="button" aria-label="Toggle Due Date Visibility" aria-describedby="36val-tooltip"><span id="toggle-due-visibility-button-label" title="Toggle Due Dates"></span></button></div></div></div>`;
            $(".board-header-btns").append(due_button_template);
            $("#toggle-due-visibility-button").click(function(){toggleDueDateVisibility();});
            updateDueDateButtonLabel();

            let done_button_template = `<div><div><div role="presentation"><button id="toggle-done-tasks-button" class="js-custom-toolbar-button" type="button" aria-label="Toggle Done Tasks Visibility" aria-describedby="36val-tooltip"><span id="toggle-done-visibility-button-label" title="Toggle Done Tasks"></span></button></div></div></div>`;
            $(".board-header-btns").append(done_button_template);
            $("#toggle-done-tasks-button").click(function(){toggleDoneTasksVisibility();});
            updateDoneTasksButtonLabel();
        }
        added_due_button = true;
    });

    let due_visibility = GM_getValue(KEY_SHOW_DUES);
    if (due_visibility != undefined) {
        $(":root").css("--js-display-due-badge", due_visibility);
    } else {
        GM_setValue(KEY_SHOW_DUES, "inline-block");
    }

    let done_visibility = GM_getValue(KEY_SHOW_DONE);
    if (done_visibility != undefined) {
        $(":root").css("--js-display-done-tasks", done_visibility);
    } else {
        GM_setValue(KEY_SHOW_DONE, "inline-block");
    }
})();
