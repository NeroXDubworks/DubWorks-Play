/*
 * DubWorks Play — protótipo independente do Dubworks Manager.
 * Este catálogo mostra projetos reais cadastrados, mas NÃO importa dados privados
 * nem presume que o conteúdo já pode ser publicado.
 * Para exibir um episódio, adicione videoUrl somente após confirmar a autorização.
 */
(function () {
  'use strict';
  const projects = [
    {id:'bunnicula',title:'Bunnicula: O Coelho Vampiro',kind:'Desenhos',genre:'Comédia • Fantasia',status:'Em andamento',tag:'EPISÓDIO FINALIZADO',tagClass:'done',color:'#a21845',image:'https://omgjbafqukpzdhhpdlaa.supabase.co/storage/v1/object/public/project-covers/novo-projeto/1791161987295-1w8bfcp.jpg',description:'O coelho vampiro mais misterioso da animação chega aos projetos da DubWorks.',episodes:[{number:1,name:'Mumkey Business',status:'Finalizado — aguardando publicação'},{number:2,name:'Walking Fish',status:'Não iniciado'}],highlight:true},
    {id:'jujutsu',title:'Jujutsu Kaisen',kind:'Animes',genre:'Ação • Sobrenatural',status:'Em andamento',tag:'EM PRODUÇÃO',color:'#133b86',image:'https://i.pinimg.com/736x/46/7a/52/467a52b37bcab2340f1894a56c92519c.jpg',description:'Maldições, batalhas e personagens marcantes ganham novas vozes nos projetos de fandublagem da DubWorks.',episodes:[{number:1,name:'Ryomen Sukuna',status:'Não iniciado'}],highlight:true},
    {id:'hazbin',title:'Hazbin Hotel',kind:'Desenhos',genre:'Musical • Comédia',status:'Em andamento',tag:'EM PRODUÇÃO',color:'#a9163b',image:'https://tse3.mm.bing.net/th/id/OIP.5S-z4RZt_WsNMc6fvX_yAAHaJQ?r=0&rs=1&pid=ImgDetMain&o=7&rm=3',description:'Uma animação cheia de música, caos e personagens inesquecíveis no universo DubWorks.',episodes:[],highlight:true},
    {id:'kakegurui',title:'Kakegurui',kind:'Animes',genre:'Drama • Suspense',status:'Em edição',tag:'EM EDIÇÃO',tagClass:'edit',color:'#850e34',image:'https://i.pinimg.com/1200x/ca/dc/8c/cadc8cb36325fea1bfa14c9f00880ac8.jpg',description:'A emoção das apostas e das reviravoltas toma conta deste projeto em edição.',episodes:[],highlight:false},
    {id:'beastars',title:'Beastars',kind:'Animes',genre:'Drama • Mistério',status:'Planejamento',tag:'EM BREVE',tagClass:'soon',color:'#1c4554',image:'',description:'Drama, mistério e conflitos de um mundo animal complexo. Projeto da DubWorks em planejamento.',episodes:[{number:1,name:'A Lua e a Fera — EP01',status:'Não iniciado'}],highlight:false},
    {id:'digimon',title:'Digimon Xros Wars',kind:'Animes',genre:'Aventura • Ação',status:'Aguardando início',tag:'EM BREVE',tagClass:'soon',color:'#d26c0c',image:'',description:'Uma nova aventura digital planejada para a comunidade DubWorks.',episodes:[],highlight:false},
    {id:'inesperados',title:'Os Inesperados',kind:'Desenhos',genre:'Animação • HQ',status:'Aguardando início',tag:'EM BREVE',tagClass:'soon',color:'#3c5daf',image:'',description:'Projeto em parceria registrado na DubWorks, ainda aguardando início.',episodes:[],highlight:false},
    {id:'everafter',title:'Ever After High',kind:'Desenhos',genre:'Fantasia • Animação',status:'Em andamento',tag:'EM PRODUÇÃO',color:'#623485',image:'https://image.tmdb.org/t/p/original/2boEDiJfG79QRR0mPvkSGsnyzVc.jpg',description:'Contos de fadas, escolhas e descobertas em um projeto de animação.',episodes:[],highlight:false},
    {id:'steven',title:'Steven Universo',kind:'Desenhos',genre:'Aventura • Fantasia',status:'Em andamento',tag:'EM PRODUÇÃO',color:'#ae558b',image:'https://lezwatchtv.com/wp-content/uploads/2016/04/Steven_Universe-all_characters.jpg',description:'Aventura e amizade em um projeto de animação da DubWorks.',episodes:[],highlight:false},
    {id:'circus',title:'Digital Circus',kind:'Desenhos',genre:'Animação 3D • Fantasia',status:'Em andamento',tag:'EM PRODUÇÃO',color:'#966325',image:'https://i.pinimg.com/736x/42/aa/d1/42aad18381e05ff8446ba7bb3a2c6788.jpg',description:'Um universo digital estranho e divertido no catálogo de projetos da DubWorks.',episodes:[],highlight:false},
    {id:'neverland',title:'The Promised Neverland',kind:'Animes',genre:'Suspense • Mistério',status:'Em andamento',tag:'EM PRODUÇÃO',color:'#517251',image:'https://i.pinimg.com/1200x/d9/45/32/d945321d8ca3db3950cdceda4c8d7c6b.jpg',description:'Mistérios, descobertas e tensão em mais um projeto da DubWorks.',episodes:[],highlight:false},
    {id:'demonslayer',title:'Demon Slayer',kind:'Animes',genre:'Ação • Fantasia',status:'Stand-by',tag:'EM PAUSA',tagClass:'soon',color:'#176b66',image:'https://i.pinimg.com/1200x/fe/59/91/fe5991985810bcd2b9d44f95f2da6532.jpg',description:'Projeto da DubWorks temporariamente em pausa.',episodes:[],highlight:false},
  ];
  const icons = {
    play:'<svg viewBox="0 0 24 24"><path d="m8 5 12 7-12 7z" fill="currentColor" stroke="none"/></svg>',
    plus:'<svg viewBox="0 0 24 24"><path d="M12 4v16M4 12h16"/></svg>',
    check:'<svg viewBox="0 0 24 24"><path d="m5 12 5 5L20 7"/></svg>',
    info:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7h.01"/></svg>',
    chevron:'<svg viewBox="0 0 24 24"><path d="m9 5 7 7-7 7"/></svg>',
    left:'<svg viewBox="0 0 24 24"><path d="m15 5-7 7 7 7"/></svg>',
  };
  const saved = new Set(JSON.parse(localStorage.getItem('dw-play-favorites') || '[]'));
  let view = 'inicio'; let query = ''; let filter = 'Todos'; let heroIndex = 0; let toastTimeout;
  let currentProjectId = null; let detailsTab = 'episodios'; let returnView = 'inicio';
  let selectedSeason = 1; let playerEpisode = null; let playerLastSave = 0;
  const main = document.getElementById('main-content');
  const modalLayer = document.getElementById('modal-layer');
  const modalContent = document.getElementById('modal-content');
  const search = document.getElementById('search');
  const heroProjects = ['jujutsu','bunnicula','hazbin'].map(id=>projects.find(p=>p.id===id));
  const safe = value => String(value ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const getImage = p => p.image ? 'linear-gradient(90deg,rgba(6,11,24,.10),rgba(6,11,24,.12)),url("'+p.image.replace(/"/g,'%22')+'")' : 'radial-gradient(circle at 76% 30%, '+p.color+'ee, transparent 60%),linear-gradient(140deg,'+p.color+',#070d1e 90%)';
  const isSoon = p => ['Aguardando início','Planejamento','Stand-by'].includes(p.status);
  // No cadastro inicial, a temporada ainda não é um campo do banco.
  // Episódios sem metadado de temporada são agrupados provisoriamente na temporada 1.
  const seasonNumber = e => Number.isSafeInteger(Number(e.season)) && Number(e.season)>0 ? Number(e.season) : 1;
  const availableSeasons = p => [...new Set(p.episodes.map(seasonNumber))].sort((a,b)=>a-b);
  const episodesInSeason = (p,season) => p.episodes.filter(e=>seasonNumber(e)===Number(season)).sort((a,b)=>Number(a.number)-Number(b.number));
  const episodeFor = (p,season,num) => p?.episodes.find(e=>seasonNumber(e)===Number(season) && Number(e.number)===Number(num));
  const validMediaUrl = url => typeof url==='string' && /^https:\/\/[^\s<>"']+$/i.test(url);
  const validDriveId = value => typeof value==='string' && /^[A-Za-z0-9_-]{12,180}$/.test(value);
  const validDriveKey = value => typeof value==='string' && /^[A-Za-z0-9_-]{5,180}$/.test(value);
  const drivePreviewUrl = e => validDriveId(e?.driveFileId)
    ? 'https://drive.google.com/file/d/'+encodeURIComponent(e.driveFileId)+'/preview'
      +(validDriveKey(e.driveResourceKey)?'?resourcekey='+encodeURIComponent(e.driveResourceKey):'')
    : '';
  const isPlayable = e => Boolean(e && e.published===true &&
    (e.mediaProvider==='google_drive'?validDriveId(e.driveFileId):validMediaUrl(e.videoUrl)));
  const progressKey = (project,season,episode) => 'dw-play-progress:'+project+':'+season+':'+episode;
  const getProgress = (project,season,episode) => {
    try {const x=Number(localStorage.getItem(progressKey(project,season,episode)));return Number.isFinite(x)&&x>0?x:0;}
    catch {return 0}
  };
  const saveProgress = (project,season,episode,seconds) => {
    if(!Number.isFinite(seconds)||seconds<0)return;
    try {localStorage.setItem(progressKey(project,season,episode),String(Math.floor(seconds)));}
    catch {/* localStorage indisponível */ }
  };
  const formatClock = sec => {
    const n=Math.max(0,Math.floor(Number(sec)||0));
    return [Math.floor(n/3600),Math.floor(n%3600/60),n%60].filter((_,i)=>i>0||n>=3600).map(x=>String(x).padStart(2,'0')).join(':') || '00:00';
  };
  const originalEpisodes=new Map(projects.map(p=>[p.id,p.episodes.map(e=>({...e}))]));
  const favorites = () => projects.filter(p=>saved.has(p.id));
  function card(p){return '<button class="show-card" data-open="'+safe(p.id)+'" aria-label="Ver detalhes de '+safe(p.title)+'"><span class="card-image" style="background-image:'+safe(getImage(p))+'"></span>'+(!p.image?'<span class="card-placeholder">DW</span>':'')+'<span class="card-shade"></span><span class="card-tag '+safe(p.tagClass||'')+'">'+safe(p.tag)+'</span><span class="card-text"><span class="card-title">'+safe(p.title)+'</span><span class="card-status">'+safe(p.genre)+' · '+safe(p.status)+'</span></span></button>'}
  function section(title,arr,subtitle=''){if(!arr.length)return '';return '<section class="section"><div class="section-heading"><h2>'+safe(title)+'</h2><span class="section-arrow">›</span>'+(subtitle?'<span class="section-subtitle">'+safe(subtitle)+'</span>':'')+'</div><div class="cards-track">'+arr.map(card).join('')+'</div></section>'}
  function renderHero(){let p=heroProjects[heroIndex];return '<section class="hero" aria-label="Projeto em destaque"><div class="hero-picture" style="background-image:'+safe(getImage(p))+'"></div><div class="hero-glow"></div><div class="hero-content"><p class="hero-kicker">✦ DUBLADO PELA DUBWORKS</p><h1 class="hero-title">'+safe(p.title)+'</h1><div class="hero-meta"><span class="pill">'+safe(p.kind==='Animes'?'Anime':'Animação')+'</span><span>'+safe(p.genre)+'</span><span class="dot">•</span><span>'+safe(p.status)+'</span></div><p class="hero-description">'+safe(p.description)+'</p><div class="hero-buttons"><button class="btn btn-primary" data-open="'+safe(p.id)+'">'+icons.info+' Conhecer projeto</button><button class="btn btn-outline" data-favorite="'+safe(p.id)+'">'+(saved.has(p.id)?icons.check:icons.plus)+' '+(saved.has(p.id)?'Na minha lista':'Minha lista')+'</button></div></div><div class="hero-slide-arrows"><button data-hero="prev" aria-label="Destaque anterior">'+icons.left+'</button><button data-hero="next" aria-label="Próximo destaque">'+icons.chevron+'</button></div><div class="hero-dots">'+heroProjects.map((a,i)=>'<button aria-label="Ver destaque '+(i+1)+'" class="hero-dot '+(i===heroIndex?'active':'')+'" data-hero-to="'+i+'"></button>').join('')+'</div></section>'}
  function renderHome(){
    const inProduction=projects.filter(p=>['Em andamento','Em edição'].includes(p.status));
    const completed=projects.filter(p=>p.episodes.some(e=>e.status.includes('Finalizado')));
    const animes=projects.filter(p=>p.kind==='Animes');
    const cartoons=projects.filter(p=>p.kind==='Desenhos');
    const upcoming=projects.filter(isSoon);
    main.innerHTML=renderHero()+'<div class="content">'
      +section('Episódios concluídos',completed,'Produções concluídas, ainda não necessariamente publicadas')
      +section('Em produção na DubWorks',inProduction)
      +section('Universo anime',animes)
      +section('Desenhos e animações',cartoons)
      +section('Em breve',upcoming)
      +'</div>';
  }
  function renderCatalog(){let list=projects.filter(p=>(view==='catalogo'||view==='favoritos'||(view==='animes'&&p.kind==='Animes')||(view==='animacoes'&&p.kind==='Desenhos')||(view==='embreve'&&isSoon(p)))).filter(p=>view!=='favoritos'||saved.has(p.id)).filter(p=>filter==='Todos'||(filter==='Em produção'&&['Em andamento','Em edição'].includes(p.status))||(filter==='Em breve'&&isSoon(p))||(filter==='Com episódios'&&p.episodes.length>0)).filter(p=>(p.title+' '+p.genre+' '+p.description).toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')));let titles={catalogo:'Explore o catálogo',animes:'Animes',animacoes:'Desenhos e animações',embreve:'Em breve',favoritos:'Minha lista'};let empty=view==='favoritos'?'Adicione seus projetos favoritos pelo botão “Minha lista”.':'Experimente outro termo ou filtro para encontrar um projeto.';main.innerHTML='<div class="catalog-page"><h1 class="page-title">'+(query?'Resultados da busca':titles[view]||titles.catalogo)+'</h1><p class="page-lede">'+(view==='favoritos'?'Os projetos que você salvou neste navegador.':'Conheça os projetos registrados pela DubWorks. O catálogo não indica que os vídeos já estão disponíveis.')+'</p><div class="filter-strip">'+['Todos','Em produção','Em breve','Com episódios'].map(f=>'<button class="filter-chip '+(filter===f?'active':'')+'" data-filter="'+safe(f)+'">'+safe(f)+'</button>').join('')+'</div><div class="projects-count">'+list.length+' '+(list.length===1?'projeto encontrado':'projetos encontrados')+'</div>'+(list.length?'<div class="catalog-grid">'+list.map(card).join('')+'</div>':'<div class="empty-state"><div class="empty-icon">✦</div><h3>Nenhum projeto por aqui</h3><p>'+safe(empty)+'</p><button class="btn btn-primary" data-view="catalogo">Explorar o catálogo</button></div>')+'</div>'}
  function render(){updateNav();if(playerEpisode)renderPlayer();else if(currentProjectId)renderProjectDetail();else if(view==='inicio'&&!query)renderHome();else renderCatalog();}
  function updateNav(){document.querySelectorAll('[data-view]').forEach(el=>el.classList.toggle('active',el.dataset.view===view));}
  function navigate(next){playerEpisode=null;currentProjectId=null;view=next;query='';search.value='';filter='Todos';if(location.hash!=='#'+next)history.pushState({},'','#'+next);render();window.scrollTo({top:0,behavior:'smooth'});}
  function showToast(t){let el=document.getElementById('toast');el.textContent=t;el.classList.add('visible');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>el.classList.remove('visible'),2800)}
  function toggleFavorite(id){
    const wasSaved=saved.has(id);
    if(wasSaved){saved.delete(id);showToast('Removido da sua lista.')}
    else{saved.add(id);showToast('Adicionado à sua lista!')}
    const auth=window.DWAuth;
    if(auth?.isSignedIn()){
      Promise.resolve(auth.syncFavorite(id,!wasSaved)).catch(()=>{
        if(wasSaved)saved.add(id);else saved.delete(id);
        render();
      });
    }else{
      localStorage.setItem('dw-play-favorites',JSON.stringify([...saved]));
    }
    render();
  }
  const canEdit=()=>['admin','director'].includes(window.DWAuth?.getRole?.());
  const editEpisodeButton=(id,season,number,label='✎ Editar episódio')=>canEdit()
    ?'<button type="button" class="dw-edit-action" data-edit-episode="'+safe(id)+':'+Number(season)+':'+Number(number)+'">'+label+'</button>'
    :'';
  function renderProjectDetail(){
    const p=projects.find(q=>q.id===currentProjectId);
    if(!p){currentProjectId=null;renderHome();return}
    const related=projects.filter(q=>q.id!==p.id&&q.kind===p.kind).slice(0,5);
    const seasons=availableSeasons(p);
    if(seasons.length&&!seasons.includes(selectedSeason))selectedSeason=seasons[0];
    const listed=seasons.length?episodesInSeason(p,selectedSeason):[];
    const seasonPicker=seasons.length
      ?'<label class="season-picker" for="dw-season-select">Temporada <select id="dw-season-select" aria-label="Selecionar temporada">'
        +seasons.map(n=>'<option value="'+n+'" '+(n===selectedSeason?'selected':'')+'>Temporada '+n+'</option>').join('')
        +'</select></label>'
      :'';
    const episodeCards=listed.length
      ?listed.map(e=>{
        const ready=isPlayable(e);
        const previous=e.mediaProvider==='google_drive'?0:getProgress(p.id,seasonNumber(e),e.number);
        return '<article class="detail-episode">'
          +'<div class="episode-cover" style="background-image:'+safe(getImage(p))+'"><span class="episode-index">T'+seasonNumber(e)+' · EP '+safe(e.number)+'</span></div>'
          +'<div class="detail-episode-copy"><div class="detail-episode-title">'+safe(e.name)+'</div>'
          +'<div class="detail-episode-status">'+safe(e.status)+'</div>'
          +'<div class="episode-state '+(ready?'is-ready':'')+'">'+(ready?'● Disponível para assistir':'○ Aguardando publicação')+'</div>'
          +(ready&&previous>10?'<p class="episode-availability">Continuar de '+formatClock(previous)+'</p>':'')
          +'<div><button type="button" class="episode-action '+(ready?'is-ready':'')+'" data-episode="'+safe(p.id)+':'+seasonNumber(e)+':'+safe(e.number)+'">'
          +(ready?'▶ '+(previous>10?'Continuar assistindo':'Assistir episódio'):'Ver tela do episódio')+'</button>'
          +editEpisodeButton(p.id,seasonNumber(e),e.number)+'</div>'
          +'</div></article>';
      }).join('')
      :'<div class="detail-empty"><strong>Tem novidade chegando!</strong><p>Os episódios deste projeto serão exibidos aqui quando estiverem cadastrados e liberados para publicação.</p></div>';
    const information='<div class="detail-about"><h2>Sobre '+safe(p.title)+'</h2>'
      +'<p>'+safe(p.description)+'</p><dl>'
      +'<div><dt>Tipo</dt><dd>'+safe(p.kind)+'</dd></div>'
      +'<div><dt>Gênero</dt><dd>'+safe(p.genre)+'</dd></div>'
      +'<div><dt>Produção</dt><dd>DubWorks</dd></div>'
      +'<div><dt>Situação</dt><dd>'+safe(p.status)+'</dd></div>'
      +'</dl></div>';
    const suggestions=related.length
      ?'<div class="detail-section-heading"><h2>Você também pode gostar</h2></div><div class="cards-track">'+related.map(card).join('')+'</div>'
      :'<div class="detail-tab-placeholder"><h2>Mais histórias em breve</h2><p>Estamos preparando novas sugestões do universo DubWorks.</p></div>';
    const extras='<div class="detail-tab-placeholder"><h2>Por trás das vozes ✦</h2>'
      +'<p>Bastidores, trailers e extras poderão aparecer aqui quando forem publicados pela equipe.</p></div>';
    const contentByTab={
      episodios:'<div class="season-heading"><div class="detail-section-heading"><h2>Episódios</h2><span>'+listed.length+' cadastrado(s)</span></div>'+seasonPicker+'</div>'
        +(seasons.length?'<p class="season-helper">Temporadas organizadas conforme o cadastro disponível. A distribuição inicial pode ser atualizada pela equipe.</p>':'')
        +'<div class="detail-episodes">'+episodeCards+'</div>',
      sugestoes:suggestions,
      extras:extras,
      detalhes:information
    };
    const favoriteLabel=saved.has(p.id)?'✓ Na minha lista':'＋ Minha lista';
    const firstReady=p.episodes.find(isPlayable);
    const driveInline=firstReady?.mediaProvider==='google_drive';
    const inlinePlayer='<aside class="dw-project-player" aria-label="Prévia dos episódios de '+safe(p.title)+'">'
      +'<div class="dw-project-player-title"><span>▶ DUBWORKS PLAY</span><span>'+(firstReady?'T'+seasonNumber(firstReady)+' · EP '+safe(firstReady.number):'AGUARDANDO ESTREIA')+'</span></div>'
      +(driveInline
        ?'<div class="dw-drive-embed dw-drive-embed--project"><iframe class="dw-project-drive-frame" title="Assistir '+safe(firstReady.name)+' no Google Drive" src="'+safe(drivePreviewUrl(firstReady))+'" loading="lazy" sandbox="allow-scripts allow-same-origin allow-forms allow-presentation" allow="autoplay; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin"></iframe><span class="dw-drive-corner-shield" aria-hidden="true"></span></div>'
        :'<div class="dw-project-player-empty" style="background-image:'+safe(getImage(p))+'"><span aria-hidden="true">▷</span><strong>Seu próximo episódio mora aqui</strong><small>Assim que for publicado, o player aparecerá nesta tela.</small></div>')
      +(firstReady?'<button type="button" class="dw-project-player-open" data-episode="'+safe(p.id)+':'+seasonNumber(firstReady)+':'+safe(firstReady.number)+'">↗ Abrir página do episódio</button>':'')
      +'</aside>';
    const heroButton=firstReady
      ?'<button class="btn btn-primary" data-episode="'+safe(p.id)+':'+seasonNumber(firstReady)+':'+safe(firstReady.number)+'">▶ Assistir agora</button>'
      :'<button class="btn btn-primary" data-scroll-episodes="true">▶ Ver episódios</button>';
    main.innerHTML='<div class="detail-page">'
      +'<section class="detail-hero" aria-label="Página de '+safe(p.title)+'">'
      +'<div class="detail-art" style="background-image:'+safe(getImage(p))+'"></div>'
      +'<button class="detail-back" data-back="true" aria-label="Voltar ao catálogo">← Voltar</button>'
      +'<div class="detail-hero-body"><span class="detail-eyebrow">DUBWORKS PLAY • FANDUBLAGEM</span>'
      +'<h1>'+safe(p.title)+'</h1>'
      +'<div class="detail-meta"><span class="detail-state">'+safe(p.status)+'</span>'
      +'<span class="dw-age-rating '+(p.ageRating?'':'dw-unrated')+'" title="Classificação indicativa">'+safe(p.ageRating||'Não classificado')+'</span>'
      +(p.releaseYear?'<span>'+safe(p.releaseYear)+'</span>':'')
      +'<span>'+safe(p.kind)+'</span><span>'+safe(p.genre)+'</span></div>'
      +'<p class="detail-description">'+safe(p.description)+'</p>'
      +'<div class="detail-actions">'+heroButton
      +'<button class="btn btn-outline" data-favorite="'+safe(p.id)+'">'+favoriteLabel+'</button>'
      +(canEdit()?'<button class="dw-edit-action dw-edit-series" data-edit-series="'+safe(p.id)+'">✎ Editar classificação e ano</button>':'')
      +'</div>'
      +'</div>'+inlinePlayer+'</section>'
      +'<div class="detail-content"><div class="detail-tabs" role="tablist" aria-label="Explorar '+safe(p.title)+'">'
      +['episodios','sugestoes','extras','detalhes'].map(t=>{
          const label={episodios:'Episódios',sugestoes:'Sugestões',extras:'Extras',detalhes:'Detalhes'}[t];
          return '<button type="button" role="tab" aria-selected="'+(detailsTab===t)+'" class="'+(detailsTab===t?'active':'')+'" data-tab="'+t+'">'+label+'</button>';
        }).join('')
      +'</div><section class="detail-panel" id="episodios" role="tabpanel">'
      +(contentByTab[detailsTab]||contentByTab.episodios)
      +'<p class="detail-rights">A liberação de episódios completos e downloads depende da autorização de exibição e distribuição dos titulares.</p>'
      +'</section></div></div>';
  }
  function openEpisode(id,season,number){
    const p=projects.find(q=>q.id===id);
    if(!p||!episodeFor(p,season,number))return;
    playerEpisode={projectId:id,season:Number(season),number:Number(number)};
    selectedSeason=Number(season);currentProjectId=id;
    const route='#assistir/'+encodeURIComponent(id)+'/'+Number(season)+'/'+Number(number);
    if(location.hash!==route)history.pushState({},'',route);
    render();window.scrollTo({top:0,behavior:'smooth'});
  }
  function closePlayer(){
    if(!playerEpisode)return;
    const id=playerEpisode.projectId;
    playerEpisode=null;currentProjectId=id;detailsTab='episodios';
    if(location.hash!=='#projeto/'+encodeURIComponent(id))history.pushState({},'','#projeto/'+encodeURIComponent(id));
    render();window.scrollTo({top:0,behavior:'smooth'});
  }
  function renderPlayer(){
    const state=playerEpisode;
    const p=projects.find(q=>q.id===state.projectId);
    const e=episodeFor(p,state.season,state.number);
    if(!p||!e){playerEpisode=null;currentProjectId=null;navigate('inicio');return}
    const ready=isPlayable(e);
    const seasons=availableSeasons(p);
    const currentEpisodes=episodesInSeason(p,state.season);
    const position=currentEpisodes.findIndex(q=>Number(q.number)===state.number);
    const next=currentEpisodes[position+1];
    const previous=currentEpisodes[position-1];
    const progress=getProgress(p.id,state.season,e.number);
    const seasonMenu=seasons.length>1
      ?'<label class="season-picker watch-season-picker">Temporada <select id="dw-watch-season-select" aria-label="Selecionar temporada">'
        +seasons.map(n=>'<option value="'+n+'" '+(n===state.season?'selected':'')+'>Temporada '+n+'</option>').join('')
        +'</select></label>'
      :'';
    const poster=validMediaUrl(e.posterUrl)?e.posterUrl:(validMediaUrl(p.image)?p.image:'');
    const isDrive=ready&&e.mediaProvider==='google_drive';
    const media=isDrive
      ?'<div class="dw-drive-embed dw-drive-embed--watch"><iframe id="dw-drive-frame" class="dw-drive-frame" title="Reproduzir '+safe(e.name)+' pelo Google Drive" src="'+safe(drivePreviewUrl(e))+'" sandbox="allow-scripts allow-same-origin allow-forms allow-presentation" allow="autoplay; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin"></iframe><span class="dw-drive-corner-shield" aria-hidden="true"></span></div>'
      :ready
        ?'<video id="dw-episode-video" class="watch-video" controls playsinline preload="metadata"'
          +(poster?' poster="'+safe(poster)+'"':'')+' src="'+safe(e.videoUrl)+'">'
          +(validMediaUrl(e.captionsUrl)?'<track kind="subtitles" src="'+safe(e.captionsUrl)+'" srclang="pt-BR" label="Português" default>':'')
          +'Seu navegador não suporta a reprodução deste vídeo.</video>'
        :'<div class="watch-empty-art" style="background-image:'+safe(getImage(p))+'"></div>'
          +'<div class="watch-unavailable"><span class="watch-glass-label">DUBWORKS PLAY</span>'
          +'<span class="watch-unavailable-icon" aria-hidden="true">▷</span>'
          +'<h2>Episódio ainda não disponível</h2>'
          +'<p>O player está preparado, mas este episódio não tem um vídeo autorizado para reprodução no momento.</p></div>';
    const recommendations=endScreenMarkup(p,e,state);
    main.innerHTML='<div class="watch-page"><div class="watch-inner">'
      +'<div class="watch-header"><button class="watch-back" data-player-back="true">← Voltar aos episódios</button>'
      +'<div class="watch-mini-brand"><span>✦</span> DUBWORKS PLAY</div></div>'
      +'<div class="watch-stage" id="dw-watch-stage">'+media
      +'<div id="dw-watch-error" class="watch-video-error" role="alert"><h2>Não foi possível carregar o vídeo</h2>'
      +'<p>Confira se o arquivo está disponível e se o formato é compatível com seu navegador.</p></div>'
      +recommendations+'</div>'
      +'<section class="watch-underplayer"><div class="watch-copy">'
      +'<p class="watch-series">'+safe(p.title)+'</p>'
      +'<h1 class="watch-episode-name">T'+state.season+' · EP '+state.number+' — '+safe(e.name)+'</h1>'
      +'<p class="watch-meta">'+safe(e.status)+' · '+(ready?'Pronto para assistir':'Aguardando publicação')+'</p>'
      +'<p class="watch-summary">'+safe(e.description||p.description)+'</p></div>'
      +'<div class="watch-buttons">'
      +'<button class="watch-button" data-player-back="true">Voltar à série</button>'
      +(ready?'<button class="watch-button" data-fullscreen="true">⛶ Tela cheia</button>':'')
      +editEpisodeButton(p.id,state.season,state.number)
      +(previous?'<button class="watch-button" data-episode="'+safe(p.id)+':'+state.season+':'+safe(previous.number)+'">← Anterior</button>':'')
      +(next?'<button class="watch-button watch-button-primary" data-episode="'+safe(p.id)+':'+state.season+':'+safe(next.number)+'">Próximo episódio →</button>':'')
      +'</div></section>'
      +'<div class="watch-toolbar">'
      +seasonMenu
      +(isDrive?'<button class="watch-button dw-show-suggestions" data-show-end="true">✓ Terminei • Ver sugestões</button><span class="dw-drive-warning">O Google Drive não informa quando o vídeo termina. Use “Terminei” para abrir as sugestões.</span>'

        :ready?'<label for="dw-speed-select">Velocidade <select id="dw-speed-select"><option value="0.75">0,75×</option><option value="1" selected>Normal (1×)</option><option value="1.25">1,25×</option><option value="1.5">1,5×</option><option value="2">2×</option></select></label>'
          +'<button class="watch-button" data-pip="true">▣ Mini player</button>'
          +(progress>10?'<span class="watch-resume">Retomar em '+formatClock(progress)+'</span>':'')
          :'<span class="watch-toolbar-note">Quando um vídeo autorizado for cadastrado, a reprodução aparecerá aqui.</span>')
      +'</div>'
      +'<section class="watch-next"><h2>Mais episódios desta temporada</h2><div class="watch-next-cards">'
      +currentEpisodes.map(item=>'<button class="watch-next-item" data-episode="'+safe(p.id)+':'+state.season+':'+safe(item.number)+'" aria-current="'+(item.number===e.number)+'"><strong>EP '+safe(item.number)+' — '+safe(item.name)+'</strong><span>'+safe(item.status)+(isPlayable(item)?' · Assistir':' · Indisponível')+'</span></button>').join('')
      +'</div></section>'
      +'<section id="dw-episode-comments" class="dw-episode-comments" aria-label="Comentários do episódio"><h2>Comentários</h2><p>Carregando comentários...</p></section>'
      +'<p class="watch-rights">Reprodução restrita a arquivos com autorização de exibição. Download offline ainda não está habilitado.</p>'
      +'</div></div>';
    if(ready&&!isDrive)wirePlayer(state);
    if(window.DWEngagement?.renderComments)window.DWEngagement.renderComments();
  }
  function wirePlayer(state){
    const video=document.getElementById('dw-episode-video');
    if(!video)return;
    let lastSavedSecond=-1;
    video.addEventListener('loadedmetadata',()=>{
      const resume=getProgress(state.projectId,state.season,state.number);
      if(resume>10 && Number.isFinite(video.duration) && resume<video.duration-10){
        video.currentTime=resume;
      }
    });
    video.addEventListener('timeupdate',()=>{
      if(!Number.isFinite(video.currentTime))return;
      const second=Math.floor(video.currentTime);
      if(second>0 && second!==lastSavedSecond && second%5===0){
        saveProgress(state.projectId,state.season,state.number,second);
        lastSavedSecond=second;
      }
    });
    video.addEventListener('pause',()=>{
      if(Number.isFinite(video.currentTime))saveProgress(state.projectId,state.season,state.number,video.currentTime);
    });
    video.addEventListener('ended',()=>{
      saveProgress(state.projectId,state.season,state.number,0);
      showEndScreen();
    });
    video.addEventListener('error',()=>{
      document.getElementById('dw-watch-error')?.classList.add('visible');
    });
  }
  function endScreenMarkup(p,e,state){
    const currentKey=seasonNumber(e)+':'+e.number;
    const nextEpisodes=p.episodes.filter(item=>isPlayable(item)&&seasonNumber(item)+':'+item.number!==currentKey).slice(0,2);
    const related=projects.filter(item=>item.id!==p.id&&item.kind===p.kind).slice(0,4);
    const epCards=nextEpisodes.map(item=>'<button type="button" class="dw-ending-card" data-episode="'+safe(p.id)+':'+seasonNumber(item)+':'+safe(item.number)+'">'
      +'<span class="dw-ending-image" style="background-image:'+safe(getImage(p))+'"><span class="dw-ending-play">▶</span></span>'
      +'<span class="dw-ending-details"><strong>EP '+safe(item.number)+' · '+safe(item.name)+'</strong><small>Assistir episódio</small></span></button>').join('');
    const moreCards=related.map(item=>'<button type="button" class="dw-ending-card" data-open="'+safe(item.id)+'">'
      +'<span class="dw-ending-image" style="background-image:'+safe(getImage(item))+'"><span class="dw-ending-play">↗</span></span>'
      +'<span class="dw-ending-details"><strong>'+safe(item.title)+'</strong><small>Conhecer projeto</small></span></button>').join('');
    return '<div id="dw-end-screen" class="dw-end-screen" role="dialog" aria-label="Sugestões para continuar assistindo" hidden>'
      +'<div class="dw-end-shade"></div>'
      +'<div class="dw-end-inner"><div class="dw-end-top"><span class="dw-end-brand">✦ DUBWORKS PLAY</span>'
      +'<button class="dw-end-close" type="button" data-close-end="true">✕ Fechar</button></div>'
      +'<p class="dw-end-eyebrow">A HISTÓRIA CONTINUA...</p>'
      +'<h2>Que tal mais uma? <span>✦</span></h2>'
      +'<p class="dw-end-lead">Escolha o próximo episódio ou descubra outro projeto da nossa comunidade.</p>'
      +'<div class="dw-ending-grid">'+epCards+moreCards+'</div>'
      +'<button type="button" class="dw-end-return" data-close-end="true">Voltar ao vídeo</button></div></div>';
  }
  function showEndScreen(){
    const screen=document.getElementById('dw-end-screen');
    if(!screen)return;
    screen.hidden=false;
    const video=document.getElementById('dw-episode-video');
    if(video&&!video.paused)video.pause();
    screen.querySelector('[data-close-end]')?.focus();
  }
  function hideEndScreen(){const screen=document.getElementById('dw-end-screen');if(screen)screen.hidden=true;}
  function openProject(id){
    if(!projects.some(p=>p.id===id))return;
    returnView=currentProjectId?returnView:view;
    playerEpisode=null;currentProjectId=id;selectedSeason=1;detailsTab='episodios';
    if(location.hash!=='#projeto/'+encodeURIComponent(id))history.pushState({},'','#projeto/'+encodeURIComponent(id));
    render();window.scrollTo({top:0,behavior:'smooth'});
  }
  function closeProject(){navigate(returnView||'inicio');}
  function syncRoute(){
    let hash;
    try{hash=decodeURIComponent(location.hash.replace(/^#/,''));}
    catch{hash='inicio'}
    const parts=hash.split('/');
    if(parts[0]==='assistir'&&parts.length===4){
      const p=projects.find(q=>q.id===parts[1]);
      const season=Number(parts[2]),episode=Number(parts[3]);
      if(p&&episodeFor(p,season,episode)){
        playerEpisode={projectId:p.id,season,number:episode};
        currentProjectId=p.id;selectedSeason=season;detailsTab='episodios';
      }else{playerEpisode=null;currentProjectId=null;view='inicio'}
    }else if(parts[0]==='projeto'&&parts.length===2){
      const p=projects.find(q=>q.id===parts[1]);
      playerEpisode=null;currentProjectId=p?p.id:null;
      selectedSeason=p&&availableSeasons(p).length?availableSeasons(p)[0]:1;
      detailsTab='episodios';
    }else{
      const allowed=['inicio','catalogo','animes','animacoes','embreve','favoritos'];
      playerEpisode=null;currentProjectId=null;view=allowed.includes(hash)?hash:'inicio';
    }
    render();window.scrollTo({top:0,behavior:'instant'});
  }
  document.addEventListener('click',e=>{
    const n=e.target.closest('[data-close],[data-open],[data-back],[data-player-back],[data-episode],[data-fullscreen],[data-pip],[data-favorite],[data-view],[data-filter],[data-hero],[data-hero-to],[data-tab],[data-scroll-episodes],[data-watch],[data-edit-episode],[data-edit-series],[data-show-end],[data-close-end]');
    if(!n)return;
    if(n.dataset.showEnd){showEndScreen();return}
    if(n.dataset.closeEnd){hideEndScreen();return}
    if(n.dataset.editEpisode){
      if(!canEdit())return;
      const [slug,season,number]=n.dataset.editEpisode.split(':');
      window.DWDrive?.openAdmin?.({slug,season:Number(season),episode:Number(number)});
      return;
    }
    if(n.dataset.editSeries){
      if(!canEdit())return;
      window.DWDrive?.openAdmin?.({slug:n.dataset.editSeries,focusSeries:true});
      return;
    }
    if(n.dataset.playerBack){closePlayer();return}
    if(n.dataset.close||n.dataset.back){closeProject();return}
    if(n.dataset.episode){
      const [id,season,number]=n.dataset.episode.split(':');
      openEpisode(id,Number(season),Number(number));return;
    }
    if(n.dataset.fullscreen){
      const player=document.getElementById('dw-episode-video');
      const stage=document.getElementById('dw-watch-stage');
      const target=player||stage;
      if(target?.requestFullscreen)target.requestFullscreen().catch(()=>showToast('Tela cheia não disponível neste dispositivo.'));
      return;
    }
    if(n.dataset.pip){
      const player=document.getElementById('dw-episode-video');
      if(player?.requestPictureInPicture)player.requestPictureInPicture().catch(()=>showToast('Mini player não disponível neste navegador.'));
      else showToast('Mini player não disponível neste navegador.');
      return;
    }
    if(n.dataset.open){openProject(n.dataset.open);return}
    if(n.dataset.favorite){toggleFavorite(n.dataset.favorite);return}
    if(n.dataset.view){navigate(n.dataset.view);return}
    if(n.dataset.filter){filter=n.dataset.filter;render();return}
    if(n.dataset.hero){heroIndex=(heroIndex+(n.dataset.hero==='next'?1:heroProjects.length-1))%heroProjects.length;render();return}
    if(n.dataset.heroTo){heroIndex=Number(n.dataset.heroTo);render();return}
    if(n.dataset.tab){detailsTab=n.dataset.tab;renderProjectDetail();return}
    if(n.dataset.scrollEpisodes){detailsTab='episodios';renderProjectDetail();document.querySelector('.detail-tabs')?.scrollIntoView({behavior:'smooth',block:'start'});return}
  });
  document.addEventListener('change',e=>{
    const target=e.target;
    if(target?.id==='dw-season-select'){
      const p=projects.find(q=>q.id===currentProjectId);
      const next=Number(target.value);
      if(p&&availableSeasons(p).includes(next)){selectedSeason=next;renderProjectDetail()}
      return;
    }
    if(target?.id==='dw-watch-season-select'&&playerEpisode){
      const p=projects.find(q=>q.id===playerEpisode.projectId);
      const eps=p?episodesInSeason(p,Number(target.value)):[];
      if(eps.length)openEpisode(p.id,Number(target.value),Number(eps[0].number));
      return;
    }
    if(target?.id==='dw-speed-select'){
      const video=document.getElementById('dw-episode-video');
      if(video)video.playbackRate=Number(target.value)||1;
    }
  });
  search.addEventListener('input',e=>{query=e.target.value.trim();if(query){view='catalogo';playerEpisode=null;currentProjectId=null;}filter='Todos';render()});
  document.getElementById('mobile-search-btn').addEventListener('click',()=>{navigate('catalogo');document.getElementById('topbar').classList.toggle('search-open');if(document.getElementById('topbar').classList.contains('search-open'))search.focus();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(playerEpisode)closePlayer();else if(currentProjectId)closeProject();}});
  window.addEventListener('hashchange',syncRoute);
  window.addEventListener('popstate',syncRoute);
  // Feedback tátil: o título levanta também no toque, sem exigir hover no celular.
  document.addEventListener('pointerdown',e=>{
    if(e.pointerType!=='touch')return;
    const tile=e.target.closest('.show-card');
    if(tile)tile.classList.add('card-touched');
  });
  document.addEventListener('pointerup',e=>{
    const tile=e.target.closest('.show-card');
    if(tile)setTimeout(()=>tile.classList.remove('card-touched'),220);
  });
  document.addEventListener('pointercancel',()=>{
    document.querySelectorAll('.card-touched').forEach(el=>el.classList.remove('card-touched'));
  });
  window.DubWorksPlay={
    getCurrentEpisode(){
      if(!playerEpisode)return null;
      const p=projects.find(x=>x.id===playerEpisode.projectId);
      const e=episodeFor(p,playerEpisode.season,playerEpisode.number);
      if(!p||!e)return null;
      return {slug:p.id,title:e.name,dbId:e.dbId||null,season:playerEpisode.season,number:playerEpisode.number,
        published:isPlayable(e)};
    },
    applyPublishedEpisodes(rows,metadata){
      // Se uma URL de episódio é aberta diretamente antes da consulta ao Supabase,
      // atualizar o player quando o registro publicado finalmente chegar.
      const activeBefore=playerEpisode?episodeFor(
        projects.find(p=>p.id===playerEpisode.projectId),playerEpisode.season,playerEpisode.number):null;
      const beforePlayable=isPlayable(activeBefore);
      const beforeDbId=activeBefore?.dbId||null;
      for(const p of projects){
        const details=metadata?.find(x=>x.slug===p.id);
        if(details){
          p.ageRating=details.age_rating||null;
          p.releaseYear=details.release_year||null;
        }
        const merged=new Map((originalEpisodes.get(p.id)||[]).map(e=>[seasonNumber(e)+':'+e.number,{...e}]));
        for(const rec of rows||[]){
          if(rec.slug!==p.id||!rec.published)continue;
          const ep={
            dbId:rec.dbId||null,number:rec.number,season:rec.season,name:rec.name,
            status:'Publicado',published:true,mediaProvider:rec.mediaProvider,
            driveFileId:rec.driveFileId||null,driveResourceKey:rec.driveResourceKey||null,
            videoUrl:rec.videoUrl||null,description:rec.description||p.description,
            thumbnailUrl:rec.thumbnailUrl||null,durationSeconds:rec.durationSeconds||null
          };
          merged.set(ep.season+':'+ep.number,ep);
        }
        p.episodes=[...merged.values()].sort((a,b)=>seasonNumber(a)-seasonNumber(b)||Number(a.number)-Number(b.number));
      }
      if(!playerEpisode){render();return}
      const activeAfter=episodeFor(
        projects.find(p=>p.id===playerEpisode.projectId),playerEpisode.season,playerEpisode.number);
      if(!activeAfter||beforePlayable!==isPlayable(activeAfter)||beforeDbId!==(activeAfter.dbId||null))renderPlayer();
    },
    getGuestFavorites(){
      try{return JSON.parse(localStorage.getItem('dw-play-favorites')||'[]')}
      catch{return []}
    },
    applyFavorites(slugs){
      saved.clear();
      for(const slug of slugs||[])if(projects.some(p=>p.id===slug))saved.add(slug);
      render();
    },
    restoreGuestFavorites(){
      const guest=this.getGuestFavorites();
      saved.clear();
      for(const slug of guest)if(projects.some(p=>p.id===slug))saved.add(slug);
      render();
    }
  };
  syncRoute();
})();
