/* DubWorks Play — Complementos do painel: home, créditos, denúncias, auditoria e métricas. */
(function(){
'use strict';
const x=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const el=id=>document.getElementById(id);
const formatDate=date=>{try{return new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(new Date(date))}catch{return '—'}};
const filters={available:'Com episódios publicados',production:'Em produção',anime:'Animes',animation:'Desenhos',upcoming:'Em breve',all:'Todo o catálogo',custom:'Seleção manual'};
const defaultSections=[
 {title:'Episódios disponíveis',filter:'available',enabled:true},
 {title:'Em produção na DubWorks',filter:'production',enabled:true},
 {title:'Universo anime',filter:'anime',enabled:true},
 {title:'Desenhos e animações',filter:'animation',enabled:true},
 {title:'Em breve',filter:'upcoming',enabled:true}
];
const reasonLabels={harassment:'Assédio ou ofensa',spam:'Spam',hate:'Discurso de ódio',spoiler:'Spoiler sem aviso',other:'Outro'};
const creditLabels={voice:'Dublagem',editing:'Edição',direction:'Direção',mixing:'Mixagem',translation:'Adaptação/Tradução',production:'Produção',other:'Outros'};
const rolePermitted=r=>['director','admin'].includes(r);
let home={id:'main',featured_slugs:[],sections:defaultSections},series=[],episodes=[],seasons=[],credits=[],selectedEpisode='',reports=[],audit=[],events=[];
let reportFilter='pending',viewToken=0;
const heading=(title,desc,action='')=>'<div class="dw-bo-toolbar"><div><h2>'+x(title)+'</h2><p>'+x(desc)+'</p></div>'+action+'</div>';
const selected=(a,b)=>a===b?'selected':'';
const msg=(label)=>'<div class="dw-suite-empty">'+x(label)+'</div>';
const publicSeries=()=>series.filter(s=>s.status==='published');
const formPart=(name,i,content)=>'<label>'+x(name)+content+'</label>';
function layoutOptions(value){
 return '<option value="">Sem destaque</option>'+publicSeries().map(s=>'<option value="'+x(s.slug)+'" '+selected(s.slug,value)+'>'+x(s.title)+'</option>').join('');
}
function fromForm(){
 const form=el('dw-home-form');if(!form)return;
 home.featured_slugs=[0,1,2].map(i=>String(form.querySelector('[name=hero-'+i+']')?.value||'')).filter(Boolean);
 home.sections=home.sections.map((r,i)=>({
   title:String(form.querySelector('[name=row-title-'+i+']')?.value||'').trim().slice(0,70),
   filter:String(form.querySelector('[name=row-filter-'+i+']')?.value||'all'),
   enabled:!!form.querySelector('[name=row-enabled-'+i+']')?.checked,
   slugs:r.slugs||[]
 }));
}
function drawHome(ctx){
 const c=ctx.content();if(!c)return;
 c.innerHTML=heading('Página inicial','Escolha os destaques e organize as fileiras do streaming. Alterações aparecem no catálogo público.')
 +'<form id="dw-home-form" class="dw-suite-form">'
 +'<section class="dw-suite-panel"><h3>✦ Banners em destaque</h3><p>Selecione até três projetos públicos. A ordem aqui define a sequência do carrossel.</p>'
 +'<div class="dw-suite-grid3">'+[0,1,2].map(i=>formPart('Destaque '+(i+1),i,'<select name="hero-'+i+'">'+layoutOptions(home.featured_slugs[i]||'')+'</select>')).join('')+'</div></section>'
 +'<section class="dw-suite-panel"><div class="dw-suite-head"><div><h3>▤ Fileiras da página inicial</h3><p>Mude os nomes, categorias, visibilidade e ordem das fileiras.</p></div>'
 +'<button type="button" class="dw-bo-secondary" data-suite-add-row="true">＋ Nova fileira</button></div>'
 +'<div class="dw-suite-rowlist">'+home.sections.map((row,i)=>
   '<div class="dw-suite-home-row"><span class="dw-suite-count">'+(i+1)+'</span>'
   +'<input aria-label="Título da fileira '+(i+1)+'" name="row-title-'+i+'" value="'+x(row.title)+'" maxlength="70" placeholder="Título da fileira">'
   +'<select name="row-filter-'+i+'" aria-label="Conteúdo da fileira">'+Object.entries(filters).map(([key,label])=>'<option value="'+key+'" '+selected(row.filter,key)+'>'+label+'</option>').join('')+'</select>'
   +'<label class="dw-suite-check"><input type="checkbox" name="row-enabled-'+i+'" '+(row.enabled?'checked':'')+'> Exibir</label>'
   +'<div class="dw-suite-row-controls"><button type="button" data-suite-move="'+i+'" data-suite-dir="-1" title="Mover para cima" '+(i===0?'disabled':'')+'>↑</button>'
   +'<button type="button" data-suite-move="'+i+'" data-suite-dir="1" title="Mover para baixo" '+(i===home.sections.length-1?'disabled':'')+'>↓</button>'
   +'<button type="button" data-suite-remove="'+i+'" title="Remover fileira">×</button></div>'
   +'</div>').join('')+'</div>'
 +'<p class="dw-suite-help">A seleção manual permite escolher as séries pela lista de identificadores separados por vírgula.</p>'
 +home.sections.map((row,i)=>row.filter==='custom'
   ?'<label class="dw-suite-custom-label">Identificadores da seleção manual — fileira '+(i+1)
     +'<input name="row-slugs-'+i+'" value="'+x((row.slugs||[]).join(', '))+'" placeholder="bunnicula, jujutsu"></label>':'').join('')
 +'</section><div class="dw-suite-actions"><button class="dw-bo-primary" type="submit">✓ Salvar página inicial</button></div></form>';
}
async function loadHome(ctx){
 const [a,b]=await Promise.all([
  ctx.client.from('series').select('id,slug,title,status').order('title'),
  ctx.client.from('home_layout').select('id,featured_slugs,sections').eq('id','main').single()
 ]);
 if(a.error)throw a.error;if(b.error)throw b.error;
 series=a.data||[];
 home={...b.data,sections:Array.isArray(b.data.sections)?b.data.sections:defaultSections};
 if(ctx.check())drawHome(ctx);
}
async function saveHome(ctx){
 if(!rolePermitted(ctx.role))throw Error('Sem permissão.');
 fromForm();
 home.sections=home.sections.map((r,i)=>{
   const text=el('dw-home-form')?.querySelector('[name=row-slugs-'+i+']')?.value;
   return {...r,slugs:r.filter==='custom'?String(text||'').split(',').map(v=>v.trim()).filter(Boolean):[]};
 });
 if(home.sections.some(r=>!r.title||!Object.keys(filters).includes(r.filter)))throw Error('Confira os títulos e categorias das fileiras.');
 if(home.sections.length>15)throw Error('O limite é de 15 fileiras.');
 home.featured_slugs=[...new Set(home.featured_slugs.filter(slug=>publicSeries().some(s=>s.slug===slug)))].slice(0,3);
 const {error}=await ctx.client.from('home_layout')
 .update({featured_slugs:home.featured_slugs,sections:home.sections,updated_at:new Date().toISOString()})
 .eq('id','main');
 if(error)throw error;
 await window.DWFeatures?.refreshHome?.();
 ctx.toast('A página inicial foi atualizada.');
 await ctx.refresh();
}
async function fetchEpisodeOptions(api){
 const [sr,ss,ep]=await Promise.all([
 api.from('series').select('id,title,slug,status').order('title'),
 api.from('seasons').select('id,series_id,season_number,status'),
 api.from('episodes').select('id,season_id,episode_number,title,status').order('episode_number')
 ]);
 if(sr.error)throw sr.error;if(ss.error)throw ss.error;if(ep.error)throw ep.error;
 series=sr.data||[];seasons=ss.data||[];
 episodes=(ep.data||[]).map(ep=>{
  const season=seasons.find(s=>s.id===ep.season_id);
  const serie=season&&series.find(s=>s.id===season.series_id);
  return {...ep,seriesSlug:serie?.slug,seriesTitle:serie?.title||'Outro projeto',
    seasonNumber:season?.season_number||1};
 }).filter(ep=>ep.seriesSlug);
}
const episodeTitle=e=>e.seriesTitle+' · T'+e.seasonNumber+' EP'+e.episode_number+' — '+e.title;
async function creditsByEpisode(ctx,id){
 if(!id){credits=[];return}
 const {data,error}=await ctx.client.from('episode_credits')
 .select('id,episode_id,person_name,character_name,credit_role,visible,display_order').eq('episode_id',id).order('display_order');
 if(error)throw error;credits=data||[];
}
function drawCredits(ctx){
 const list=ctx.content();if(!list)return;
 list.innerHTML=heading('Elenco e créditos','Cadastre os participantes e vincule seus créditos ao episódio correto.')
 +'<label class="dw-suite-select-label">Episódio<select id="dw-suite-episode-select"><option value="">Selecione um episódio</option>'
 +episodes.map(e=>'<option value="'+x(e.id)+'" '+selected(selectedEpisode,e.id)+'>'+x(episodeTitle(e))+'</option>').join('')+'</select></label>'
 +(selectedEpisode?'<div class="dw-suite-two"><section class="dw-suite-panel"><h3>＋ Adicionar crédito</h3>'
   +'<form id="dw-credits-form" class="dw-suite-formgrid"><input type="hidden" name="episode_id" value="'+x(selectedEpisode)+'">'
   +formPart('Nome do participante',0,'<input name="person_name" maxlength="120" required placeholder="Como aparecerá nos créditos">')
   +formPart('Personagem (se houver)',0,'<input name="character_name" maxlength="120" placeholder="Ex.: Bunnicula">')
   +formPart('Função',0,'<select name="credit_role">'+Object.entries(creditLabels).map(([k,v])=>'<option value="'+k+'">'+v+'</option>').join('')+'</select>')
   +formPart('Ordem',0,'<input name="display_order" type="number" value="'+(credits.length*10)+'" min="0" max="100000">')
   +'<label class="dw-suite-check"><input type="checkbox" name="visible" checked> Visível no catálogo</label>'
   +'<button type="submit" class="dw-bo-primary">＋ Adicionar ao elenco</button></form></section>'
   +'<section class="dw-suite-panel"><h3>Créditos cadastrados</h3>'
   +(credits.length?credits.map(c=>'<div class="dw-suite-credit"><div><strong>'+x(c.person_name)+'</strong><small>'+x(creditLabels[c.credit_role]||'Outro')
      +(c.character_name?' · '+x(c.character_name):'')+' · '+(c.visible?'Público':'Oculto')+'</small></div>'
     +'<button type="button" data-suite-delete-credit="'+x(c.id)+'" aria-label="Excluir crédito">×</button></div>').join('')
     :msg('Nenhum participante cadastrado neste episódio.'))+'</section></div>'
 :msg('Escolha um episódio para começar a cadastrar o elenco.'));
}
async function loadCredits(ctx){
 await fetchEpisodeOptions(ctx.client);
 if(!episodes.some(e=>e.id===selectedEpisode))selectedEpisode=episodes[0]?.id||'';
 await creditsByEpisode(ctx,selectedEpisode);
 if(ctx.check())drawCredits(ctx);
}
async function saveCredit(form,ctx){
 if(!rolePermitted(ctx.role))throw Error('Sem permissão.');
 const d=new FormData(form);
 const id=String(d.get('episode_id')||''),name=String(d.get('person_name')||'').trim();
 const creditRole=String(d.get('credit_role')||'voice'),order=Number(d.get('display_order')||0);
 if(!episodes.some(e=>e.id===id)||!name||name.length>120||!creditLabels[creditRole]||!Number.isInteger(order)||order<0||order>100000)throw Error('Dados do crédito inválidos.');
 const payload={episode_id:id,person_name:name,character_name:String(d.get('character_name')||'').trim()||null,credit_role:creditRole,display_order:order,visible:d.has('visible')};
 const {error}=await ctx.client.from('episode_credits').insert(payload);
 if(error)throw error;
 await creditsByEpisode(ctx,id);drawCredits(ctx);ctx.toast('Crédito cadastrado.');
}
async function loadReports(ctx){
 const [{data,error},{data:commentsData,error:commentsError}]=await Promise.all([
 ctx.client.from('comment_reports').select('id,comment_id,reason,details,status,created_at').order('created_at',{ascending:false}).limit(150),
 ctx.client.from('comments').select('id,body').limit(500)
 ]);
 if(error)throw error;if(commentsError)throw commentsError;
 const contentMap=new Map((commentsData||[]).map(c=>[c.id,c.body]));
 reports=(data||[]).map(r=>({...r,commentBody:contentMap.get(r.comment_id)||'Comentário não disponível'}));
 if(ctx.check())drawReports(ctx);
}
function drawReports(ctx){
 ctx.content().innerHTML=heading('Denúncias e segurança','Analise sinalizações feitas por espectadores logados antes de encerrar cada caso.')
 +'<div class="dw-bo-filters">'+['pending','resolved','dismissed','all'].map(v=>'<button type="button" data-suite-report-filter="'+v+'" class="'+(reportFilter===v?'is-active':'')+'">'+
 (v==='pending'?'Pendentes':v==='resolved'?'Resolvidas':v==='dismissed'?'Dispensadas':'Todas')+'</button>').join('')+'</div>'
 +'<div class="dw-suite-cardlist">'+(reports.filter(r=>reportFilter==='all'||r.status===reportFilter).map(r=>
   '<article class="dw-suite-report"><div class="dw-suite-item-top"><strong>'+x(reasonLabels[r.reason]||'Outra razão')+'</strong><span>'+x(r.status)+'</span><time>'+x(formatDate(r.created_at))+'</time></div>'
   +'<blockquote>'+x(r.commentBody)+'</blockquote>'+(r.details?'<p>Observação: '+x(r.details)+'</p>':'')
   +'<div class="dw-bo-inline-actions">'
   +(r.status==='pending'?'<button type="button" data-suite-report-action="'+x(r.id)+'" data-suite-status="resolved">✓ Marcar como resolvida</button>'
     +'<button type="button" data-suite-report-action="'+x(r.id)+'" data-suite-status="dismissed">Dispensar denúncia</button>':'')
   +'</div></article>').join('')||msg('Nenhuma denúncia nesta situação.'))+'</div>';
}
async function loadAudit(ctx){
 const {data,error}=await ctx.client.from('audit_events')
 .select('id,actor_id,actor_name,entity_type,entity_id,operation,summary,created_at').order('created_at',{ascending:false}).limit(150);
 if(error)throw error;
 audit=data||[];
 if(!ctx.check())return;
 const labels={series:'Séries',seasons:'Temporadas',episodes:'Episódios',episode_credits:'Créditos',
 home_layout:'Página inicial',comments:'Comentários',comment_reports:'Denúncias',user_roles:'Cargos'};
 ctx.content().innerHTML=heading('Histórico de alterações','Registro automático de edições, publicações, moderações e mudanças de cargos.')
  +'<div class="dw-suite-cardlist">'+(audit.length?audit.map(row=>'<div class="dw-suite-audit"><span class="dw-suite-audit-icon">'+
  (row.operation==='INSERT'?'＋':row.operation==='UPDATE'?'✎':'×')+'</span><div><strong>'+
   x(labels[row.entity_type?.split('.')[1]]||row.entity_type)+'</strong>'
   +'<small>'+x(row.operation==='INSERT'?'Cadastrado':row.operation==='UPDATE'?'Alterado':'Excluído')+
   ' · '+x(row.summary||'Registro')+'</small></div><div class="dw-suite-audit-meta"><time>'+x(formatDate(row.created_at))+'</time><small>'+
   (row.actor_name?x(row.actor_name):(row.actor_id?'Usuário da equipe':'Sistema'))+'</small></div></div>').join('')
   :msg('As próximas alterações administrativas serão registradas aqui.'))+'</div>'
  +'<p class="dw-bo-footnote">O histórico começa a contar a partir da ativação desta funcionalidade e não inclui o conteúdo integral dos comentários nem chaves do Google Drive.</p>';
}
async function loadAnalytics(ctx){
 const since=new Date(Date.now()-30*86400000).toISOString();
 const [eventsRes,likesRes,seriesRes,commentsRes]=await Promise.all([
   ctx.client.from('site_events').select('event_type,series_id,created_at').gte('created_at',since).order('created_at',{ascending:false}).limit(4000),
   ctx.client.from('episode_like_counts').select('episode_id,likes_count'),
   ctx.client.from('series').select('id,title'),
   ctx.client.from('comments').select('id',{head:true,count:'exact'}).eq('status','approved')
 ]);
 for(const r of [eventsRes,likesRes,seriesRes,commentsRes])if(r.error)throw r.error;
 events=eventsRes.data||[];
 const seriesName=new Map((seriesRes.data||[]).map(s=>[s.id,s.title]));
 const metrics=[
  ['Aberturas de séries','series_open','▣'],
  ['Aberturas de episódios','episode_open','▶'],
  ['Inícios registrados','video_play','▷'],
  ['Conclusões declaradas','episode_completed','✓']
 ];
 const counts=Object.fromEntries(metrics.map(([label,event])=>[event,events.filter(x=>x.event_type===event).length]));
 const top=new Map();
 for(const e of events)if(e.event_type==='series_open'&&e.series_id)top.set(e.series_id,(top.get(e.series_id)||0)+1);
 const items=[...top.entries()].sort((a,b)=>b[1]-a[1]).slice(0,10);
 const max=items[0]?.[1]||1;
 const likes=(likesRes.data||[]).reduce((sum,row)=>sum+(row.likes_count||0),0);
 if(!ctx.check())return;
 ctx.content().innerHTML=heading('Estatísticas reais','Eventos registrados durante os últimos 30 dias. Não equivalem a espectadores únicos nem a visualizações confirmadas no Google Drive.')
 +'<div class="dw-bo-kpi-grid">'+metrics.map(([label,k,icon])=>'<div class="dw-bo-kpi"><span class="dw-bo-kpi-icon">'+icon+'</span>'
  +'<strong>'+x(counts[k]||0)+'</strong><span>'+x(label)+'</span></div>').join('')
  +'<div class="dw-bo-kpi"><span class="dw-bo-kpi-icon">♡</span><strong>'+x(likes)+'</strong><span>Curtidas no catálogo</span></div>'
  +'<div class="dw-bo-kpi"><span class="dw-bo-kpi-icon">☏</span><strong>'+x(commentsRes.count||0)+'</strong><span>Comentários aprovados (total)</span></div></div>'
 +'<section class="dw-suite-panel"><h3>Projetos mais abertos</h3><p>Eventos de navegação de pessoas que aceitaram as estatísticas anônimas.</p>'
 +(items.length?items.map(([id,count])=>'<div class="dw-suite-barrow"><span>'+x(seriesName.get(id)||'Projeto')+'</span>'
   +'<div><span style="width:'+Math.max(5,Math.round(count/max*100))+'%"></span></div><strong>'+count+'</strong></div>').join('')
   :msg('Ainda não existem eventos de navegação consentidos nesta janela.'))
 +'</section><p class="dw-bo-footnote">Os eventos podem ser bloqueados pelo navegador, e não são uma contagem de pessoas únicas. O Drive não fornece a porcentagem assistida ao nosso player.</p>';
}
const api={
 formIds:['dw-home-form','dw-credits-form'],
 async load(tab,ctx){
   if(tab==='home')return loadHome(ctx);
   if(tab==='credits')return loadCredits(ctx);
   if(tab==='reports')return loadReports(ctx);
   if(tab==='audit')return loadAudit(ctx);
   if(tab==='analytics')return loadAnalytics(ctx);
 },
 async onSubmit(form,ctx){
   if(form.id==='dw-home-form')return saveHome(ctx);
   if(form.id==='dw-credits-form')return saveCredit(form,ctx);
 },
 async onClick(button,ctx){
   if(button.dataset.suiteAddRow!==undefined){
     fromForm();if(home.sections.length>=15){ctx.toast('Limite de 15 fileiras.',true);return true}
     home.sections.push({title:'Nova fileira',filter:'all',enabled:true});drawHome(ctx);return true;
   }
   if(button.dataset.suiteMove!==undefined){
     fromForm();const i=Number(button.dataset.suiteMove),j=i+Number(button.dataset.suiteDir);
     if(j>=0&&j<home.sections.length)[home.sections[i],home.sections[j]]=[home.sections[j],home.sections[i]];
     drawHome(ctx);return true;
   }
   if(button.dataset.suiteRemove!==undefined){
     fromForm();home.sections.splice(Number(button.dataset.suiteRemove),1);drawHome(ctx);return true;
   }
   if(button.dataset.suiteDeleteCredit){
     if(!rolePermitted(ctx.role))return true;
     if(!window.confirm('Remover este crédito dos registros do episódio?'))return true;
     const {error}=await ctx.client.from('episode_credits').delete().eq('id',button.dataset.suiteDeleteCredit);
     if(error)throw error;
     await ctx.refresh();ctx.toast('Crédito removido.');return true;
   }
   if(button.dataset.suiteReportFilter){
     reportFilter=button.dataset.suiteReportFilter;drawReports(ctx);return true;
   }
   if(button.dataset.suiteReportAction){
     if(!['pending','resolved','dismissed'].includes(button.dataset.suiteStatus))return true;
     const {error}=await ctx.client.from('comment_reports').update({
       status:button.dataset.suiteStatus,
       resolved_at:new Date().toISOString()
     }).eq('id',button.dataset.suiteReportAction);
     if(error)throw error;
     await ctx.refresh();ctx.toast('Denúncia analisada.');return true;
   }
   return false;
 },
 onChange(e,ctx){
   if(e.target.id==='dw-suite-episode-select'){
      selectedEpisode=e.target.value;
      creditsByEpisode(ctx,selectedEpisode).then(()=>drawCredits(ctx)).catch(error=>ctx.toast(error.message,true));
      return true;
   }
   if(e.target.matches?.('[name^="row-filter-"]')){
      fromForm();drawHome(ctx);return true;
   }
   return false;
 },
 onInput(){return false}
};
window.DWAdminExtras=api;
})();
