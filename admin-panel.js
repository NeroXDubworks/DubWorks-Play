/* DubWorks Play — Painel central da equipe.
 * Navegação e edição usando a chave pública do Supabase.
 * Toda escrita está protegida pelas políticas RLS e pela role real do usuário.
 */
(function(){
 'use strict';
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
 const byId=id=>document.getElementById(id);
 const roles={director:'Diretoria',admin:'Administrador',moderator:'Moderador',spectator:'Espectador'};
 const labels={overview:'Visão geral',series:'Séries e projetos',episodes:'Temporadas e episódios',comments:'Moderação',users:'Usuários e cargos',settings:'Configurações'};
 const nav=[['overview','layout-dashboard','◈'],['series','clapperboard','▣'],['episodes','list-video','▤'],['comments','message-square','☏'],['users','users','♙'],['settings','settings','⚙']];
 let client=null,actor=null,role='spectator',opened=false,tab='overview',sequence=0,loading=false;
 let series=[],seasons=[],episodes=[],comments=[],people=[],lastFocus=null;
 let seasonFilter='',commentFilter='pending',seriesFilter='all',usersQuery='';
 const onlyDirector=()=>role==='director';
 const editorial=()=>['director','admin'].includes(role);
 const staff=()=>editorial()||role==='moderator';
 const toast=(message,error=false)=>{
   const node=byId('dw-backoffice-feedback');
   if(!node)return;
   node.textContent=message;node.className='dw-bo-feedback '+(error?'is-error':'is-success');
   node.hidden=false;
 };
 const root=()=>byId('dw-backoffice');
 const content=()=>byId('dw-backoffice-content');
 const moneyCount=n=>Number(n||0).toLocaleString('pt-BR');
 const statusLabel=v=>({published:'Publicado',draft:'Rascunho',archived:'Arquivado',pending:'Pendente',approved:'Aprovado',rejected:'Rejeitado'})[v]||String(v||'—');
 const date=v=>{try{return new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(v))}catch{return '—'}};
 const pill=v=>'<span class="dw-bo-pill dw-bo-pill--'+esc(v)+'">'+esc(statusLabel(v))+'</span>';
 const seriesById=id=>series.find(s=>s.id===id);
 const seasonById=id=>seasons.find(s=>s.id===id);
 const roleLabel=x=>roles[x]||x;
 const safeUrl=url=>typeof url==='string'&&/^https:\/\/[^\s"'<>]+$/i.test(url)?url:'';
 const currentRole=async()=>{
   const auth=await client.auth.getUser();
   if(auth.error||!auth.data?.user)throw Error('Faça login com Google para continuar.');
   actor=auth.data.user;
   const {data,error}=await client.from('profiles').select('role').eq('user_id',actor.id).single();
   if(error||!data||!roles[data.role])throw Error('Não foi possível confirmar suas permissões.');
   role=data.role;
   if(!staff())throw Error('Este painel é exclusivo da equipe da DubWorks.');
 };
 function shell(){
  const available=nav.filter(([id])=>id!=='users'||onlyDirector())
    .filter(([id])=>!['series','episodes'].includes(id)||editorial());
  return '<div class="dw-bo-modal" id="dw-backoffice" role="dialog" aria-modal="true" aria-label="Painel administrativo DubWorks Play">'
    +'<div class="dw-bo-shell"><aside class="dw-bo-sidebar">'
    +'<div class="dw-bo-brand"><span class="dw-bo-brand-mark">▶</span><div><strong>DubWorks <em>PLAY</em></strong><small>CENTRAL ADMINISTRATIVA</small></div></div>'
    +'<div class="dw-bo-person"><div class="dw-bo-person-avatar">'+esc((actor?.user_metadata?.full_name||'DW').slice(0,1).toUpperCase())+'</div>'
    +'<div><strong>'+esc(actor?.user_metadata?.full_name||'Equipe DubWorks')+'</strong><small>'+esc(roleLabel(role))+'</small></div></div>'
    +'<p class="dw-bo-nav-kicker">GERENCIAMENTO</p>'
    +'<nav class="dw-bo-nav" aria-label="Áreas administrativas">'
    +available.map(([id,icon,glyph])=>'<button type="button" data-bo-tab="'+id+'" class="'+(tab===id?'is-active':'')+'"><span aria-hidden="true">'+glyph+'</span>'+esc(labels[id])+'</button>').join('')
    +'</nav>'
    +'<div class="dw-bo-sidebar-bottom"><span class="dw-bo-private">✦ Área restrita • Supabase Play</span>'
    +'<button type="button" class="dw-bo-exit" data-bo-close="true">← Voltar ao streaming</button></div>'
    +'</aside><div class="dw-bo-main"><header class="dw-bo-topbar"><div><span class="dw-bo-kicker">PAINEL ADMINISTRATIVO</span>'
    +'<h1 id="dw-bo-title">'+esc(labels[tab])+'</h1></div><div class="dw-bo-top-controls">'
    +'<span class="dw-bo-top-role">'+esc(roleLabel(role))+'</span>'
    +'<button type="button" data-bo-refresh="true" aria-label="Atualizar dados">↻ Atualizar</button>'
    +'<button type="button" data-bo-close="true" aria-label="Fechar painel">✕</button></div></header>'
    +'<div class="dw-bo-feedback" id="dw-backoffice-feedback" role="status" aria-live="polite" hidden></div>'
    +'<section id="dw-backoffice-content" class="dw-bo-body" aria-live="polite"></section>'
    +'</div></div></div>';
 }
 async function open(requested='overview'){
   if(opened){await navigate(requested);return}
   try{
     client=await window.DWAuth?.getClientAsync?.();
     if(!client)throw Error('Não foi possível conectar ao banco do DubWorks Play.');
     await currentRole();
   }catch(err){window.alert(err?.message||'Não foi possível abrir o painel.');return}
   tab=(requested==='users'&&!onlyDirector())?'overview':labels[requested]?requested:'overview';
   if(!editorial()&&['series','episodes'].includes(tab))tab='comments';
   lastFocus=document.activeElement;
   document.body.insertAdjacentHTML('beforeend',shell());
   opened=true;
   document.body.classList.add('dw-backoffice-open');
   root().addEventListener('click',onClick);
   root().addEventListener('submit',onSubmit);
   root().addEventListener('change',onChange);
   root().addEventListener('input',onInput);
   root().querySelector('[data-bo-close]')?.focus();
   await navigate(tab);
 }
 function close(){
   if(!opened)return;
   sequence++;
   root()?.remove();
   document.body.classList.remove('dw-backoffice-open');
   opened=false;
   lastFocus?.focus?.();
 }
 function allowed(next){
   return !!labels[next]&&(next!=='users'||onlyDirector())&&(!['series','episodes'].includes(next)||editorial());
 }
 async function navigate(next){
   if(!opened||!allowed(next))return;
   tab=next;
   root().querySelectorAll('[data-bo-tab]').forEach(btn=>{
     const yes=btn.dataset.boTab===tab;
     btn.classList.toggle('is-active',yes);
     btn.setAttribute('aria-current',String(yes));
   });
   byId('dw-bo-title').textContent=labels[next];
   const ticket=++sequence;
   content().innerHTML='<div class="dw-bo-loading"><span class="dw-bo-spinner"></span> Carregando dados do DubWorks Play...</div>';
   try{
     if(next==='overview')await loadOverview(ticket);
     if(next==='series')await loadSeries(ticket);
     if(next==='episodes')await loadEpisodes(ticket);
     if(next==='comments')await loadComments(ticket);
     if(next==='users')await loadUsers(ticket);
     if(next==='settings')loadSettings(ticket);
   }catch(error){
     console.error('DubWorks Play: painel',error);
     if(ticket===sequence&&opened)content().innerHTML='<div class="dw-bo-error"><h2>Não foi possível carregar esta área.</h2><p>'+esc(error?.message||'Verifique a conexão.')+'</p><button data-bo-refresh="true">Tentar novamente</button></div>';
   }
 }
 const inPage=(ticket)=>ticket===sequence&&opened&&content();
 async function queryCount(table,filters=[]){
   let q=client.from(table).select('id',{head:true,count:'exact'});
   if(table==='profiles')q=client.from(table).select('user_id',{head:true,count:'exact'});
   for(const [col,val] of filters)q=q.eq(col,val);
   const {count,error}=await q;
   if(error)throw error;
   return count||0;
 }
 async function loadOverview(ticket){
   const metrics=[
     ['Séries cadastradas','series',[],'▣'],
     ['Séries públicas','series',[['status','published']],'✦'],
     ['Episódios publicados','episodes',[['status','published']],'▶'],
     ['Comentários pendentes','comments',[['status','pending']],'☏']
   ];
   const promises=metrics.map(([,name,filters])=>queryCount(name,filters));
   if(onlyDirector())promises.push(queryCount('profiles'));
   const values=await Promise.all(promises);
   if(!inPage(ticket))return;
   content().innerHTML='<div class="dw-bo-welcome"><div><span>✦ CENTRAL DE CONTROLE</span>'
     +'<h2>Seu universo, em um só lugar.</h2><p>Gerencie o que o público vê, publique episódios autorizados e cuide da comunidade.</p></div>'
     +(editorial()?'<button type="button" data-bo-new-episode="true">＋ Publicar episódio</button>':'<button type="button" data-bo-tab="comments">Moderar comentários</button>')
     +'</div><div class="dw-bo-kpi-grid">'
     +metrics.map((m,i)=>'<div class="dw-bo-kpi"><span class="dw-bo-kpi-icon">'+m[3]+'</span>'
       +'<strong>'+moneyCount(values[i])+'</strong><span>'+esc(m[0])+'</span></div>').join('')
     +(onlyDirector()?'<div class="dw-bo-kpi"><span class="dw-bo-kpi-icon">♙</span><strong>'+moneyCount(values[4])+'</strong><span>Contas cadastradas</span></div>':'')
     +'</div><div class="dw-bo-chrome-grid"><section class="dw-bo-panel"><h3>Ações rápidas</h3>'
     +(editorial()?'<button class="dw-bo-quick" data-bo-tab="series">▣ Gerenciar séries <span>›</span></button>'
       +'<button class="dw-bo-quick" data-bo-tab="episodes">▤ Temporadas e episódios <span>›</span></button>':'')
     +'<button class="dw-bo-quick" data-bo-tab="comments">☏ Moderação <span>›</span></button>'
     +(onlyDirector()?'<button class="dw-bo-quick" data-bo-tab="users">♙ Usuários e cargos <span>›</span></button>':'')
     +'</section><section class="dw-bo-panel dw-bo-panel-highlight"><h3>O que estes números significam?</h3>'
     +'<p>Os dados vêm das tabelas reais do Supabase. Não são contagens inventadas de espectadores ou visualizações.</p>'
     +'<p>A reprodução pelo Google Drive não gera automaticamente estatísticas de tempo assistido ou visualizações no DubWorks Play.</p>'
     +'</section></div>';
 }
 async function fetchEditorial(){
   const [sr,ss,ep]=await Promise.all([
     client.from('series').select('id,slug,title,synopsis,kind,genres,age_rating,release_year,cover_url,banner_url,status,created_at').order('title'),
     client.from('seasons').select('id,series_id,season_number,title,status').order('season_number'),
     client.from('episodes').select('id,season_id,episode_number,title,status,created_at,rights_confirmed').order('episode_number')
   ]);
   if(sr.error)throw sr.error;
   if(ss.error)throw ss.error;
   if(ep.error)throw ep.error;
   series=sr.data||[];seasons=ss.data||[];episodes=ep.data||[];
 }
 function seriesRow(s){
   const seasonIds=seasons.filter(x=>x.series_id===s.id).map(x=>x.id);
   const epCount=episodes.filter(x=>seasonIds.includes(x.season_id)).length;
   return '<article class="dw-bo-series-card"><div class="dw-bo-series-art"'
     +(safeUrl(s.cover_url||s.banner_url)?' style="background-image:url(&quot;'+esc(s.cover_url||s.banner_url)+'&quot;)"':'')+'><span>DW</span></div>'
     +'<div class="dw-bo-series-info"><div class="dw-bo-item-top">'+pill(s.status)
     +(s.age_rating?'<span class="dw-bo-age">'+esc(s.age_rating)+'</span>':'<span class="dw-bo-muted">Sem classificação</span>')+'</div>'
     +'<h3>'+esc(s.title)+'</h3><p>'+esc(s.synopsis||'Sem sinopse cadastrada')+'</p>'
     +'<small>'+seasonIds.length+' temporada(s) • '+epCount+' episódio(s) • '+esc(s.slug)+'</small>'
     +'<div class="dw-bo-inline-actions"><button data-bo-series-edit="'+esc(s.id)+'">✎ Editar série</button>'
     +(s.status==='published'?'<button data-bo-episode-series="'+esc(s.slug)+'">＋ Novo episódio</button>':'')
     +(s.status==='published'?'<button data-bo-visit-series="'+esc(s.slug)+'">↗ Visualizar</button>':'')
     +'</div></div></article>';
 }
 function drawSeries(){
   const shown=series.filter(s=>seriesFilter==='all'||s.status===seriesFilter);
   content().innerHTML='<div class="dw-bo-toolbar"><div><h2>Séries e projetos</h2><p>Atualize capas, gêneros, sinopses, classificação e disponibilidade no catálogo.</p></div>'
     +'<button class="dw-bo-primary" data-bo-new-series="true">＋ Nova série</button></div>'
     +'<div class="dw-bo-filters"><button data-bo-series-filter="all" class="'+(seriesFilter==='all'?'is-active':'')+'">Todas</button>'
     +['published','draft','archived'].map(st=>'<button data-bo-series-filter="'+st+'" class="'+(seriesFilter===st?'is-active':'')+'">'+statusLabel(st)+'</button>').join('')
     +'</div><div class="dw-bo-series-grid">'+(shown.length?shown.map(seriesRow).join(''):'<div class="dw-bo-empty">Nenhuma série nesta categoria.</div>')+'</div>';
 }
 async function loadSeries(ticket){
   await fetchEditorial();
   if(!inPage(ticket))return;
   drawSeries();
 }
 function seriesForm(row){
   const selected=row||{id:null,slug:'',title:'',synopsis:'',kind:'animation',genres:[],age_rating:'',release_year:'',cover_url:'',banner_url:'',status:'draft'};
   return '<div class="dw-bo-editback" id="dw-bo-editor"><form id="dw-bo-series-form" class="dw-bo-editor" autocomplete="off">'
     +'<header><div><span class="dw-bo-kicker">EDITOR DE CATÁLOGO</span><h2>'+esc(row?'Editar série':'Cadastrar série')+'</h2></div>'
     +'<button type="button" data-bo-dismiss-editor="true" aria-label="Fechar">✕</button></header>'
     +'<input type="hidden" name="record_id" value="'+esc(selected.id||'')+'">'
     +'<div class="dw-bo-formgrid">'
     +'<label>Título<input name="title" required maxlength="200" value="'+esc(selected.title)+'" placeholder="Nome da série"></label>'
     +'<label>Identificador (slug)<input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxlength="120" value="'+esc(selected.slug)+'" '+(row?'readonly':'')+' placeholder="nome-da-serie"></label>'
     +'<label>Tipo<select name="kind">'+[['anime','Anime'],['animation','Desenho/Animação'],['original','Original DubWorks'],['other','Outros']].map(([v,t])=>'<option value="'+v+'" '+(selected.kind===v?'selected':'')+'>'+t+'</option>').join('')+'</select></label>'
     +'<label>Classificação indicativa<select name="age_rating"><option value="">Não definida</option>'+['L','10','12','14','16','18'].map(x=>'<option value="'+x+'" '+(selected.age_rating===x?'selected':'')+'>'+x+'</option>').join('')+'</select></label>'
     +'<label>Ano de lançamento<input type="number" name="release_year" min="1900" max="2100" value="'+esc(selected.release_year||'')+'"></label>'
     +'<label>Exibição<select name="status">'+['draft','published','archived'].map(x=>'<option value="'+x+'" '+(selected.status===x?'selected':'')+'>'+statusLabel(x)+'</option>').join('')+'</select></label>'
     +'<label class="is-wide">Gêneros, separados por vírgula<input name="genres" maxlength="250" value="'+esc((selected.genres||[]).join(', '))+'" placeholder="Ação, Fantasia, Comédia"></label>'
     +'<label class="is-wide">Sinopse<textarea name="synopsis" rows="3" maxlength="1500">'+esc(selected.synopsis)+'</textarea></label>'
     +'<label class="is-wide">URL HTTPS da capa<input type="url" name="cover_url" value="'+esc(selected.cover_url||'')+'" placeholder="https://..."></label>'
     +'<label class="is-wide">URL HTTPS do banner<input type="url" name="banner_url" value="'+esc(selected.banner_url||'')+'" placeholder="https://..."></label>'
     +'</div><p class="dw-bo-formhint">Os episódios continuam separados por temporada. Publique somente materiais e artes autorizados.</p>'
     +'<footer><button type="button" data-bo-dismiss-editor="true">Cancelar</button><button class="dw-bo-primary" type="submit">✓ Salvar série</button></footer></form></div>';
 }
 function openSeriesEditor(id){
   const found=id?seriesById(id):null;
   if(id&&!found)return;
   root().insertAdjacentHTML('beforeend',seriesForm(found));
   byId('dw-bo-series-form').querySelector('[name=title]')?.focus();
 }
 async function saveSeries(form){
   if(!editorial())throw Error('Sem permissão de edição.');
   const data=new FormData(form),val=k=>String(data.get(k)||'').trim();
   const id=val('record_id'),slug=val('slug');
   if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))throw Error('Identificador inválido. Use apenas letras minúsculas, números e hífens.');
   const title=val('title');
   if(!title||title.length>200)throw Error('Informe um título com até 200 caracteres.');
   const kind=val('kind'),status=val('status'),rating=val('age_rating');
   if(!['anime','animation','original','other'].includes(kind)||!['draft','published','archived'].includes(status)||!(rating===''||['L','10','12','14','16','18'].includes(rating)))throw Error('Campos de classificação inválidos.');
   const year=val('release_year')?Number(val('release_year')):null;
   if(year!==null&&(!Number.isInteger(year)||year<1900||year>2100))throw Error('Ano de lançamento inválido.');
   for(const field of ['cover_url','banner_url'])if(val(field)&&!safeUrl(val(field)))throw Error('As imagens precisam de URLs HTTPS.');
   const payload={title,slug,kind,status,synopsis:val('synopsis'),genres:val('genres').split(',').map(x=>x.trim()).filter(Boolean).slice(0,15),
    age_rating:rating||null,release_year:year,cover_url:val('cover_url')||null,banner_url:val('banner_url')||null,updated_at:new Date().toISOString()};
   if(!id&&series.some(x=>x.slug===slug))throw Error('Esse identificador já está cadastrado.');
   const q=id?client.from('series').update(payload).eq('id',id):client.from('series').insert(payload);
   const {error}=await q.select('id').single();
   if(error)throw error;
   byId('dw-bo-editor')?.remove();
   await window.DWDrive?.refresh?.();
   await navigate('series');
   toast('Série salva com sucesso.');
 }
 async function loadEpisodes(ticket){
   await fetchEditorial();
   if(!inPage(ticket))return;
   drawEpisodes();
 }
 function drawEpisodes(){
   const options=series.map(s=>'<option value="'+esc(s.id)+'" '+(seasonFilter===s.id?'selected':'')+'>'+esc(s.title)+'</option>').join('');
   const ss=seasons.filter(s=>!seasonFilter||s.series_id===seasonFilter);
   const eps=episodes.filter(e=>ss.some(se=>se.id===e.season_id));
   const rows=eps.map(e=>{
      const se=seasonById(e.season_id),serie=se&&seriesById(se.series_id);
      if(!serie)return '';
      return '<tr><td><strong>'+esc(e.title)+'</strong><small>'+esc(serie.title)+'</small></td>'
        +'<td>T'+se.season_number+' · EP '+e.episode_number+'</td><td>'+pill(e.status)+'</td>'
        +'<td><button data-bo-episode-edit="'+esc(e.id)+'">✎ Editar</button>'
        +(e.status==='published'?'<button data-bo-episode-hide="'+esc(e.id)+'">Retirar do ar</button>':'')
        +'</td></tr>';
    }).join('');
   const seasonRows=ss.map(se=>{
     const title=seriesById(se.series_id)?.title||'';
     return '<div class="dw-bo-season"><div><strong>'+esc(title)+'</strong><small>Temporada '+se.season_number+(se.title?' • '+esc(se.title):'')+'</small></div>'
       +pill(se.status)
       +'<button data-bo-season-toggle="'+esc(se.id)+'">'+(se.status==='published'?'Ocultar':'Publicar')+'</button></div>';
   }).join('');
   content().innerHTML='<div class="dw-bo-toolbar"><div><h2>Temporadas e episódios</h2><p>Organize temporadas, edite episódios e acompanhe o que já está no ar.</p></div>'
     +'<button class="dw-bo-primary" data-bo-new-episode="true">＋ Publicar pelo Drive</button></div>'
     +'<div class="dw-bo-filterbar"><label>Projeto<select id="dw-bo-season-filter"><option value="">Todos os projetos</option>'+options+'</select></label>'
     +'<button class="dw-bo-secondary" data-bo-new-season="true">＋ Nova temporada</button></div>'
     +'<div class="dw-bo-sectionbar"><h3>Temporadas</h3><span>'+ss.length+' cadastrada(s)</span></div>'
     +'<div class="dw-bo-season-list">'+(seasonRows||'<p class="dw-bo-muted">Nenhuma temporada cadastrada.</p>')+'</div>'
     +'<div class="dw-bo-sectionbar"><h3>Episódios</h3><span>'+eps.length+' cadastrado(s)</span></div>'
     +'<div class="dw-bo-tablewrap"><table class="dw-bo-table"><thead><tr><th>Título</th><th>Identificação</th><th>Status</th><th>Ações</th></tr></thead>'
     +'<tbody>'+(rows||'<tr><td colspan="4">Nenhum episódio encontrado.</td></tr>')+'</tbody></table></div>';
 }
 function seasonForm(){
   return '<div class="dw-bo-editback" id="dw-bo-editor"><form id="dw-bo-season-form" class="dw-bo-editor">'
     +'<header><div><span class="dw-bo-kicker">CATÁLOGO</span><h2>Nova temporada</h2></div><button type="button" data-bo-dismiss-editor="true">✕</button></header>'
     +'<div class="dw-bo-formgrid"><label>Projeto<select required name="series_id">'+series.map(s=>'<option value="'+esc(s.id)+'" '+(seasonFilter===s.id?'selected':'')+'>'+esc(s.title)+'</option>').join('')+'</select></label>'
     +'<label>Número da temporada<input type="number" name="season_number" min="1" max="999" value="1" required></label>'
     +'<label class="is-wide">Título (opcional)<input name="title" maxlength="200" placeholder="Temporada 1"></label>'
     +'<label>Visibilidade<select name="status"><option value="draft">Rascunho</option><option value="published">Publicada</option></select></label></div>'
     +'<p class="dw-bo-formhint">Você também pode criar temporadas automaticamente ao publicar um episódio pelo Drive.</p>'
     +'<footer><button type="button" data-bo-dismiss-editor="true">Cancelar</button><button type="submit" class="dw-bo-primary">Criar temporada</button></footer></form></div>';
 }
 async function saveSeason(form){
   const info=new FormData(form),seriesId=String(info.get('series_id')||''),num=Number(info.get('season_number'));
   if(!seriesById(seriesId)||!Number.isInteger(num)||num<1||num>999)throw Error('Selecione um projeto e um número de temporada válido.');
   if(seasons.some(s=>s.series_id===seriesId&&s.season_number===num))throw Error('Essa temporada já está cadastrada.');
   const status=String(info.get('status')||'draft');
   if(!['draft','published'].includes(status))throw Error('Status inválido.');
   const {error}=await client.from('seasons').insert({series_id:seriesId,season_number:num,title:String(info.get('title')||'').trim()||null,status});
   if(error)throw error;
   byId('dw-bo-editor')?.remove();
   await navigate('episodes');
   toast('Temporada cadastrada.');
 }
 async function toggleSeason(id){
   const found=seasonById(id);
   if(!found)return;
   if(!window.confirm((found.status==='published'?'Ocultar':'Publicar')+' a temporada '+found.season_number+'?'))return;
   const to=found.status==='published'?'draft':'published';
   const {error}=await client.from('seasons').update({status:to}).eq('id',id);
   if(error)throw error;
   await window.DWDrive?.refresh?.();
   await navigate('episodes');
   toast('Temporada atualizada.');
 }
 async function hideEpisode(id){
   if(!window.confirm('Retirar este episódio da exibição pública? Ele continuará salvo como rascunho.'))return;
   const {error}=await client.from('episodes').update({status:'draft'}).eq('id',id);
   if(error)throw error;
   await window.DWDrive?.refresh?.();
   await navigate('episodes');toast('Episódio retirado da exibição pública.');
 }
 async function loadComments(ticket){
   const [c,e]=await Promise.all([
     client.from('comments').select('id,body,status,created_at,episode_id,user_id').order('created_at',{ascending:false}).limit(120),
     client.from('episodes').select('id,title').limit(500)
   ]);
   if(c.error)throw c.error;
   if(e.error)throw e.error;
   comments=c.data||[];
   const titles=new Map((e.data||[]).map(x=>[x.id,x.title]));
   comments=comments.map(x=>({...x,episodeTitle:titles.get(x.episode_id)||'Episódio'}));
   if(!inPage(ticket))return;drawComments();
 }
 function drawComments(){
   const shown=comments.filter(c=>commentFilter==='all'||c.status===commentFilter);
   content().innerHTML='<div class="dw-bo-toolbar"><div><h2>Moderação da comunidade</h2><p>Aprove ou rejeite comentários antes de aparecerem aos espectadores.</p></div>'
     +'<span class="dw-bo-queue-count">'+comments.filter(c=>c.status==='pending').length+' pendente(s)</span></div>'
     +'<div class="dw-bo-filters">'+['pending','approved','rejected','all'].map(x=>'<button data-bo-comment-filter="'+x+'" class="'+(commentFilter===x?'is-active':'')+'">'+(x==='all'?'Todos':statusLabel(x))+'</button>').join('')+'</div>'
     +'<div class="dw-bo-comment-list">'+(shown.length?shown.map(c=>'<article class="dw-bo-comment"><div class="dw-bo-comment-top">'
       +'<span>✦ '+esc(c.episodeTitle)+'</span>'+pill(c.status)+'<time>'+date(c.created_at)+'</time></div>'
       +'<p>'+esc(c.body)+'</p><div class="dw-bo-inline-actions">'
       +(c.status==='pending'?'<button data-bo-comment-status="approved" data-bo-comment-id="'+esc(c.id)+'">✓ Aprovar</button>'
          +'<button data-bo-comment-status="rejected" data-bo-comment-id="'+esc(c.id)+'">✕ Rejeitar</button>':'')
       +(c.status==='rejected'?'<button data-bo-comment-status="approved" data-bo-comment-id="'+esc(c.id)+'">Aprovar</button>':'')
       +(c.status==='approved'?'<button data-bo-comment-status="rejected" data-bo-comment-id="'+esc(c.id)+'">Rejeitar</button>':'')
       +'</div></article>').join(''):'<div class="dw-bo-empty">Não há comentários nesta situação.</div>')+'</div>';
 }
 async function moderate(id,status){
   if(!['approved','rejected'].includes(status)||!comments.some(c=>c.id===id))return;
   const {error}=await client.from('comments').update({status}).eq('id',id);
   if(error)throw error;
   await navigate('comments');
   toast('Moderação salva.');
 }
 async function loadUsers(ticket){
   if(!onlyDirector())throw Error('Apenas a Diretoria pode gerenciar os usuários.');
   const {data,error}=await client.from('profiles').select('user_id,display_name,email,role,created_at').order('created_at',{ascending:false}).limit(100);
   if(error)throw error;
   people=data||[];
   if(!inPage(ticket))return;drawUsers();
 }
 function drawUsers(){
   const search=usersQuery.trim().toLocaleLowerCase('pt-BR');
   const shown=people.filter(p=>!search||(p.display_name||'').toLocaleLowerCase('pt-BR').includes(search)||(p.email||'').toLowerCase().includes(search));
   content().innerHTML='<div class="dw-bo-toolbar"><div><h2>Usuários e permissões</h2><p>Gerencie o acesso da equipe. Novas contas começam como espectadores.</p></div>'
     +'<span class="dw-bo-queue-count">'+people.length+' usuário(s)</span></div>'
     +'<label class="dw-bo-search">⌕ <input id="dw-bo-users-search" placeholder="Buscar por nome ou e-mail" value="'+esc(usersQuery)+'"></label>'
     +'<div class="dw-bo-user-list">'+(shown.length?shown.map(p=>{
       const self=p.user_id===actor.id;
       return '<article class="dw-bo-user"><div class="dw-bo-user-avatar">'+esc((p.display_name||'DW').slice(0,1).toUpperCase())+'</div>'
         +'<div class="dw-bo-user-meta"><strong>'+esc(p.display_name||'Espectador')+(self?' <span>(você)</span>':'')+'</strong>'
         +'<small>'+esc(p.email||'E-mail não disponível')+'</small><small>Desde '+date(p.created_at)+'</small></div>'
         +'<div class="dw-bo-user-controls"><select data-bo-role-select="'+esc(p.user_id)+'" '+(self?'disabled':'')+'>'
         +Object.entries(roles).map(([id,label])=>'<option value="'+id+'" '+(p.role===id?'selected':'')+'>'+label+'</option>').join('')
         +'</select><button data-bo-role-save="'+esc(p.user_id)+'" '+(self?'disabled':'')+'>Salvar cargo</button></div></article>';
       }).join(''):'<div class="dw-bo-empty">Nenhum usuário encontrado.</div>')+'</div>'
     +'<p class="dw-bo-footnote">Somente a Diretoria altera cargos. Você não pode modificar o seu próprio acesso por esta tela. Exibindo até 100 contas.</p>';
 }
 async function saveRole(id){
   if(!onlyDirector()||id===actor.id)return;
   const account=people.find(p=>p.user_id===id);
   const picker=root()?.querySelector('[data-bo-role-select="'+id+'"]');
   const next=picker?.value;
   if(!account||!roles[next]||next===account.role)return;
   if(!window.confirm('Alterar o acesso de '+(account.display_name||account.email)+' para '+roles[next]+'?'))return;
   const {data,error}=await client.rpc('dw_admin_set_role',{p_user_id:id,p_new_role:next});
   if(error)throw error;
   if(data!==next)throw Error('O cargo não foi confirmado pelo banco.');
   await navigate('users');
   toast('Permissão atualizada com segurança.');
 }
 function loadSettings(ticket){
   if(!inPage(ticket))return;
   content().innerHTML='<div class="dw-bo-toolbar"><div><h2>Configurações e integrações</h2>'
     +'<p>Atalhos seguros para os serviços que mantêm o DubWorks Play funcionando.</p></div></div>'
     +'<div class="dw-bo-settings-grid">'
     +'<a href="https://supabase.com/dashboard/project/wmqbnyaygerbmgiyggwi" target="_blank" rel="noopener noreferrer"><span>▥</span><strong>Supabase • DubWorks Play</strong><small>Banco, autenticação e permissões</small><b>↗</b></a>'
     +'<a href="https://drive.google.com/drive/u/0/my-drive" target="_blank" rel="noopener noreferrer"><span>☁</span><strong>Google Drive</strong><small>Armazenamento dos arquivos autorizados</small><b>↗</b></a>'
     +'<a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer"><span>△</span><strong>Vercel</strong><small>Publicações do site</small><b>↗</b></a>'
     +'</div><section class="dw-bo-panel"><h3>Segurança de publicação</h3>'
     +'<p>O login Google dos espectadores não concede acesso ao seu Drive. Publicações precisam de autorização dos titulares dos conteúdos.</p>'
     +'<p>Não há controle de download ou métricas reais de visualização com o player incorporado do Drive. Essas funções exigiriam outra infraestrutura.</p></section>';
 }
 async function openEditor(opts={}){
   if(!editorial())return;
   await window.DWDrive?.openAdmin?.(opts);
 }
 async function onClick(event){
  const button=event.target.closest('button');
  if(!button)return;
  try{
   if(button.dataset.boClose!==undefined){close();return}
   if(button.dataset.boTab){await navigate(button.dataset.boTab);return}
   if(button.dataset.boRefresh!==undefined){await navigate(tab);return}
   if(button.dataset.boNewSeries!==undefined){openSeriesEditor();return}
   if(button.dataset.boSeriesEdit){openSeriesEditor(button.dataset.boSeriesEdit);return}
   if(button.dataset.boDismissEditor!==undefined){byId('dw-bo-editor')?.remove();return}
   if(button.dataset.boSeriesFilter){seriesFilter=button.dataset.boSeriesFilter;drawSeries();return}
   if(button.dataset.boNewEpisode!==undefined){await openEditor();return}
   if(button.dataset.boEpisodeSeries){await openEditor({slug:button.dataset.boEpisodeSeries});return}
   if(button.dataset.boEpisodeEdit){
      const item=episodes.find(e=>e.id===button.dataset.boEpisodeEdit),se=item&&seasonById(item.season_id);
      const serie=se&&seriesById(se.series_id);
      if(serie)await openEditor({slug:serie.slug,season:se.season_number,episode:item.episode_number});
      return;
   }
   if(button.dataset.boEpisodeHide){await hideEpisode(button.dataset.boEpisodeHide);return}
   if(button.dataset.boNewSeason!==undefined){root().insertAdjacentHTML('beforeend',seasonForm());return}
   if(button.dataset.boSeasonToggle){await toggleSeason(button.dataset.boSeasonToggle);return}
   if(button.dataset.boCommentFilter){commentFilter=button.dataset.boCommentFilter;drawComments();return}
   if(button.dataset.boCommentId){await moderate(button.dataset.boCommentId,button.dataset.boCommentStatus);return}
   if(button.dataset.boRoleSave){await saveRole(button.dataset.boRoleSave);return}
   if(button.dataset.boVisitSeries){close();window.location.hash='#projeto/'+encodeURIComponent(button.dataset.boVisitSeries);return}
  }catch(error){console.error('DubWorks Play painel:',error);toast(error?.message||'Não foi possível concluir a ação.',true)}
 }
 async function onSubmit(event){
   const form=event.target;
   if(!['dw-bo-series-form','dw-bo-season-form'].includes(form?.id))return;
   event.preventDefault();
   if(loading)return;
   loading=true;
   const btn=form.querySelector('button[type=submit]');
   if(btn)btn.disabled=true;
   try{
     if(form.id==='dw-bo-series-form')await saveSeries(form);
     if(form.id==='dw-bo-season-form')await saveSeason(form);
   }catch(error){console.error('DubWorks Play:',error);toast(error?.message||'Não foi possível salvar.',true)}
   finally{loading=false;if(btn?.isConnected)btn.disabled=false}
 }
 function onChange(e){
   if(e.target.id==='dw-bo-season-filter'){seasonFilter=e.target.value;drawEpisodes()}
 }
 function onInput(e){
   if(e.target.id==='dw-bo-users-search'){
     usersQuery=e.target.value;
     const cursor=usersQuery.length;
     drawUsers();
     const input=byId('dw-bo-users-search');input?.focus();input?.setSelectionRange(cursor,cursor);
   }
 }
 document.addEventListener('keydown',event=>{
   if(event.key==='Escape'&&opened){
     if(byId('dw-bo-editor')){byId('dw-bo-editor').remove();return}
     if(byId('dw-admin-overlay'))return;
     close();
   }
 });
 window.DWAdmin={open,close,refresh:async()=>opened?navigate(tab):null};
})();
