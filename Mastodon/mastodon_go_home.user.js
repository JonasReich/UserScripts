// ==UserScript==
// @name         Go to home mastodon instance
// @namespace    https://github.com/JonasReich/
// @version      0.1
// @description  Inject a "Go Home" button into all mastodon pages that redirects you to the mastodon instance in gamedev.place
// @author       Jonas Reich
// @match        *://*/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=mastodon.social
// @updateURL    https://github.com/JonasReich/UserScripts/raw/main/Mastodon/mastodon_go_home.user.js
// @downloadURL  https://github.com/JonasReich/UserScripts/raw/main/Mastodon/mastodon_go_home.user.js
// @require      https://ajax.googleapis.com/ajax/libs/jquery/3.6.1/jquery.min.js
// @require      https://gist.github.com/raw/2625891/waitForKeyElements.js
// @grant        GM_addStyle
// @grant        GM.getValue
// ==/UserScript==

// Based on user script by DiThi in https://github.com/rugk/mastodon-simplified-federation/issues/77#issuecomment-1328265632

'use strict';

// PUT YOUR INSTANCE BELOW
const INSTANCE = 'mastodon.gamedev.place';

function gotoMyInstance(){
    console.debug(location.href);
    let parts = location.href.split('/').splice(0,5);
    console.debug(parts);
    if(parts[3].indexOf('@',1) === -1) {
        parts[3] += '@'+parts[2];
    }
    parts[2] = INSTANCE;
    if (parts.length >= 5) {
        // URL is to a post
        // not possible to redirect atm
        let text = parts.join('/');
        if (confirm("Cannot redirect to remote posts. You will be redirected to your instance's search instead. Please paste the post URL in to search (copied to your clipboard if you click ok).")) {
            navigator.clipboard.writeText(location.href).then(function() {
                console.log('Async: Copying to clipboard was successful !' + text);
                parts[3] = "search";
                location.href = parts.splice(0,4).join('/');
            }, function(err) {
                console.error('Async: Could not copy text: ' + text, err);
            });
        }
    } else {
        // URL is to a user profile/etc
        // redirect immediately
        location.href = parts.join('/');
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

// vanilla JS equivalent of $('document').ready(function(){});
// see https://stackoverflow.com/a/9899701
function docReady(fn) {
    // see if DOM is already available
    if (document.readyState === "complete" || document.readyState === "interactive") {
        // call on next available tick
        setTimeout(fn, 1);
    } else {
        document.addEventListener("DOMContentLoaded", fn);
    }
}

docReady(function() {
    // DOM is loaded and ready for manipulation here

    let masto_root = $("#mastodon");
    if (masto_root.length != 1) {
        // Do not enable on non-mastodon pages (only works from v4.0 onwards)
        return;
    }
    if (location.href.split('/').splice(0,4).join('/').includes(INSTANCE)) {
        // Do not enable on home-instance
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
