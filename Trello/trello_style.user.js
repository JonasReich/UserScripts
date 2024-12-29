// ==UserScript==
// @name          Trello Style (Grimlore)
// @namespace     https://github.com/JonasReich/
// @version       0.11.0
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
    $("[data-testid='header-container']").addClass("js-header-container");
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
    $('[data-testid="card-front-badges"]').addClass("js-card-front-badges");
    $('[data-testid="badge-custom-field"]').addClass("js-badge-custom-field");

    // Replace all cards containing the separator string with a card-separator element + Remove the separator string from card text.
    let separator_string = "---";
    let dividers_card_titles = $(`.js-list-card-title:contains('${separator_string}')`);
    let cards = dividers_card_titles.closest(".js-list-card").not(".placeholder");
    $(cards).find(".js-list-card-title:contains('done')").closest(".js-list-card").addClass("js-card-separator-done");
    $(cards).find(".js-list-card-title:contains('todo')").closest(".js-list-card").addClass("js-card-separator-todo");
    $(cards).find(".js-list-card-title:contains('started')").closest(".js-list-card").addClass("js-card-separator-wip");
    $(cards).find(".js-list-card-title:contains('in progress')").closest(".js-list-card").addClass("js-card-separator-wip");
    $(cards).find(".js-list-card-title:contains('backlog')").closest(".js-list-card").addClass("js-card-separator-backlog");

    $(`.js-list-card-title:contains('[blocked]')`).closest(".js-list-card").addClass("js-task-blocked");

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
    $(".js-card-separator-todo").nextUntil(".js-card-separator-backlog").filter(".js-list-card").not(".placeholder").addClass("js-todo-card").addClass("js-task-card");

    // mark backlog cards
    $(".js-backlog-card").removeClass("js-backlog-card");
    $(".js-card-separator-backlog").nextAll().filter(".js-list-card").not(".placeholder").addClass("js-backlog-card").addClass("js-task-card");

    // Mark about column
    $(".js-list-name:contains('ABOUT')").closest(".js-list").addClass("js-about-list");

    // Mark cards labeled with "bug"
    $("button:contains('Bug')").closest(".js-list-card").not(".js-bug-card").addClass("js-bug-card");

    let task_list_summary_template = `<div class="js-task-list-summary"></div>`;
    let new_task_lists = $(".js-card-separator-done").closest(".js-list").not(":has(.js-task-list-summary)").addClass("js-task-list");
    $(new_task_lists).find(".js-list-header").append(task_list_summary_template);

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
        // html() supports <br> newlines, text() doesn't
        $(this).html("Open Tasks: " + open_cards.length + "<br>" + remaining_days_prefix + num_days);
    });
}

function updateBadgesButtonLabel() {
    let show = GM_getValue(KEY_SHOW_BADGES);
    let btn_text = (show == "none") ? "🙈 Badges" : "👀 Badges";
    $("#toggle-badge-visibility-button-label").text(btn_text);
}

var KEY_SHOW_BADGES = "trello-show-badges";
function togleBadgesVisibility()
{
    let display_status = $(":root").css("--js-display-badges");
    if (display_status == "none") {
        display_status = "flex";
    } else {
        display_status = "none";
    }
    GM_setValue(KEY_SHOW_BADGES, display_status);
    $(":root").css("--js-display-badges", display_status);
    updateBadgesButtonLabel();
}

(function() {
    // list separators
    GM_addStyle(`
    :root {
        --card-separator-color: black;
        --status-color-done: #0e910e;
        --status-color-wip: #5050f7;
        --status-color-todo: #686868;
    }
    .js-card-separator-done { --card-separator-color: var(--status-color-done); }
    .js-card-separator-wip { --card-separator-color: var(--status-color-wip); }
    .js-card-separator-todo { --card-separator-color: var(--status-color-todo); }
    .js-card-separator-backlog { --card-separator-color: var(--status-color-todo); }

    .js-task-card { --status-color: transparent; }
    .js-done-card { --status-color: var(--status-color-done); }
    .js-wip-card { --status-color: var(--status-color-wip); }
    .js-todo-card { --status-color: var(--status-color-todo); }

    .js-list-card {
        padding-bottom: 3px !important;
    }

    .js-card-separator {
        border-radius: 0px;
        background-color: transparent !important;
        box-shadow: none;
    }

    .js-card-separator > div > div {
        padding: 0;
    }

    .js-card-separator > div > div > div:nth-of-type(1) {
        display: none;
    }

    .js-card-separator .js-list-card-title {
        font-size: 1.1rem !important;
        text-align: center;
        font-variant: all-small-caps;
        padding-bottom: 10px;
    }

    .js-card-separator .list-card-details {
        padding: 0;
    }
    `);

    // done/wip/todo cards
     GM_addStyle(`
     * { border-radius: 4px !important; }
     .js-task-card > * {
         border-left: 4px var(--status-color) solid;
     }
     .js-done-card {
         display: var(--js-display-done-tasks) !important;
     }
     .js-done-card, .js-backlog-card
     {
         opacity: 50%;
     }
     .js-done-card *, .js-backlog-card * {
         font-size: 0.91em !important;
         line-height: 1.5em;
     }
     .js-done-card .badges,
     .js-done-card .js-card-front-badges,
     .js-backlog-card .badges,
     .js-backlog-card .js-card-front-badges,
     .js-task-card .js-card-front-member
     {
         display: none !important;
     }

     .js-todo-card {
         opacity: 80%;
     }
     .js-done-card [data-testid="compact-card-label"][data-expanded="false"],
     .js-backlog-card [data-testid="compact-card-label"][data-expanded="false"] {
         height: 3px;
     }

     .js-minify .js-card-front-badges {
	     display: none;
     }

     .js-trello-card:has([data-testid="compact-card-label"][aria-label*="Key Feature"]) {
         border-right: 4px #e2b203 solid;
     }
    `);

     // minification
     GM_addStyle(`
     .js-minify .js-list-card-title {
     	text-overflow: ellipsis;
     	white-space: nowrap;
     }
     .js-minify .js-list-card:hover .js-list-card-title {
	     white-space: inherit;
     }
     .js-minify .js-header-container,
     .js-minify [data-testid="workspace-navigation-nav"],
     .js-minify .js-board-header :not(:has(.js-custom-toolbar-button)),
     .js-minify .js-board-header > * > * > :nth-of-type(1),
     .js-minify [data-testid="card-front-cover"][data-card-front-section="cover"]
     {
         display: none;
     }
     .js-custom-toolbar-button, .js-custom-toolbar-button *
     {
         display: inherit !important;
     }
     `);

    GM_addStyle(`
    .js-task-blocked > * { background-color: #ff9d86 !important; }
    @media (prefers-color-scheme: dark) { .js-task-blocked > * { background-color: #4f1c1c !important; } }
    `);

    // cusotm list summary
    GM_addStyle(`
    .js-task-list-summary {
         color: var(--ds-text-subtlest,#626f86);
         margin: 0;
         padding: 0 12px;
         font-size: 0.7rem;
         padding-bottom: .5rem;
	 width: 100%;
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

    // badges toggling
    GM_addStyle(`
    :root {
        --js-display-badges: inline-block;
    }
    .js-card-front-badges, .js-header-container {
        display: var(--js-display-badges) !important;
    }
    `);

    // alternate list backgrounds...
    // ...for NON task lists
    GM_addStyle(`
    .js-list {
        /* copied from trello with eye-picker */
        --js-default-background-color: rgb(241, 242, 244);
        --js-exceed-limit-background-color: rgb(255, 247, 214);
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

    setInterval(updateDynamicTaskListElements, 100);

    // ---

    var added_badges_toggle_button = false;
    waitForKeyElements("div.board-header-btns", function(){
        if (!added_badges_toggle_button)
        {
            let badge_toggle_btn_template = `<div><div><div role="presentation"><button id="toggle-badge-visibility-button" class="js-custom-toolbar-button" type="button" aria-label="Toggle Badge Visibility" aria-describedby="36val-tooltip"><span id="toggle-badge-visibility-button-label" title="BUTTON TEMPLATE"></span></button></div></div></div>`;
            $(".board-header-btns").append(badge_toggle_btn_template);
            $("#toggle-badge-visibility-button").click(function(){togleBadgesVisibility();});
            updateBadgesButtonLabel();
        }
        added_badges_toggle_button = true;
    });

    let badge_visibility = GM_getValue(KEY_SHOW_BADGES);
    if (badge_visibility == "flex" || badge_visibility == "none") {
        $(":root").css("--js-display-badges", badge_visibility);
    } else {
        GM_setValue(KEY_SHOW_BADGES, "flex");
    }
})();
