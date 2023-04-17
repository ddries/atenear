async function func() {
    const k = M.cfg.sesskey
    const c = document.cookie.split("MoodleSessionate6=")[1].trim()

    let to, tr
    const b = "https://atenea.upc.edu/lib/ajax/service.php"

    /* In seconds, threshold to trigger session update */
    /* Max value = 3600 */
    const th = 3600 / 2

    /* In seconds, session update delay */
    /* Max value = 3600 */
    const ri = 15 * 60

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
        let ul = document.querySelector("#page-wrapper > nav > div.ml-auto.row > ul.nav.navbar-nav.flex-row-reverse.flex-md-row")

        if (!ul.innerHTML.includes("Atenear")) {
            let ind = document.createElement("div")
            ind.id = 'atenear-id'
        
            ind.innerHTML = "<div style=\"width:10px;height:10px;background-color:green;border-radius:100%;\"></div><span style=\"text-decoration:underline;\">Atenear active</span>"
            ind.style = "display:flex;justify-content:center;align-items:center;gap:3px;"

            ul.prepend(ind)
        }
    }

    /* Inject inactive status indicator to Atenea */
    const injectInactiveStatus = () => {
        let ul = document.querySelector("#page-wrapper > nav > div.ml-auto.row > ul.nav.navbar-nav.flex-row-reverse.flex-md-row")

        if (ul.innerHTML.includes("Atenear")) {
            document.getElementById("atenear-id").remove()
        }

        let ind = document.createElement("div")
        ind.id = 'atenear-id'
        
        ind.innerHTML = "<div style=\"width:10px;height:10px;background-color:red;border-radius:100%;\"></div><span style=\"text-decoration:underline;\">Atenear OFF, refresh Atenea</span>"
        ind.style = "display:flex;justify-content:center;align-items:center;gap:3px;"

        ul.prepend(ind)
    }

    /* Refresh session wrapper to update status indicator */
    const core_session_touch_wrapper = async () => {
        if ((await core_session_touch()).error) {
            injectInactiveStatus()
        } else {
            injectActiveStatus()
        }
    }

    const log = (t) => { console.log("atenear > " + t) }

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

    if (t < 7200) {
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