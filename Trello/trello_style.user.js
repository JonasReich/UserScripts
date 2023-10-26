// ==UserScript==
// @name          Trello Style (Grimlore)
// @namespace     https://github.com/JonasReich/
// @version       0.7.0
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

'use strict';

function updateDynamicTaskListElements()
{
    // before 26-10-2023 these elements were identified by classes. now they have data which we can't easily query for in css (I think?).
    // So I replace them with custom js-... classes.
    $("[data-testid='card-name']").addClass("js-list-card-title");
    $('[data-testid="list"]').addClass("js-list");
    $('[data-testid="list-card"]').addClass('js-list-card');
    $('[data-testid="trello-card"]').addClass('js-trello-card');
    $('[data-testid="badge-due-date-completed"]').addClass("js-due-date-badge");
    $('[data-testid="badge-due-date-not-completed"]').addClass("js-due-date-badge");
    $('[data-testid="list-header"]').addClass("js-list-header");
    $('[data-testid="list-name"]').addClass("js-list-name");
    $('[data-testid="list-limits-badge"]').addClass("js-list-limits-badge");
    $('[data-testid="card-front-member"]').addClass("js-card-front-member");
    $('[data-testid="badge-custom-field"]').addClass("js-badge-custom-field");

    // Replace all cards containing the separator string with a card-separator element + Remove the separator string from card text.
    let separator_string = "---";
    let dividers_card_titles = $(`.js-list-card-title:contains('${separator_string}')`);
    let cards = dividers_card_titles.closest(".js-list-card").not(".placeholder");
    $(cards).find(".js-list-card-title:contains('done')").closest(".js-list-card").addClass("js-card-separator-done");
    $(cards).find(".js-list-card-title:contains('todo')").closest(".js-list-card").addClass("js-card-separator-todo");
    $(cards).find(".js-list-card-title:contains('started')").closest(".js-list-card").addClass("js-card-separator-wip");
    $(cards).find(".js-list-card-title:contains('in progress')").closest(".js-list-card").addClass("js-card-separator-wip");

    dividers_card_titles.closest(".js-list-card").addClass("js-card-separator");
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
    $(".js-card-separator-done").nextUntil(".js-card-separator-wip").filter(".js-list-card").not(".placeholder").addClass("js-done-card").addClass("js-task-card");

    // mark wip cards
    $(".js-wip-card").removeClass("js-wip-card");
    $(".js-card-separator-wip").nextUntil(".js-card-separator-todo").filter(".js-list-card").not(".placeholder").addClass("js-wip-card").addClass("js-task-card");

    // mark todo cards
    $(".js-todo-card").removeClass("js-todo-card");
    $(".js-card-separator-todo").nextAll().filter(".js-list-card").not(".placeholder").addClass("js-todo-card").addClass("js-task-card");

    // Mark about column
    $(".js-list-name:contains('ABOUT')").closest(".js-list").addClass("js-about-list");

    // Mark cards labeled with "bug"
    $("button:contains('Bug')").closest(".js-list-card").not(".js-bug-card").addClass("js-bug-card");

    let task_list_summary_template = `<div class="js-task-list-summary"></div>`;
    let new_task_lists = $(".js-card-separator-done").closest(".js-list").not(".js-task-list").addClass("js-task-list");
    $(new_task_lists).find(".js-list-header").append(task_list_summary_template);
    // toggle class: mod-warning
    let limit_badge_template = `<span class="js-task-limit-badge" title="This is a Grimlore task counter that excludes dividers and 'done' tasks."></span>`;
    $(".js-task-list .js-list-header:not(:has(.js-task-limit-badge))").find(".js-list-limits-badge").before(limit_badge_template);

    $(".js-task-list-summary").each(function(){
        let open_cards = $(this).closest(".js-list").find(".js-task-card").not(".js-done-card");
        let remaining_days_prefix = "Remaining Days: ";
        let num_days = 0;
        $(open_cards).find(".js-badge-custom-field").each(function(){
            let badge_txt = $(this).text();
            if (badge_txt.includes(remaining_days_prefix)) {
                let num_days_card = parseInt(badge_txt.replace(remaining_days_prefix, ""));
                num_days += num_days_card;
            }
        });
        let list_limit_txt = $(this).closest(".js-list").find(".js-list-limits-badge").text();
        let list_limit = parseInt(list_limit_txt.split("/")[1]);

        let num_open_tasks = open_cards.length;
        let b_exceeds_limit = num_open_tasks > list_limit;
        $(this).closest(".js-list").toggleClass("js-exceeds-task-limit", b_exceeds_limit);

        // html() supports <br> newlines, text() doesn't
        $(this).html(remaining_days_prefix + num_days);
        $(this).closest(".js-list").find(".js-task-limit-badge").text(num_open_tasks + " / " + list_limit).toggleClass("mod-warning", b_exceeds_limit);
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
        display_status = "flex";
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
        display_status = "flex";
    } else {
        display_status = "none";
    }
    GM_setValue(KEY_SHOW_DONE, display_status);
    $(":root").css("--js-display-done-tasks", display_status);
    updateDoneTasksButtonLabel();
}

(function() {

    // Make collapsed lists smaller
    // Make compatible with column limits
    // Make lists wider than default -> change images to contain instead of cover
    /*
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
    */

    // Make card details window bigger (useful on 1440k and bigger monitors)
    /*
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
    */

    // list separators
    GM_addStyle(`
    :root { --card-separator-color: black; }
    .js-card-separator-done { --card-separator-color: #0e910e; }
    .js-card-separator-wip { --card-separator-color: #5050f7; }
    .js-card-separator-todo { --card-separator-color: #686868; }

    .js-card-separator {
        border-radius: 0px;
        background-color: transparent !important;
        box-shadow: none;
        height: 40px;
    }

    .js-card-separator > div > div {
        padding: 0;
    }

    .js-card-separator .js-list-card-title {
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

    .js-card-separator .js-list-card-title::before, .js-card-separator .js-list-card-title::after {
        content: "";
        flex-grow: 1;
        display: inline;
        border-bottom: 2px solid;
        margin-left: 5px;
        margin-right: 5px;
        height: 12px;
    }

    .js-card-separator .js-list-card-title {
        display: flex;
    }

    .js-card-separator * {
       background-color: transparent !important;
       box-shadow: none !important;
    }
    `);

    // done/wip/todo cards
     GM_addStyle(`
     .js-done-card {
         opacity: 50%;
         font-size: 0.7em;
         display: var(--js-display-done-tasks) !important;
     }
     .js-done-card .badges, .js-done-card .js-card-front-member {
         display: none;
     }

     .js-todo-card {
         opacity: 80%;
     }
     `);

    // alternative display for list summary / list limit
    // hide the default limiter
    GM_addStyle(`
    .js-task-list .js-list-limits-badge { display: none; }
    .js-task-list-summary {
         color: var(--ds-text-subtlest,#626f86);
         margin: 0;
         padding: 0 12px;
         font-size: 0.7rem;
         padding-bottom: .5rem;
    }
    .js-task-limit-badge {
        background-color: var(--ds-background-accent-gray-subtler,#dcdfe4);
        border-radius: 20px;
        color: var(--ds-text-subtle,#44546f);
        font-size: 12px;
        font-weight: 700;
        font-weight: 400;
        line-height: 20px;
        margin: 4px 0;
        padding: 2px 8px;
        text-align: center;
    }
    .js-task-limit-badge.mod-warning {
        background-color: var(--ds-background-warning-bold,#e2b203);
        color: var(--ds-text-warning-inverse,#172b4d);
    }
    /*hide member on task cards. they are sorted into columns by assignee anyways
    .js-task-list .js-card-front-member { display:none; }*/
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

    // alternate list backgrounds...
    // ...for NON task lists
    GM_addStyle(`
    .js-list {
        /* copied from trello with eye-picker */
        --js-default-background-color: rgb(241, 242, 244);
        --js-exceed-limit-background-color: rgb(255, 247, 214);
        /*--list-background: var(--js-default-background-color) !important;*/
    }
    .js-list.exceeds-list-limit {
        /*--list-background: var(--js-exceed-limit-background-color) !important;*/
    }`);
    // ...and for task lists
    GM_addStyle(`
    .js-task-list {
        --list-background: var(--js-default-background-color) !important;
    }
    .js-task-list.js-exceeds-task-limit {
        --list-background: var(--js-exceed-limit-background-color)) !important;
    }
    `);

    // bugs
    GM_addStyle(`
    .js-bug-card .js-trello-card {
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
    if (due_visibility == "flex" || due_visibility == "none") {
        $(":root").css("--js-display-due-badge", due_visibility);
    } else {
        GM_setValue(KEY_SHOW_DUES, "flex");
    }

    let done_visibility = GM_getValue(KEY_SHOW_DONE);
    if (done_visibility == "flex" || done_visibility == "none") {
        $(":root").css("--js-display-done-tasks", done_visibility);
    } else {
        GM_setValue(KEY_SHOW_DONE, "flex");
    }
})();
