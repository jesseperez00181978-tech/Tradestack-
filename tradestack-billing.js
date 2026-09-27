(() => {
  'use strict';

  const AI_BASE='https://tradestack-bice.vercel.app';
  const AI_ENDPOINT=AI_BASE+'/api/tradestack-ai-paid';
  const BILLING_ENDPOINT=AI_BASE+'/api/tradestack-billing';
  const METHOD='https://play.google.com/billing';
  const PACKAGE='com.jesseperez.tradestack';
  const PRODUCTS={
    premium:{id:'tradestack_premium',label:'TradeStack Premium',requiresPremium:false},
    ai:{id:'tradestack_ai',label:'TradeStack AI Add-On',requiresPremium:true}
  };
  const nativeFetch=window.fetch.bind(window);
  const state={
    premium:{item:null,ready:false,busy:false,activeUntil:0,verifiedUntil:0,purchaseToken:''},
    ai:{item:null,ready:false,busy:false,activeUntil:0,verifiedUntil:0,purchaseToken:''}
  };
  let service,connecting,restoringAll;

  window.TRADESTACK_AI_BASE_URL=AI_BASE;
  window.TRADESTACK_AI_ENDPOINT=AI_ENDPOINT;
  let aiMeta=document.querySelector('meta[name="tradestack-ai-endpoint"]');
  if(!aiMeta){aiMeta=document.createElement('meta');aiMeta.name='tradestack-ai-endpoint';document.head.appendChild(aiMeta);}
  aiMeta.content=AI_ENDPOINT;

  const active=kind=>Date.now()<Math.min(state[kind].activeUntil,state[kind].verifiedUntil);

  async function billingApi(body){
    const response=await nativeFetch(BILLING_ENDPOINT,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:{},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(25000)});
    const data=await response.json().catch(()=>({error:'Subscription service is unavailable. Please try again later.'}));
    if(!response.ok) throw Error(data.error||'Subscriptions are being set up. Please try again later.');
    return data;
  }

  async function connect(){
    if(service) return service;
    if(!window.getDigitalGoodsService) throw Error('Open TradeStack installed from Google Play to manage subscriptions.');
    if(!connecting) connecting=window.getDigitalGoodsService(METHOD).then(value=>service=value).finally(()=>{connecting=null;});
    return connecting;
  }

  function syncState(){
    const premiumActive=active('premium');
    const aiActive=active('ai');
    window.TRADESTACK_PREMIUM_ACTIVE=premiumActive;
    window.TRADESTACK_AI_ACTIVE=premiumActive&&aiActive;
    window.dispatchEvent(new CustomEvent('tradestack-premium-change',{detail:{active:premiumActive}}));
    window.dispatchEvent(new CustomEvent('tradestack-ai-access-change',{detail:{active:premiumActive&&aiActive,premiumActive,aiActive}}));
    try{window.TradeStackAI?.configure?.({});}catch{}
    return {premiumActive,aiActive};
  }

  function clearEntitlement(kind){
    state[kind].activeUntil=0;
    state[kind].verifiedUntil=Date.now()+5*60*1000;
    state[kind].purchaseToken='';
    syncState();
    return false;
  }

  function setEntitlement(kind,result,purchaseToken){
    const product=PRODUCTS[kind];
    const valid=result?.active===true&&result.productId===product.id&&Number(result.expiresAt)>Date.now();
    state[kind].activeUntil=valid?Number(result.expiresAt):0;
    state[kind].verifiedUntil=Date.now()+5*60*1000;
    state[kind].purchaseToken=valid?String(purchaseToken||''):'';
    syncState();
    return valid;
  }

  async function verify(kind,purchaseToken){
    const productId=PRODUCTS[kind].id;
    return setEntitlement(kind,await billingApi({productId,purchaseToken}),purchaseToken);
  }

  async function restoreAll(){
    if(restoringAll) return restoringAll;
    restoringAll=(async()=>{
      const purchases=await (await connect()).listPurchases();
      const results={};
      for(const kind of Object.keys(PRODUCTS)){
        const product=PRODUCTS[kind];
        const matching=purchases.filter(p=>p.itemId===product.id&&p.purchaseToken);
        let restored=false;
        for(const purchase of matching){
          try{
            const result=await billingApi({productId:product.id,purchaseToken:purchase.purchaseToken});
            if(result.active===true&&result.productId===product.id&&Number(result.expiresAt)>Date.now()){
              restored=setEntitlement(kind,result,purchase.purchaseToken);
              break;
            }
          }catch{}
        }
        if(!restored) clearEntitlement(kind);
        results[kind]=restored;
      }
      syncState();
      return results;
    })();
    try{return await restoringAll;}finally{restoringAll=null;}
  }

  async function restore(kind){return !!(await restoreAll())[kind];}

  async function prepare(kind){
    const plan=state[kind],product=PRODUCTS[kind];
    plan.ready=false;
    const svc=await connect();
    if(!window.PaymentRequest) throw Error('Google Play checkout is unavailable. Restore purchases is still available.');
    const config=await billingApi();
    const ids=Array.isArray(config.productIds)?config.productIds:[config.productId].filter(Boolean);
    if(config.ready!==true||!ids.includes(product.id)) throw Error(product.label+' is not configured on the subscription server yet.');
    const details=await svc.getDetails([product.id]);
    plan.item=details.find(x=>x.itemId===product.id);
    if(!plan.item?.price||plan.item.subscriptionPeriod!=='P1M') throw Error(product.label+' monthly plan is not available in Google Play yet.');
    plan.ready=true;
    return new Intl.NumberFormat(navigator.language,{style:'currency',currency:plan.item.price.currency}).format(Number(plan.item.price.value));
  }

  async function purchase(kind){
    const plan=state[kind],product=PRODUCTS[kind];
    if(product.requiresPremium&&!active('premium')) throw Error('TradeStack Premium must be active before adding the AI Add-On.');
    if(plan.busy||!plan.ready||active(kind)) throw Error('Please wait for subscription status to finish loading.');
    plan.busy=true;
    let paymentResponse;
    try{
      const request=new PaymentRequest([{supportedMethods:METHOD,data:{sku:product.id}}],{total:{label:product.label,amount:plan.item.price}});
      paymentResponse=await request.show();
      const purchaseToken=paymentResponse.details?.purchaseToken;
      if(!purchaseToken) throw Error('Purchase confirmation is pending. Use Restore purchases to check again.');
      const unlocked=await verify(kind,purchaseToken);
      await paymentResponse.complete(unlocked?'success':'unknown');paymentResponse=null;
      if(!unlocked) throw Error('Your purchase is pending or inactive. Use Restore purchases to check again.');
      return true;
    }catch(error){
      if(paymentResponse) await paymentResponse.complete('unknown').catch(()=>{});
      if(error.name==='AbortError') throw Error('Purchase canceled.');
      throw error;
    }finally{plan.busy=false;}
  }

  const manageLink=productId=>'https://play.google.com/store/account/subscriptions?sku='+encodeURIComponent(productId)+'&package='+encodeURIComponent(PACKAGE);

  function planCard(kind){
    const product=PRODUCTS[kind];
    const description=kind==='premium'?'Premium trades, advanced guides, calculators, and field tools.':'Cloud AI troubleshooting and deeper diagnostic assistance. Requires active TradeStack Premium.';
    return '<section data-plan="'+kind+'" style="padding:14px 0;border-top:1px solid #34444f"><h3 style="margin:0 0 6px">'+product.label+'</h3><p style="margin:0 0 8px">'+description+'</p><p data-price style="font-weight:800"></p><p data-status role="status" aria-live="polite">Checking subscription availability…</p><div class="diag-row"><button data-subscribe disabled>Subscribe</button><button data-restore>Restore purchases</button></div><p><a href="'+manageLink(product.id)+'" target="_blank" rel="noopener">Manage '+(kind==='premium'?'Premium':'AI Add-On')+'</a></p></section>';
  }

  function mount(root){
    root.innerHTML='<p style="margin-top:0">Subscriptions are separate. Premium does not include cloud AI usage.</p>'+planCard('premium')+planCard('ai');
    for(const kind of Object.keys(PRODUCTS)){
      const section=root.querySelector('[data-plan="'+kind+'"]');
      const price=section.querySelector('[data-price]'),status=section.querySelector('[data-status]'),subscribe=section.querySelector('[data-subscribe]'),restoreButton=section.querySelector('[data-restore]');
      const update=()=>{
        const isActive=active(kind),premiumRequired=kind==='ai'&&!active('premium');
        subscribe.disabled=!state[kind].ready||isActive||premiumRequired;
        subscribe.textContent=isActive?(kind==='premium'?'Premium active':'AI Add-On active'):'Subscribe';
        if(premiumRequired&&!isActive) status.textContent='Activate Premium first, then add cloud AI if you want it.';
      };
      const showError=error=>{status.textContent=error.message||'Google Play billing is unavailable. Open the installed Play Store app and try again.';};
      subscribe.onclick=async()=>{
        subscribe.disabled=true;restoreButton.disabled=true;status.textContent='Waiting for Google Play…';
        try{await purchase(kind);status.textContent=kind==='premium'?'Premium is active. Your premium trades and field tools are ready.':'TradeStack AI Add-On is active. Cloud AI troubleshooting is ready.';}
        catch(error){showError(error);}finally{update();restoreButton.disabled=false;}
      };
      restoreButton.onclick=async()=>{
        subscribe.disabled=true;restoreButton.disabled=true;
        try{const restored=await restore(kind);status.textContent=restored?(kind==='premium'?'Premium restored.':'AI Add-On restored.'):'No active '+(kind==='premium'?'Premium':'AI Add-On')+' subscription found for this Google Play account.';}
        catch(error){showError(error);}finally{update();restoreButton.disabled=false;}
      };
      (async()=>{try{price.textContent=await prepare(kind)+' / month';}catch(error){state[kind].ready=false;price.textContent=error.message;}update();})();
    }
    restoreAll().then(()=>{
      for(const kind of Object.keys(PRODUCTS)){
        const section=root.querySelector('[data-plan="'+kind+'"]');if(!section) continue;
        const status=section.querySelector('[data-status]'),subscribe=section.querySelector('[data-subscribe]');
        if(active(kind)) status.textContent=kind==='premium'?'Premium is active.':'AI Add-On is active.';
        else if(kind==='ai'&&!active('premium')) status.textContent='Activate Premium first, then add cloud AI if you want it.';
        else status.textContent='No active subscription found.';
        subscribe.disabled=!state[kind].ready||active(kind)||(kind==='ai'&&!active('premium'));
        subscribe.textContent=active(kind)?(kind==='premium'?'Premium active':'AI Add-On active'):'Subscribe';
      }
    }).catch(()=>{});
  }

  function open(){
    let dialog=document.getElementById('tsPremiumDialog');
    if(!dialog){
      dialog=document.createElement('dialog');dialog.id='tsPremiumDialog';dialog.setAttribute('aria-labelledby','tsPremiumTitle');
      dialog.style.cssText='width:min(92vw,520px);box-sizing:border-box;max-height:85vh;overflow:auto;border:1px solid #40515b;border-radius:16px;background:#101820;color:#f4f7f8;padding:22px;';
      dialog.innerHTML='<h2 id="tsPremiumTitle">TradeStack Plans</h2><p>Your core guides stay free. Premium unlocks advanced content and tools. Cloud AI is a separate add-on.</p><div data-billing></div><form method="dialog"><button style="margin-top:18px;padding:10px 18px">Close</button></form>';
      document.body.appendChild(dialog);
    }
    if(!dialog.open) dialog.showModal();
    mount(dialog.querySelector('[data-billing]'));
  }

  window.TradeStackPremium={active:()=>active('premium'),mount,restore:()=>restore('premium'),open};
  window.TradeStackAIAddOn={active:()=>active('premium')&&active('ai'),restore:()=>restore('ai'),open};

  window.fetch=async function(input,init){
    const url=typeof input==='string'?input:input?.url;
    if(url===AI_ENDPOINT){
      if(!active('premium')||!active('ai')||!state.premium.purchaseToken||!state.ai.purchaseToken){try{await restoreAll();}catch{}}
      if(!active('premium')||!active('ai')||!state.premium.purchaseToken||!state.ai.purchaseToken){
        window.dispatchEvent(new CustomEvent('tradestack-ai-subscription-required'));
        return new Response(JSON.stringify({error:'TradeStack Premium plus the TradeStack AI Add-On is required for cloud AI troubleshooting.',code:'ai_subscription_required'}),{status:402,headers:{'Content-Type':'application/json'}});
      }
      const options={...(init||{})};
      const method=String(options.method||'GET').toUpperCase();
      if(method==='POST'&&typeof options.body==='string'){
        try{const body=JSON.parse(options.body);body.premiumPurchaseToken=state.premium.purchaseToken;body.aiPurchaseToken=state.ai.purchaseToken;options.body=JSON.stringify(body);}catch{}
      }
      return nativeFetch(input,options);
    }
    return nativeFetch(input,init);
  };

  const hub=document.querySelector('.premium-hub-head');
  if(hub){const button=document.createElement('button');button.type='button';button.id='tsPremiumPlans';button.textContent='Premium / AI Plans';button.style.cssText='margin-top:16px;padding:13px 18px;border:1px solid #ffd166;border-radius:10px;background:#ffd166;color:#101820;font-size:16px;font-weight:700;cursor:pointer;';button.onclick=open;hub.appendChild(button);}
  document.addEventListener('click',event=>{const button=event.target.closest('[data-tsai-premium]');if(button){event.preventDefault();event.stopImmediatePropagation();window.TradeStackAI?.close?.();open();}},true);
  window.addEventListener('tradestack-ai-subscription-required',open);
  restoreAll().catch(()=>{});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)restoreAll().catch(()=>{});});
  setInterval(()=>{if(!document.hidden)restoreAll().catch(()=>{});},4*60*1000);
})();

(() => {
  if(document.querySelector('script[data-tradestack-electrical-tools]')) return;
  const script=document.createElement('script');script.src='tradestack-electrical-tools.js';script.defer=true;script.dataset.tradestackElectricalTools='true';document.head.appendChild(script);
})();

(() => {
  if(document.querySelector('script[data-tradestack-landscaping-tools]')) return;
  const script=document.createElement('script');script.src='tradestack-landscaping-tools.js';script.defer=true;script.dataset.tradestackLandscapingTools='true';document.head.appendChild(script);
})();
