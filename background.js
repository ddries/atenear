async function func() {
    const k = M.cfg.sesskey
    const c = document.cookie.split("MoodleSessionate6=")[1].trim()

    let to, tr
    const b = "https://atenea.upc.edu/lib/ajax/service.php"
    const th = 3600 / 2

    const core_session_time_remaining = async () => {
        try {
            const r = await (await fetch(b + "?sesskey=" + k + "&nosessionupdate=true", {
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
    
            return r[0].data.timeremaining;
        } catch(e) {
            return 0
        }
    }

    const core_session_touch = async () => {
        try {
            await fetch(b + "?sesskey=" + k, {
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
            })
        } catch(e) {}
    }

    const log = (t) => { console.log("atenear > " + t) }

    const loop = async () => {
        const t = await core_session_time_remaining()
        tr = t - th

        if (to) {
            log("removing previous timeout...")
            clearTimeout(to)
        }

        log("updating session in " + tr)

        to = setTimeout(async () => {
            log("updating session...")
            await core_session_touch()
            loop()
        }, tr * 1000)

        let ul = document.querySelector("#page-wrapper > nav > div.ml-auto.row > ul.nav.navbar-nav.flex-row-reverse.flex-md-row")
        let ind = document.createElement("div")
        
        ind.innerHTML = "<div style=\"width:10px;height:10px;background-color:green;border-radius:100%;\"></div><span style=\"text-decoration:underline;\">Atenear active</span>"
        ind.style = "display:flex;justify-content:center;align-items:center;gap:3px;"

        ul.prepend(ind)
    }

    log("injected")
    log("got auth c=" + c + ", k=" + k)

    const t = await core_session_time_remaining()
    if (t <= 0) {
        c = ""
        k = ""
        return
    }

    log("remaining_time=" + t)

    if (t < th) {
        log("below threshold, updating...")
        await core_session_touch()
    }

    log("launching loop...")
    loop()

    return { k, c }
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