// ==UserScript==
// @name         Mastodon - Quote Preview
// @namespace    https://github.com/JonasReich/
// @version      0.1
// @description  Preview links to other Mastodon posts (should theoretically also work with non Mastodon ActivityPub posts).
// @author       Jonas Reich
// @match        *://*/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=mastodon.social
// @require      https://ajax.googleapis.com/ajax/libs/jquery/3.6.1/jquery.min.js
// @require      https://gist.github.com/raw/2625891/waitForKeyElements.js
// @grant        GM_addStyle
// ==/UserScript==

'use strict';

// PUT YOUR INSTANCE BELOW
const INSTANCE = 'mastodon.gamedev.place';
const TICK_RATE_MS = 100;

function addPostPreview(link){
    let url = $(link).prop("href");
    if (url === undefined) {
        return;
    }

    var xhttp = new XMLHttpRequest();
    xhttp.open("GET", `https://${INSTANCE}/api/v2/search?q=${encodeURI(url)}&resolve=true`, true);
    xhttp.send();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            if (this.status == 200) {
                var response_obj = JSON.parse(this.responseText);
                console.log(response_obj);
                // posts are called "statuses" in mastodon API
                let statuses = response_obj.statuses;
                if (statuses.length > 0)
                {
                    let status = statuses[0];
                    let link_href = `/@${status.account.acct}/${status.id}`;
                    let post_author_str = `${status.account.display_name} (@${status.account.acct})`;
                    let parent = $(link).parent();
                    $(parent).append(`<a class="status-card quote-status" href="${link_href}" target="_blank" rel="noopener noreferrer">`);
                    let quote_status = $(parent).find(".quote-status");
                    //$(quote_status).append(`<div class="quote-status__icon">💬</div>`);
                    $(quote_status).append(`<div class="status-card__image"><img src="${status.account.avatar}" alt="" class="status-card__image-image"></div>`);
                    let title_html = `<strong class="status-card__title" title="${post_author_str}">${post_author_str}</strong>`;

                    // This is not the exact date format as in the regular footer, but it's at least locale consistent.
                    const date_options = { year: 'numeric', month: 'short', day: 'numeric', hour: "numeric", minute:"numeric" };
                    let post_date = new Date(Date.parse(status.created_at)).toLocaleDateString(undefined, date_options);

                    let status_visibility_ico = "fa-invalid";
                    if (status.visibility == "public") {
                        status_visibility_ico = "fa-globe";
                    } else if (status.visibility == "unlisted") {
                        status_visibility_ico = "fa-unlock";
                    } else if (status.visibility == "private") {
                        status_visibility_ico = "fa-lock";
                    } else if (status.visibility == "direct") {
                        status_visibility_ico = "fa-at";
                    }
                    let status_meta_html = `
                    <div class="detailed-status__meta">
                        <a class="detailed-status__datetime" href="${link_href}" target="_blank" rel="noopener noreferrer">
                            <span>${post_date}</span>
                        </a>
                        · <i class="fa ${status_visibility_ico}" title="${status.visibility}"></i>
                        · <a class="detailed-status__link" href="${link_href}/reblogs">
                        <i class="fa fa-retweet"></i>
                        <span class="detailed-status__reblogs"><span class="animated-number"><span>${status.reblogs_count}</span></span></span></a>
                        · <a class="detailed-status__link" href="${link_href}/favourites"><i class="fa fa-star"></i><span class="detailed-status__favorites"><span class="animated-number"><span>${status.replies_count}</span></span></span></a>
                    </div>`;
                    $(quote_status).append(`<div class="status-card__content">${title_html}${status.content}${status_meta_html}</div></a>`);

                    // Remove all other links to this post from the same post containing the link.
                    // Also prevent accidentally filtering out quotes.
                    $(link).parents(".detailed-status").not(".quote-status").find("a").each(function(){
                        if ($(this).prop("href") == url) {
                            $(this).remove();
                        }
                    });
                    return;
                }
            }
        }
    }
}

$('document').ready(function() {
    let masto_root = $("#mastodon");
    if (masto_root.length != 1) {
        // Do not enable on non-mastodon pages (only works from v4.0 onwards)
        return;
    }

    setInterval(function(){
        $(".status-link").not(".mention").not(".quote-status .status-link").each(function(){
            const DATA_ADDED_KEY = "jreich_markup_added";
            if ($(this).data(DATA_ADDED_KEY) != true) {
                $(this).data(DATA_ADDED_KEY, true);
                addPostPreview(this);
            }
        });
    }, TICK_RATE_MS);

    GM_addStyle(`
        .quote-status:hover {
            text-decoration: none !important;
        }
        .quote-status__icon {
            flex: 0 0 100px;
            position: relative;
            text-align: center;
            font-size: 3em;
            padding-top: 1em;
            min-height: 1.2em;
        }
        .quote-status .status-card__image {
            height: min-content;
            margin: 20px 8px 20px 14px;
        }
        .quote-status p {
            font-size: .9em;
            color: #9baec8;
        }
        .quote-status .detailed-status__meta a {
            color: inherit;
        }
    `);
});
