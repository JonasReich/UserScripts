// ==UserScript==
// @name         Mastodon - Go Home
// @namespace    https://github.com/JonasReich/
// @version      0.2
// @description  Inject a "Go Home" button into all mastodon pages that redirects you to the mastodon instance in gamedev.place
// @author       Jonas Reich
// @match        *://*/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=mastodon.social
// @updateURL    https://github.com/JonasReich/UserScripts/raw/main/Mastodon/mastodon_go_home.user.js
// @downloadURL  https://github.com/JonasReich/UserScripts/raw/main/Mastodon/mastodon_go_home.user.js
// @require      https://ajax.googleapis.com/ajax/libs/jquery/3.6.1/jquery.min.js
// @require      https://gist.github.com/raw/2625891/waitForKeyElements.js
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// ==/UserScript==

// Based on user script by DiThi in https://github.com/rugk/mastodon-simplified-federation/issues/77#issuecomment-1328265632

'use strict';

// PUT YOUR INSTANCE BELOW
const INSTANCE = 'mastodon.gamedev.place';
const MASTO_REMOTE_POST_URL_KEY = "mastodon-remote-url";
const MASTO_REMOTE_USER_ID_KEY = "masto-user-url";

function gotoMyInstance(){
    console.debug(location.href);
    let parts = location.href.split('/').splice(0,5);
    console.debug(parts);
    if(parts[3].indexOf('@',1) === -1) {
        parts[3] += '@'+parts[2];
    }
    let remote_user_id = parts[3];
    parts[2] = INSTANCE;
    if (parts.length >= 5) {
        // This is a post. Need to store some extra info, so we can redirect to proper ID once we are in our home instance.
        // We can't do this from the remote instance, because it can't access home instance API.
        GM_setValue(MASTO_REMOTE_POST_URL_KEY, location.href);
        GM_setValue(MASTO_REMOTE_USER_ID_KEY, remote_user_id);
        // replace the post ID with something that makes it a bit more clear that this is not the final URL
        parts[4] = "wait-for-userscript-redirect";
    } else {
        // URL is to a user profile/etc
        // redirect immediately
    }
    location.href = parts.join('/');
}

function openRemoteUrlInHomeInstance(remote_url, remote_user_id){
    if (remote_url === undefined) {
        return;
    }

    // If we were redirected from a remote instance, search for the local copy of that post.
    // When found, redirect to the local copy.
    var xhttp = new XMLHttpRequest();
    xhttp.open("GET", `https://${INSTANCE}/api/v2/search?q=${encodeURI(remote_url)}&resolve=true`, true);
    xhttp.send();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            if (this.status == 200) {
                var obj = JSON.parse(this.responseText);
                // posts are called "statuses" in mastodon API
                let statuses = obj.statuses;
                if (statuses.length > 0)
                {
                    let local_id = statuses[0].id;
                    location.href = `https://${INSTANCE}/${remote_user_id}/${local_id}`;
                    return;
                }
            }
        }
    }
}

function disableElementsWithClass(class_name, hide) {
    let elements_to_disable = document.getElementsByClassName(class_name);
    for (let i = 0; i < elements_to_disable.length; i++) {
        if (hide) {
            elements_to_disable[i].setAttribute("style","width:0;height:0;");
            elements_to_disable[i].style.visibility = "collapse";
        } else {
            // disable
            elements_to_disable[i].disabled = true;
            elements_to_disable[i].classList.add("disabled");
        }
    }
}

function hideAndDisableTick() {
    disableElementsWithClass("sign-in-banner", true);
    // sign in bar in mobile / small mode
    disableElementsWithClass("ui__header__links", true);
    disableElementsWithClass("account__header__tabs__buttons", false);
    // This is the follow button in a profile
    disableElementsWithClass("logo-button", false);
    disableElementsWithClass("status__action-bar__button icon-button", false);
}

function injectButtonAfter(elment_class){
    let button_id = `jreich-masto-inject-btn-${elment_class}`
    document.getElementsByClassName(elment_class)[0].insertAdjacentHTML("beforeend", `<div style="padding:10px;"><a id="${button_id}" class="button button--block"><span>🏠 ${INSTANCE}</span></a></div>`);
    let inject_button = document.getElementById(button_id);
    // set this dynamically to have access to namespace here.
    inject_button.onclick = function(){ gotoMyInstance(); }
}

$('document').ready(function() {
    let masto_root = $("#mastodon");
    if (masto_root.length != 1) {
        // Do not enable on non-mastodon pages (only works from v4.0 onwards)
        return;
    }
    if (location.href.split('/').splice(0,4).join('/').includes(INSTANCE)) {
        let remote_url = GM_getValue(MASTO_REMOTE_POST_URL_KEY);
        GM_deleteValue(MASTO_REMOTE_POST_URL_KEY);
        let user_id = GM_getValue(MASTO_REMOTE_USER_ID_KEY);
        GM_deleteValue(MASTO_REMOTE_USER_ID_KEY);

        openRemoteUrlInHomeInstance(remote_url, user_id);

        // Do not enable other features on home-instance
        return;
    }

    // Add go home button
    waitForKeyElements("div.ui__header", function(){
        injectButtonAfter("ui__header");
    });
    waitForKeyElements("div.navigation-panel__sign-in-banner", function(){
        injectButtonAfter("navigation-panel__sign-in-banner");
    });
    waitForKeyElements("div.public-account-header__tabs__tabs__buttons", function(){
        injectButtonAfter("public-account-header__tabs__tabs__buttons");
    });

    // Hide login buttons etc every 0.1s (to ensure buttons in dynamically loaded content are disabled/hidden as well)
    setInterval(hideAndDisableTick, 100);
});
