/* DubWorks Play — experiência opcional do espectador e privacidade. */
(function(){
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const el=id=>document.getElementById(id);
const roleNames={voice:'Dublagem',editing:'Edição',direction:'Direção',mixing:'Mixagem',translation:'Tradução',production:'Produção',other:'Outros'};
const reasonNames={harassment:'Ofensa ou assédio',spam:'Spam',hate:'Discurso de ódio',spoiler:'Spoiler',other:'Outro motivo'};
let client=null,seriesBySlug=new Map(),seriesById=new Map(),creditsRequest=0,socialRequest=0,likes=null,lastProgress=0;
const current=()=>window.DubWorksPlay?.getCurrentEpisode?.()||null;
const user=()=>window.DWAuth?.getUser?.()||null;
const alertMsg=msg=>{const t=el('toast');if(t){t.textContent=msg;t.classList.add('visible');setTimeout(()=>t.classList.remove('visible'),3700)}};
async function api(){
 if(client)return client;
 const value=await window.DWAuth?.getClientAsync?.();
 if(!value)throw Error('Não foi possível conectar ao serviço de conta.');
 client=value;return client;
}
async function fetchSeries(){
 const db=await api();
 const {data,error}=await db.from('series').select('id,slug,title,status').eq('status','published');
 if(error)throw error;
 seriesBySlug=new Map((data||[]).map(s=>[s.slug,s]));
 seriesById=new Map((data||[]).map(s=>[s.id,s]));
}
async function refreshHome(){
 const db=await api();
 const {data,error}=await db.from('home_layout').select('id,featured_slugs,sections').eq('id','main').maybeSingle();
 if(error)throw error;
 window.DubWorksPlay?.applyHomeLayout?.(data);
 await fetchSeries();
}
const consent=()=>{try{return localStorage.getItem('dw-play-stats-consent')||''}catch{return ''}};
function setConsent(val){
 if(!['yes','no'].includes(val))return;
 try{localStorage.setItem('dw-play-stats-consent',val)}catch{}
 el('dw-cookie-prompt')?.remove();
}
function renderCookiePrompt(force=false){
 el('dw-cookie-prompt')?.remove();
 if(!force&&consent())return;
 document.body.insertAdjacentHTML('beforeend',
  '<div id="dw-cookie-prompt" class="dw-cookie-prompt" role="region" aria-label="Permissão de cookies">'
  +'<span class="dw-cookie-label">🍪 Você permite cookies?</span>'
  +'<div class="dw-cookie-buttons"><button type="button" data-dw-cookie-consent="no">Não permitir</button>'
  +'<button type="button" data-dw-cookie-consent="yes">Permitir</button></div>'
  +'</div>');
}
function consentDialog(){renderCookiePrompt(true)}
function onceKey(type,slug,epid){
 const path=slug||epid||'site';
 return 'dw-visit:'+type+':'+path+':'+(epid||'');
}
async function track(type,slug,episodeId){
 if(consent()!=='yes')return;
 if(!['series_open','episode_open','video_play','episode_completed','favorite_added'].includes(type))return;
 try{
  if(seriesBySlug.size===0)await fetchSeries();
  const series=seriesBySlug.get(slug);
  if(!series)return;
  const storageKey=onceKey(type,slug,episodeId);
  try{if(sessionStorage.getItem(storageKey)==='1')return}catch{}
  if(['episode_open','video_play','episode_completed'].includes(type)&&!episodeId)return;
  const payload={event_type:type,series_id:['episode_open','video_play','episode_completed'].includes(type)?null:series.id,
    episode_id:['episode_open','video_play','episode_completed'].includes(type)?episodeId:null};
  const {error}=await (await api()).from('site_events').insert(payload);
  if(error)throw error;
  try{sessionStorage.setItem(storageKey,'1')}catch{}
 }catch(error){console.warn('DubWorks Play: evento estatístico não registrado',error)}
}
async function creditsFor(ids){
 if(!ids.length)return [];
 const {data,error}=await (await api()).from('episode_credits')
   .select('id,episode_id,person_name,character_name,credit_role,display_order')
   .in('episode_id',ids).eq('visible',true).order('display_order').limit(180);
 if(error)throw error;
 return data||[];
}
function creditCards(rows){
 if(!rows.length)return '<p class="dw-suite-empty">A equipe ainda não cadastrou os créditos deste episódio.</p>';
 return '<div class="dw-public-credits-grid">'+rows.map(c=>'<article class="dw-public-credit"><span class="dw-credit-avatar">✦</span><div><strong>'+esc(c.person_name)+'</strong>'
  +'<small>'+esc(roleNames[c.credit_role]||'Equipe')+(c.character_name?' • '+esc(c.character_name):'')+'</small></div></article>').join('')+'</div>';
}
async function renderProjectCredits(slug){
 const host=el('dw-project-credits');if(!host)return;
 const token=++creditsRequest;
 host.innerHTML='<h2>Por trás das vozes ✦</h2><p>Carregando o elenco...</p>';
 try{
  const db=await api();
  const s=seriesBySlug.get(slug);
  const serie=s||((await db.from('series').select('id,slug,title').eq('slug',slug).maybeSingle()).data);
  if(!serie){host.innerHTML='<p>Projeto indisponível.</p>';return}
  const {data:seasons,error}=await db.from('seasons').select('id').eq('series_id',serie.id).eq('status','published');
  if(error)throw error;
  const seasonIds=(seasons||[]).map(x=>x.id);
  if(!seasonIds.length){host.innerHTML='<h2>Elenco e créditos</h2>'+creditCards([]);return}
  const {data:episodes,error:epError}=await db.from('episodes').select('id')
    .in('season_id',seasonIds).eq('status','published');
  if(epError)throw epError;
  const entries=await creditsFor((episodes||[]).map(e=>e.id));
  if(token!==creditsRequest||!el('dw-project-credits'))return;
  const distinct=new Map(entries.map(c=>[c.person_name+'|'+c.credit_role+'|'+(c.character_name||''),c]));
  el('dw-project-credits').innerHTML='<h2>Elenco e equipe ✦</h2><p>Créditos cadastrados dos episódios publicados.</p>'+creditCards([...distinct.values()]);
 }catch(error){console.warn(error);if(token===creditsRequest&&el('dw-project-credits'))el('dw-project-credits').textContent='Não foi possível carregar os créditos.'}
}
async function episodeCredits(epId){
 const host=el('dw-episode-credits');if(!host)return;
 if(!epId){host.innerHTML='';return}
 try{
  const data=await creditsFor([epId]);
  if(!el('dw-episode-credits')||current()?.dbId!==epId)return;
  host.innerHTML='<h2>Elenco e créditos</h2>'+creditCards(data);
 }catch(error){console.warn(error);if(el('dw-episode-credits'))host.textContent='Não foi possível carregar o elenco.'}
}
async function renderEpisode(){
 const host=el('dw-episode-social'),ep=current();
 if(!host)return;
 const token=++socialRequest;
 if(!ep?.published||!ep.dbId){host.innerHTML='<p>As interações serão liberadas quando o episódio estiver publicado.</p>';return}
 await episodeCredits(ep.dbId);
 if(token!==socialRequest||!el('dw-episode-social'))return;
 const db=await api();
 const account=user();
 try{
  const req=[db.from('episode_like_counts').select('likes_count').eq('episode_id',ep.dbId).maybeSingle()];
  if(account){
   req.push(db.from('episode_likes').select('episode_id').eq('episode_id',ep.dbId).eq('user_id',account.id).maybeSingle());
   req.push(db.from('watch_progress').select('completed,position_seconds').eq('episode_id',ep.dbId).eq('user_id',account.id).maybeSingle());
  }
  const r=await Promise.all(req);
  for(const result of r)if(result.error)throw result.error;
  if(token!==socialRequest||current()?.dbId!==ep.dbId)return;
  likes={episodeId:ep.dbId,liked:!!r[1]?.data,completed:!!r[2]?.data?.completed,likeCount:Number(r[0].data?.likes_count||0)};
  const progress=r[2]?.data?.position_seconds||0;
  if(progress&&!likes.completed)window.DubWorksPlay?.applyCloudPlaybackPosition?.(progress);
  host.innerHTML='<div class="dw-social-card"><div class="dw-social-intro"><span>✦ PARTICIPE DA COMUNIDADE</span>'
    +'<h2>O que achou deste episódio?</h2>'
    +'<p>Curta, marque como assistido e continue de onde parou na sua conta Google.</p></div>'
    +'<div class="dw-social-actions"><button type="button" data-dw-like="true" class="'+(likes.liked?'is-active':'')+'">'
    +(likes.liked?'♥ Curtido':'♡ Curtir')+' <small>'+likes.likeCount+'</small></button>'
    +'<button type="button" data-dw-watched="true" class="'+(likes.completed?'is-active':'')+'">'
    +(likes.completed?'✓ Assistido':'◯ Marcar como assistido')+'</button>'
    +'<button type="button" data-dw-history="true">◷ Histórico</button></div>'
    +(account?'':'<p class="dw-social-hint">Para salvar suas escolhas, entre com sua conta Google. Assistir não exige login.</p>')
    +'</div>';
 }catch(error){
  console.warn('DubWorks Play: curtidas/histórico',error);
  if(el('dw-episode-social'))host.innerHTML='<p>As opções de conta estão temporariamente indisponíveis.</p>';
 }
}
async function toggleLike(){
 const ep=current();if(!ep?.dbId)return;
 const account=user();
 if(!account){window.DWAuth?.login?.();return}
 const db=await api();
 const active=!!likes?.liked;
 const req=active?db.from('episode_likes').delete().eq('user_id',account.id).eq('episode_id',ep.dbId)
  :db.from('episode_likes').insert({user_id:account.id,episode_id:ep.dbId});
 const {error}=await req;if(error){alertMsg('Não foi possível registrar sua curtida.');return}
 await renderEpisode();
}
async function markWatched(done=true){
 const ep=current(),account=user();
 if(!account){window.DWAuth?.login?.();return}
 if(!ep?.dbId)return;
 const db=await api();
 const payload={user_id:account.id,episode_id:ep.dbId,completed:done,position_seconds:done?0:lastProgress,updated_at:new Date().toISOString()};
 const {error}=await db.from('watch_progress').upsert(payload,{onConflict:'user_id,episode_id'});
 if(error){alertMsg('Não foi possível salvar seu histórico.');return}
 if(done)track('episode_completed',ep.slug,ep.dbId);
 await renderEpisode();
}
async function syncTime(seconds){
 const account=user(),ep=current();
 if(!account||!ep?.dbId||likes?.completed||!Number.isFinite(seconds)||seconds<0)return;
 if(seconds===lastProgress)return;
 lastProgress=Math.floor(seconds);
 const {error}=await (await api()).from('watch_progress').upsert({
  user_id:account.id,episode_id:ep.dbId,position_seconds:lastProgress,completed:false,updated_at:new Date().toISOString()
 },{onConflict:'user_id,episode_id'});
 if(error)console.warn('DubWorks Play: não salvou tempo',error);
}
async function finishEpisode(){
 const ep=current(),account=user();
 if(!ep?.dbId)return;
 if(account){
  try{await markWatched(true)}catch(error){console.warn(error)}
 }else{track('episode_completed',ep.slug,ep.dbId)}
}
async function showHistory(){
 const account=user();
 if(!account){window.DWAuth?.login?.();return}
 el('dw-history-modal')?.remove();
 document.body.insertAdjacentHTML('beforeend','<div class="dw-history-modal" id="dw-history-modal" role="dialog" aria-modal="true" aria-label="Meu histórico">'
 +'<div class="dw-history-card"><header><div><span>✦ MINHA DUBWORKS</span><h2>Histórico de episódios</h2></div>'
 +'<button type="button" data-dw-close-history="true" aria-label="Fechar">✕</button></header><div id="dw-history-list">Carregando seu histórico...</div>'
 +'<p>Seus registros ficam vinculados à sua conta Google. Os vídeos do Drive não informam automaticamente o minuto assistido.</p></div></div>');
 try{
  const db=await api();
  const {data,error}=await db.from('watch_progress')
    .select('episode_id,completed,position_seconds,updated_at').eq('user_id',account.id).order('updated_at',{ascending:false}).limit(100);
  if(error)throw error;
  if(!el('dw-history-list'))return;
  if(!data?.length){el('dw-history-list').innerHTML='<p>Você ainda não marcou nenhum episódio como assistido.</p>';return}
  const episodeIds=data.map(x=>x.episode_id);
  const {data:eps,error:epsErr}=await db.from('episodes').select('id,season_id,episode_number,title,status')
   .in('id',episodeIds);
  if(epsErr)throw epsErr;
  const ses=[...new Set((eps||[]).map(x=>x.season_id))];
  const {data:seasons}=ses.length?await db.from('seasons').select('id,series_id,season_number').in('id',ses):{data:[]};
  const serieIds=[...new Set((seasons||[]).map(x=>x.series_id))];
  const {data:titles}=serieIds.length?await db.from('series').select('id,title,slug').in('id',serieIds):{data:[]};
  const em=new Map((eps||[]).map(e=>[e.id,e])),sm=new Map((seasons||[]).map(s=>[s.id,s])),tm=new Map((titles||[]).map(s=>[s.id,s]));
  el('dw-history-list').innerHTML=data.map(row=>{
    const ep=em.get(row.episode_id),se=sm.get(ep?.season_id),series=tm.get(se?.series_id);
    if(!ep||!se||!series)return '';
    return '<button type="button" class="dw-history-episode" data-dw-history-url="'
       +esc('#assistir/'+encodeURIComponent(series.slug)+'/'+se.season_number+'/'+ep.episode_number)+'">'
       +'<span>▶</span><div><strong>'+esc(series.title)+'</strong><small>T'+se.season_number+' • EP '+ep.episode_number+' — '+esc(ep.title)+'</small></div>'
       +'<em>'+(row.completed?'✓ Assistido':row.position_seconds>0?'Em andamento':'Não concluído')+'</em></button>';
  }).join('')||'<p>Não há episódios publicados disponíveis neste histórico.</p>';
 }catch(error){console.error(error);if(el('dw-history-list'))el('dw-history-list').textContent='Não foi possível carregar seu histórico.'}
}
function openReport(commentId){
 const account=user();if(!account){window.DWAuth?.login?.();return}
 if(!/^[a-f0-9-]{30,40}$/i.test(String(commentId)))return;
 el('dw-report-modal')?.remove();
 document.body.insertAdjacentHTML('beforeend','<div class="dw-history-modal" id="dw-report-modal" role="dialog" aria-modal="true" aria-label="Denunciar comentário">'
 +'<form id="dw-report-form" class="dw-history-card dw-report-card"><header><div><span>⚑ MODERAÇÃO</span><h2>Denunciar comentário</h2></div>'
 +'<button type="button" data-dw-close-report="true">✕</button></header>'
 +'<input type="hidden" name="comment_id" value="'+esc(commentId)+'">'
 +'<label>Motivo<select name="reason">'+Object.entries(reasonNames).map(([v,name])=>'<option value="'+v+'">'+esc(name)+'</option>').join('')+'</select></label>'
 +'<label>Detalhes opcionais<textarea name="details" maxlength="500" rows="3" placeholder="Conte o que aconteceu, sem expor dados pessoais."></textarea></label>'
 +'<p>Sua denúncia é privada e será analisada pela equipe da DubWorks.</p>'
 +'<button type="submit" class="dw-bo-primary">Enviar denúncia</button><div class="dw-report-msg" id="dw-report-msg" role="status"></div></form></div>');
}
async function submitReport(form){
 const acc=user();if(!acc)throw Error('Faça login antes de denunciar.');
 const f=new FormData(form);
 const reason=String(f.get('reason')||''),commentId=String(f.get('comment_id')||'');
 if(!Object.keys(reasonNames).includes(reason)||!commentId)throw Error('Dados inválidos.');
 const {error}=await (await api()).from('comment_reports')
  .insert({comment_id:commentId,reporter_id:acc.id,reason,details:String(f.get('details')||'').slice(0,500)});
 if(error){
  if(error.code==='23505')throw Error('Você já denunciou este comentário. A equipe poderá analisá-lo.');
  throw error;
 }
 el('dw-report-modal')?.remove();
 alertMsg('Denúncia enviada. Obrigado por ajudar a comunidade.');
}
async function refreshViewer(){
 if(el('dw-episode-social'))renderEpisode().catch(console.warn);
}
document.addEventListener('click',async event=>{
 const btn=event.target.closest('button');
 if(!btn)return;
 try{
  if(btn.dataset.dwLike!==undefined){await toggleLike();return}
  if(btn.dataset.dwWatched!==undefined){await markWatched(!likes?.completed);return}
  if(btn.dataset.dwHistory!==undefined){await showHistory();return}
  if(btn.dataset.dwCloseHistory!==undefined){el('dw-history-modal')?.remove();return}
  if(btn.dataset.dwHistoryUrl){
    el('dw-history-modal')?.remove();window.location.hash=btn.dataset.dwHistoryUrl;return;
  }
  if(btn.dataset.dwReportComment){openReport(btn.dataset.dwReportComment);return}
  if(btn.dataset.dwCloseReport!==undefined){el('dw-report-modal')?.remove();return}
  if(btn.dataset.dwCookieConsent!==undefined){setConsent(btn.dataset.dwCookieConsent);return}
  if(btn.dataset.dwPrivacySettings!==undefined){consentDialog();return}
 }catch(error){console.error('DubWorks Play:',error);alertMsg(error?.message||'Não foi possível executar esta ação.')}
});
document.addEventListener('submit',async event=>{
 if(event.target.id!=='dw-report-form')return;
 event.preventDefault();const btn=event.target.querySelector('[type=submit]');
 if(btn?.disabled)return;if(btn)btn.disabled=true;
 try{await submitReport(event.target)}
 catch(error){const msg=el('dw-report-msg');if(msg)msg.textContent=error.message}
 finally{if(btn?.isConnected)btn.disabled=false}
});
document.addEventListener('keydown',event=>{
 if(event.key!=='Escape')return;
 el('dw-history-modal')?.remove();
 el('dw-report-modal')?.remove();
 el('dw-cookie-prompt')?.remove();
});
window.DWFeatures={refreshHome,renderEpisode,renderProjectCredits,refreshViewer,track,showHistory,finishEpisode,syncTime,openReport,changeStatsPreference:consentDialog};
renderCookiePrompt();
api().then(async()=>{
  try{
    await refreshHome();
    await refreshViewer();
    if(el('dw-project-credits')){
      const route=String(window.location.hash||'').replace(/^#projeto\//,'');
      if(route)renderProjectCredits(decodeURIComponent(route)).catch(console.warn);
    }
  }catch(error){console.warn('DubWorks Play extras',error)}
})
 .catch(error=>console.warn('DubWorks Play: serviço de recursos extras indisponível',error));
})();
