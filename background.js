async function func() {
    let k = ""
    let c = ""

    let to, tr
    const b = "https://atenea.upc.edu/lib/ajax/service.php"

    /* In seconds, threshold to trigger session update */
    /* Max value = 3600 */
    const th = 3600 / 2

    /* In seconds, session update delay */
    /* Max value = 3600 */
    const ri = 15 * 60

    /* Refresh cookie and sess keys */
    const refresh_keys = () => {
        k = M.cfg.sesskey
        c = document.cookie.split("MoodleSessionate6=")[1].trim()
    }

    /* Get session time remaining */
    /* Current session must be valid */
    const core_session_time_remaining = async () => {
        try {
            const r = await (await fetch(b + "?sesskey=" + k, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Cookie": "MoodleSessionate6=" + c
                },
        
                body: JSON.stringify([{
                    index: 0,
                    methodname: "core_session_time_remaining",
                    args: {}
                }])
            })).json()
    
            return r[0].data.timeremaining
        } catch(e) {
            return 0
        }
    }

    /* Update current session */
    /* Current session must be valid */
    const core_session_touch = async () => {
        try {
            const r = await (await fetch(b + "?sesskey=" + k, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Cookie": "MoodleSessionate6=" + c
                },
    
                body: JSON.stringify([{
                    index: 0,
                    methodname: "core_session_touch",
                    args: {}
                }])
            })).json()
            return { error: r[0].error }
        } catch(e) {}
    }

    /* Inject active status indicator to Atenea */
    const injectActiveStatus = () => {
        let nav = document.querySelector("#page-wrapper > nav.navbar")

        if (!nav.innerHTML.includes("Atenear")) {
            let div = document.createElement("div")
            div.id = 'atenear-id'
            div.classList.add("mr-auto")
            div.classList.add("ml-auto")

            div.innerHTML = "<a role=\"menuitem\" target=\"_blank\" href=\"https://www.driescode.dev/atenear\" tabindex=\"-1\">Atenear</a><span style=\"font-size:12px;background-color:green;color:white;border-radius:40%;padding:3px;\">ON</span>"
            div.style = "display:flex;justify-content:center;align-items:center;gap:8px;"

            nav.insertBefore(div, nav.children.item(nav.children.length - 1))
        }
    }

    /* Inject inactive status indicator to Atenea */
    const injectInactiveStatus = () => {
        let nav = document.querySelector("#page-wrapper > nav.navbar")

        if (nav.innerHTML.includes("Atenear")) {
            document.getElementById("atenear-id").remove()
        }

        let div = document.createElement("div")
        div.id = 'atenear-id'
        div.classList.add("mr-auto")
        div.classList.add("ml-auto")

        div.innerHTML = "<a role=\"menuitem\" target=\"_blank\" href=\"https://www.driescode.dev/atenear\" tabindex=\"-1\">Atenear</a><span style=\"font-size:12px;background-color:red;color:white;border-radius:40%;padding:3px;\">OFF</span> (Refresh Page)"
        div.style = "display:flex;justify-content:center;align-items:center;gap:8px;"

        nav.insertBefore(div, nav.children.item(nav.children.length - 1))
    }

    /* Refresh session wrapper to update status indicator */
    const core_session_touch_wrapper = async () => {
        if ((await core_session_touch()).error) {
            injectInactiveStatus()
        } else {
            injectActiveStatus()
            refresh_keys()
        }
    }

    const log = (t) => { console.log("atenear > " + t) }

    refresh_keys()

    log("injected")
    log("got auth c=" + c + ", k=" + k)

    const t = await core_session_time_remaining()

    /* Current session is already expired */
    if (t <= 0) {
        c = ""
        k = ""
        return
    }

    log("remaining_time=" + t)

    if (t < th) {
        log("below threshold, updating...")
        await core_session_touch_wrapper()
    }

    log("safe session age value")
    injectActiveStatus()

    /* At this point, we can be sure we are in a safe session age value */
    /* Create an interval which will trigger session update at given rate */
    to = setInterval(async () => {
        log("updating session...")
        await core_session_touch_wrapper()
    }, ri * 1000);
}

chrome.runtime.onMessage.addListener(async function(req, sender, sendResponse) {
    if (req.type == "loaded") {
        chrome.scripting.executeScript({
            target: { tabId: sender.tab.id },
            world: "MAIN",
            func
        }).catch(e => { console.error(e) })
    }
});