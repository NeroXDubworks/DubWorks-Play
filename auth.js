/*
 * DubWorks Play — Login Google opcional.
 * Chave pública do Supabase, nunca uma chave service_role/secret.
 * O navegador não recebe poderes administrativos; RLS valida todas as ações.
 */
(function(){
  'use strict';
  const SUPABASE_URL = 'https://wmqbnyaygerbmgiyggwi.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_w1tmWOWUaarmBCfM4XVkwg_NjJrVmr_';
  const trigger=document.getElementById('dw-account-trigger');
  const dropdown=document.getElementById('dw-account-menu');
  if(!trigger||!dropdown)return;
  // O botão não depende do CDN para receber cliques. A biblioteca é carregada
  // em paralelo e tem um segundo provedor como contingência.
  let api=null, clientInit=null, authListenerAttached=false, loginBusy=false;
  const sdkUrls=[
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.0',
    'https://unpkg.com/@supabase/supabase-js@2.119.0'
  ];
  function loadSdk(url){
    return new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      script.src=url;script.async=true;script.crossOrigin='anonymous';
      script.onload=()=>window.supabase?.createClient?resolve():reject(new Error('SDK não inicializado'));
      script.onerror=()=>reject(new Error('Falha ao carregar biblioteca de login'));
      document.head.appendChild(script);
    });
  }
  async function ensureClient(){
    if(api)return api;
    if(clientInit)return clientInit;
    clientInit=(async()=>{
      if(!window.supabase?.createClient){
        for(const url of sdkUrls){
          try{await loadSdk(url);break}
          catch(error){console.warn('DubWorks Play: tentativa de carregar autenticação',error)}
        }
      }
      if(!window.supabase?.createClient)throw new Error('SDK do Supabase indisponível');
      api=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{
        auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
      });
      if(!authListenerAttached){
        authListenerAttached=true;
        api.auth.onAuthStateChange(()=>{
          setTimeout(()=>refreshAccount().catch(console.error),0);
        });
      }
      return api;
    })().catch(error=>{clientInit=null;throw error});
    return clientInit;
  }
  let user=null,role='spectator',name='',profileEmail='';
  let catalogBySlug=new Map(),slugById=new Map(),menuVisible=false,epoch=0;
  const roleLabels={spectator:'Espectador',moderator:'Moderador',admin:'Administrador',director:'Diretoria'};
  const remember=(event,message)=>{
    const toast=document.getElementById('toast');
    if(!toast)return;
    toast.textContent=message;toast.classList.add('visible');
    clearTimeout(remember.timeout);
    remember.timeout=setTimeout(()=>toast.classList.remove('visible'),4000);
  };
  const app=()=>window.DubWorksPlay;
  function fillText(selector,text){
    const el=dropdown.querySelector(selector);
    if(el)el.textContent=text;
  }
  function renderAccount(){
    if(user){
      trigger.classList.add('dw-account-signed-in');
      const initial=(name||profileEmail||'DW').trim().slice(0,1).toUpperCase();
      trigger.textContent=initial;
      trigger.title='Minha conta';
      trigger.setAttribute('aria-label','Abrir minha conta DubWorks Play');
      dropdown.innerHTML='<div class="dw-account-identity">'
        +'<span class="dw-account-face" aria-hidden="true">✦</span>'
        +'<strong id="dw-account-name"></strong>'
        +'<small id="dw-account-email"></small>'
        +'<span class="dw-role" id="dw-role"></span></div>'
        +'<div class="dw-account-actions">'
        +'<button type="button" data-dw-go-list>♡ Minha lista</button>'
        +(['admin','director','moderator'].includes(role)?'<button type="button" class="dw-admin-menu-btn" data-dw-backoffice>◈ Painel administrativo</button>':'')
        +(['admin','director'].includes(role)?'<button type="button" data-dw-admin>＋ Publicar episódio pelo Drive</button>':'')
        +'<button type="button" data-dw-signout>Sair da conta</button>'
        +'</div>';
      fillText('#dw-account-name',name||'Conta DubWorks');
      fillText('#dw-account-email',profileEmail);
      fillText('#dw-role',roleLabels[role]||(role==='loading'?'Verificando cargo...':'Não foi possível consultar o cargo'));
      dropdown.querySelector('#dw-role')?.setAttribute('aria-live','polite');
    }else{
      trigger.classList.remove('dw-account-signed-in');
      trigger.innerHTML='<span aria-hidden="true">G</span><span class="dw-signin-label"> Entrar</span>';
      trigger.title='Entrar com Google';
      trigger.setAttribute('aria-label','Entrar com Google');
      dropdown.innerHTML='<div class="dw-account-identity">'
       +'<strong>Entre para a DubWorks ✦</strong>'
       +'<p>Assista sem cadastro. Entre com o Google para salvar suas séries e participar da comunidade.</p>'
       +'</div><div class="dw-account-actions">'
       +'<button type="button" class="dw-google-signin" data-dw-signin>Continuar com Google</button>'
       +'<button type="button" data-dw-dismiss>Continuar como visitante</button></div>';
    }
    dropdown.hidden=!menuVisible;
    trigger.setAttribute('aria-expanded',String(menuVisible));
  }
  function setMenu(open){
    menuVisible=Boolean(open);renderAccount();
  }
  async function fillCatalog(){
    if(!api||catalogBySlug.size)return;
    const {data,error}=await api.from('series').select('id,slug').eq('status','published');
    if(error)throw error;
    catalogBySlug=new Map((data||[]).map(x=>[x.slug,x.id]));
    slugById=new Map((data||[]).map(x=>[x.id,x.slug]));
  }
  async function loadFavorites(accountId){
    await fillCatalog();
    const {data,error}=await api.from('favorites').select('series_id').eq('user_id',accountId);
    if(error)throw error;
    const cloud=new Set((data||[]).map(x=>slugById.get(x.series_id)).filter(Boolean));
    // Uma importação por conta, somente dos favoritos do modo visitante.
    const migrationMark='dw-play-imported-guest:'+accountId;
    if(!localStorage.getItem(migrationMark)){
      const guest=app()?.getGuestFavorites?.()||[];
      const extra=[...new Set(guest)].filter(x=>catalogBySlug.has(x)&&!cloud.has(x));
      if(extra.length){
        const rows=extra.map(slug=>({user_id:accountId,series_id:catalogBySlug.get(slug)}));
        const upsert=await api.from('favorites').upsert(rows,{onConflict:'user_id,series_id'});
        if(upsert.error)throw upsert.error;
        extra.forEach(x=>cloud.add(x));
      }
      localStorage.setItem(migrationMark,'1');
    }
    app()?.applyFavorites?.([...cloud]);
  }
  // Obtém o cargo diretamente do banco protegido, nunca de user_metadata.
  // A interface é atualizada ANTES de buscar favoritos (que podem demorar).
  async function refreshRole(){
    if(!api||!user)return;
    const accountId=user.id, expected=epoch;
    try{
      const {data:profile,error}=await api.from('profiles')
        .select('display_name,role').eq('user_id',accountId).maybeSingle();
      if(expected!==epoch||user?.id!==accountId)return;
      if(error||!profile){
        console.warn('DubWorks Play: falha ao consultar perfil',error);
        role='unavailable';
      }else{
        role=Object.prototype.hasOwnProperty.call(roleLabels,profile.role)?profile.role:'unavailable';
        if(profile.display_name)name=String(profile.display_name).slice(0,80);
      }
    }catch(error){
      if(expected!==epoch||user?.id!==accountId)return;
      console.warn('DubWorks Play: erro de perfil',error);
      role='unavailable';
    }
    renderAccount();
    app()?.refreshEditorControls?.();
    window.DWEngagement?.renderComments?.();
  }
  async function refreshAccount(){
    if(!api)return;
    const expected=++epoch;
    const result=await api.auth.getUser();
    if(expected!==epoch)return;
    const account=result.data?.user;
    if(result.error||!account){
      user=null;role='spectator';name='';profileEmail='';
      app()?.restoreGuestFavorites?.();
      renderAccount();return;
    }
    const changedUser=user?.id!==account.id;
    user=account;profileEmail=account.email||'';
    name=String(account.user_metadata?.full_name||account.user_metadata?.name||'').slice(0,80);
    if(changedUser||role==='unavailable')role='loading';
    renderAccount();
    await refreshRole();
    if(expected!==epoch)return;
    // Não bloqueia a visualização do cargo se o carregamento dos favoritos falhar.
    loadFavorites(account.id).catch(error=>console.warn('Erro ao sincronizar favoritos',error));
  }
  async function login(){
    if(loginBusy)return;
    loginBusy=true;
    setMenu(false);
    trigger.disabled=true;
    trigger.innerHTML='<span aria-hidden="true">G</span><span class="dw-signin-label"> Conectando...</span>';
    try{
      const client=await ensureClient();
      // Escopos básicos de identificação; nenhum acesso ao Drive do espectador.
      const redirectTo=window.location.origin+window.location.pathname;
      const {error}=await client.auth.signInWithOAuth({
        provider:'google',
        options:{redirectTo,queryParams:{prompt:'select_account'}}
      });
      if(error)throw error;
      // O SDK redireciona o navegador. Caso o navegador bloqueie, o botão
      // permanece utilizável para uma nova tentativa.
    }catch(error){
      console.error('DubWorks Play: erro ao iniciar login',error);
      remember(null,'Não foi possível abrir o Google. Verifique a conexão e tente novamente.');
      setMenu(true);
    }finally{
      loginBusy=false;
      trigger.disabled=false;
      renderAccount();
    }
  }
  async function logout(){
    if(!api)return;
    const {error}=await api.auth.signOut();
    if(error){remember(null,'Não foi possível sair. Tente novamente.');return;}
    user=null;role='spectator';name='';profileEmail='';epoch++;
    app()?.restoreGuestFavorites?.();
    setMenu(false);
    remember(null,'Você saiu da sua conta.');
  }
  async function syncFavorite(slug,enabled){
    if(!api||!user)return;
    await fillCatalog();
    const id=catalogBySlug.get(slug);
    if(!id){remember(null,'Série não cadastrada para sincronização.');return;}
    const result=enabled
      ?await api.from('favorites').upsert({user_id:user.id,series_id:id},{onConflict:'user_id,series_id'})
      :await api.from('favorites').delete().eq('user_id',user.id).eq('series_id',id);
    if(result.error){remember(null,'Não foi possível sincronizar sua lista.');throw result.error;}
  }
  window.DWAuth={
    isSignedIn:()=>Boolean(user),
    login,logout,syncFavorite,
    getRole:()=>role,
    getUser:()=>user,
    getClient:()=>api,
    getClientAsync:ensureClient
  };
  trigger.addEventListener('click',()=>{
    if(loginBusy)return;
    // Visitantes entram com um clique; após login, o mesmo botão abre a conta.
    if(!user){login();return}
    setMenu(!menuVisible);
    if(menuVisible)refreshRole().catch(error=>console.warn('DubWorks Play: atualização de cargo',error));
  });
  dropdown.addEventListener('click',event=>{
    const button=event.target.closest('button');
    if(!button)return;
    if(button.hasAttribute('data-dw-signin')){login();return;}
    if(button.hasAttribute('data-dw-signout')){logout();return;}
    if(button.hasAttribute('data-dw-dismiss')){setMenu(false);return;}
    if(button.hasAttribute('data-dw-go-list')){
      setMenu(false);
      document.querySelector('[data-view="favoritos"]')?.click();
      return;
    }
    if(button.hasAttribute('data-dw-backoffice')){
      setMenu(false);
      window.DWAdmin?.open?.();
      return;
    }
    if(button.hasAttribute('data-dw-admin')){
      setMenu(false);
      window.DWDrive?.openAdmin?.();
      return;
    }
  });
  document.addEventListener('click',event=>{
    if(menuVisible&&!dropdown.contains(event.target)&&!trigger.contains(event.target))setMenu(false);
  });
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menuVisible)setMenu(false)});
  renderAccount();
  // Inicialização não bloqueia a interface. O login ainda funciona se
  // o CDN primário estiver lento ou temporariamente indisponível.
  ensureClient()
    .then(()=>refreshAccount())
    .catch(error=>console.warn('DubWorks Play: autenticação ainda não disponível',error));
})();
