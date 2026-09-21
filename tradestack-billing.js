(() => {
  'use strict';
  const ENDPOINT='https://tradestack-bice.vercel.app/api/tradestack-billing';
  const METHOD='https://play.google.com/billing', PRODUCT='tradestack_premium';
  let service, item, ready=false, busy=false, activeUntil=0, verifiedUntil=0;
  const active=()=>Date.now()<Math.min(activeUntil,verifiedUntil);
  async function api(body) {
    const r=await fetch(ENDPOINT,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:{},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(25000)});
    const j=await r.json();
    if(!r.ok) throw Error(j.error||'Subscriptions are being set up. Please try again later.');
    return j;
  }
  async function connect() {
    if(!window.getDigitalGoodsService || !window.PaymentRequest) throw Error('Open TradeStack installed from Google Play to subscribe or restore purchases.');
    service=await window.getDigitalGoodsService(METHOD);
    return service;
  }
  async function verify(token) {
    const j=await api({purchaseToken:token});
    activeUntil=j.active===true&&j.productId===PRODUCT?Number(j.expiresAt)||0:0;
    verifiedUntil=Date.now()+5*60*1000;
    window.dispatchEvent(new CustomEvent('tradestack-premium-change',{detail:{active:active()}}));
    return active();
  }
  async function restore() {
    const purchases=await (await connect()).listPurchases();
    const matching=purchases.filter(p=>p.itemId===PRODUCT);
    if(!matching.length) {activeUntil=0;return false;}
    for(const p of matching) if(await verify(p.purchaseToken)) return true;
    return false;
  }
  async function prepare() {
    ready=false;
    await connect();
    const config=await api();
    if(config.ready!==true || config.productId!==PRODUCT) throw Error('Subscriptions are being set up. Please try again later.');
    const details=await service.getDetails([PRODUCT]);
    item=details.find(x=>x.itemId===PRODUCT);
    if(!item?.price || item.subscriptionPeriod!=='P1M') throw Error('The monthly plan could not be loaded from Google Play. Please try again later.');
    ready=true;
    return new Intl.NumberFormat(navigator.language,{style:'currency',currency:item.price.currency}).format(Number(item.price.value));
  }
  async function purchase() {
    if(busy||!ready||active()) throw Error('Please wait for your subscription status to finish loading.');
    busy=true;
    let response;
    try {
      // Call show directly from the click: preserve browser user activation.
      const request=new PaymentRequest([{supportedMethods:METHOD,data:{sku:PRODUCT}}],{total:{label:'TradeStack Premium',amount:item.price}});
      response=await request.show();
      const token=response.details?.purchaseToken;
      if(!token) throw Error('Purchase confirmation is pending. Use Restore purchases to check again.');
      const unlocked=await verify(token);
      await response.complete(unlocked?'success':'unknown'); response=null;
      if(!unlocked) throw Error('Your purchase is pending or inactive. Use Restore purchases to check again.');
      return true;
    } catch(e) {
      if(response) await response.complete('unknown').catch(()=>{});
      if(e.name==='AbortError') throw Error('Purchase canceled.');
      throw e;
    } finally {busy=false;}
  }
  function mount(root) {
    root.innerHTML='<p id="tsPrice"></p><p>Monthly subscription. Renews automatically until canceled in Google Play.</p><p id="tsBillingStatus" role="status" aria-live="polite">Checking subscription availability…</p><div class="diag-row"><button id="tsSubscribe" disabled>Subscribe</button><button id="tsRestore">Restore purchases</button></div><p><a href="https://play.google.com/store/account/subscriptions?sku=tradestack_premium&amp;package=com.jesseperez.tradestack" target="_blank" rel="noopener">Manage subscription</a></p>';
    const status=root.querySelector('#tsBillingStatus'), sub=root.querySelector('#tsSubscribe'), restoreButton=root.querySelector('#tsRestore');
    const update=()=>{sub.disabled=!ready||active();sub.textContent=active()?'Premium active':'Subscribe';};
    const message=e=>{status.textContent=e.message||'Google Play billing is unavailable. Open the installed Play Store app and try again.';};
    sub.onclick=async()=>{sub.disabled=true;restoreButton.disabled=true;status.textContent='Waiting for Google Play…';try{await purchase();status.textContent='Premium is active. Your extra tools are ready.';}catch(e){message(e);}finally{update();restoreButton.disabled=false;}};
    restoreButton.onclick=async()=>{sub.disabled=true;restoreButton.disabled=true;try{status.textContent=await restore()?'Premium restored. Your extra tools are ready.':'No active Premium subscription found for this Google Play account.';}catch(e){message(e);}finally{update();restoreButton.disabled=false;}};
    (async()=>{try{const price=await prepare();root.querySelector('#tsPrice').textContent=price+' / month';const restored=await restore();status.textContent=restored?'Premium is active.':'Subscribe with your Google Play account.';update();}catch(e){ready=false;message(e);update();}})();
  }
  window.TradeStackPremium={active,mount,restore};
  // A localStorage flag is not proof of payment. Restore from Play after each launch.
  restore().catch(()=>{});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)restore().catch(()=>{});});
  setInterval(()=>{if(!document.hidden)restore().catch(()=>{});},4*60*1000);
})();
