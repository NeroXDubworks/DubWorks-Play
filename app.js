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
  const main = document.getElementById('main-content');
  const modalLayer = document.getElementById('modal-layer');
  const modalContent = document.getElementById('modal-content');
  const search = document.getElementById('search');
  const heroProjects = ['jujutsu','bunnicula','hazbin'].map(id=>projects.find(p=>p.id===id));
  const safe = value => String(value ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const getImage = p => p.image ? 'linear-gradient(90deg,rgba(6,11,24,.10),rgba(6,11,24,.12)),url("'+p.image.replace(/"/g,'%22')+'")' : 'radial-gradient(circle at 76% 30%, '+p.color+'ee, transparent 60%),linear-gradient(140deg,'+p.color+',#070d1e 90%)';
  const isSoon = p => ['Aguardando início','Planejamento','Stand-by'].includes(p.status);
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
  function render(){updateNav();if(currentProjectId)renderProjectDetail();else if(view==='inicio'&&!query)renderHome();else renderCatalog();}
  function updateNav(){document.querySelectorAll('[data-view]').forEach(el=>el.classList.toggle('active',el.dataset.view===view));}
  function navigate(next){currentProjectId=null;view=next;query='';search.value='';filter='Todos';if(location.hash!=='#'+next)history.pushState({},'','#'+next);render();window.scrollTo({top:0,behavior:'smooth'});}
  function showToast(t){let el=document.getElementById('toast');el.textContent=t;el.classList.add('visible');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>el.classList.remove('visible'),2800)}
  function toggleFavorite(id){if(saved.has(id)){saved.delete(id);showToast('Removido da sua lista.')}else{saved.add(id);showToast('Adicionado à sua lista!')}localStorage.setItem('dw-play-favorites',JSON.stringify([...saved]));render();if(currentProjectId===id)renderProjectDetail()}
  function renderProjectDetail(){
    const p=projects.find(q=>q.id===currentProjectId);
    if(!p){currentProjectId=null;renderHome();return}
    const related=projects.filter(q=>q.id!==p.id&&q.kind===p.kind).slice(0,5);
    const episodeCards=p.episodes.length
      ?p.episodes.map(e=>{
        const published=e.published===true&&typeof e.videoUrl==='string'&&/^https:\/\//.test(e.videoUrl);
        return '<article class="detail-episode">'
          +'<div class="episode-cover" style="background-image:'+safe(getImage(p))+'"><span class="episode-index">EP '+safe(e.number)+'</span></div>'
          +'<div class="detail-episode-copy"><div class="detail-episode-title">'+safe(e.name)+'</div>'
          +'<div class="detail-episode-status">'+safe(e.status)+'</div>'
          +(published?'<button type="button" class="episode-watch" data-watch="'+safe(p.id)+':'+safe(e.number)+'">▶ Assistir episódio</button>'
                     :'<p class="episode-availability">Aguardando liberação para assistir</p>')
          +'</div></article>';
      }).join('')
      :'<div class="detail-empty"><strong>Tem novidade chegando!</strong><p>Os episódios deste projeto serão exibidos aqui quando estiverem prontos para publicação.</p></div>';
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
      episodios:'<div class="detail-section-heading"><h2>Episódios</h2><span>'+p.episodes.length+' cadastrado(s)</span></div><div class="detail-episodes">'+episodeCards+'</div>',
      sugestoes:suggestions,
      extras:extras,
      detalhes:information
    };
    const favoriteLabel=saved.has(p.id)?'✓ Na minha lista':'＋ Minha lista';
    main.innerHTML='<div class="detail-page">'
      +'<section class="detail-hero" aria-label="Página de '+safe(p.title)+'">'
      +'<div class="detail-art" style="background-image:'+safe(getImage(p))+'"></div>'
      +'<button class="detail-back" data-back="true" aria-label="Voltar ao catálogo">← Voltar</button>'
      +'<div class="detail-hero-body"><span class="detail-eyebrow">DUBWORKS PLAY • FANDUBLAGEM</span>'
      +'<h1>'+safe(p.title)+'</h1>'
      +'<div class="detail-meta"><span class="detail-state">'+safe(p.status)+'</span><span>'+safe(p.kind)+'</span><span>'+safe(p.genre)+'</span></div>'
      +'<p class="detail-description">'+safe(p.description)+'</p>'
      +'<div class="detail-actions"><button class="btn btn-primary" data-scroll-episodes="true">▶ Ver episódios</button>'
      +'<button class="btn btn-outline" data-favorite="'+safe(p.id)+'">'+favoriteLabel+'</button></div>'
      +'</div></section>'
      +'<div class="detail-content"><div class="detail-tabs" role="tablist" aria-label="Explorar '+safe(p.title)+'">'
      +['episodios','sugestoes','extras','detalhes'].map((t)=>{
          const label={episodios:'Episódios',sugestoes:'Sugestões',extras:'Extras',detalhes:'Detalhes'}[t];
          return '<button type="button" role="tab" aria-selected="'+(detailsTab===t)+'" class="'+(detailsTab===t?'active':'')+'" data-tab="'+t+'">'+label+'</button>';
        }).join('')
      +'</div><section class="detail-panel" id="episodios" role="tabpanel">'
      +(contentByTab[detailsTab]||contentByTab.episodios)
      +'<p class="detail-rights">Este catálogo apresenta projetos da comunidade. Episódios completos e downloads só serão habilitados para arquivos com autorização de publicação e distribuição.</p>'
      +'</section></div></div>';
  }
  function openProject(id){
    if(!projects.some(p=>p.id===id))return;
    returnView=currentProjectId?returnView:view;
    currentProjectId=id;detailsTab='episodios';
    if(location.hash!=='#projeto/'+encodeURIComponent(id))history.pushState({},'','#projeto/'+encodeURIComponent(id));
    render();window.scrollTo({top:0,behavior:'smooth'});
  }
  function closeProject(){navigate(returnView||'inicio');}
  function syncRoute(){
    const hash=decodeURIComponent(location.hash.replace(/^#/,''));
    if(hash.startsWith('projeto/')){
      const id=hash.slice(8);
      if(projects.some(p=>p.id===id)){currentProjectId=id;detailsTab='episodios';}
      else currentProjectId=null;
    }else{
      const allowed=['inicio','catalogo','animes','animacoes','embreve','favoritos'];
      currentProjectId=null;view=allowed.includes(hash)?hash:'inicio';
    }
    render();window.scrollTo({top:0,behavior:'instant'});
  }
  document.addEventListener('click',e=>{
    const n=e.target.closest('[data-close],[data-open],[data-back],[data-favorite],[data-view],[data-filter],[data-hero],[data-hero-to],[data-tab],[data-scroll-episodes],[data-watch]');
    if(!n)return;
    if(n.dataset.close||n.dataset.back){closeProject();return}
    if(n.dataset.watch){showToast('Este episódio ainda não foi liberado para reprodução.');return}
    if(n.dataset.open){openProject(n.dataset.open);return}
    if(n.dataset.favorite){toggleFavorite(n.dataset.favorite);return}
    if(n.dataset.view){navigate(n.dataset.view);return}
    if(n.dataset.filter){filter=n.dataset.filter;render();return}
    if(n.dataset.hero){heroIndex=(heroIndex+(n.dataset.hero==='next'?1:heroProjects.length-1))%heroProjects.length;render();return}
    if(n.dataset.heroTo){heroIndex=Number(n.dataset.heroTo);render();return}
    if(n.dataset.tab){detailsTab=n.dataset.tab;renderProjectDetail();return}
    if(n.dataset.scrollEpisodes){detailsTab='episodios';renderProjectDetail();document.querySelector('.detail-tabs')?.scrollIntoView({behavior:'smooth',block:'start'});return}
  });
  search.addEventListener('input',e=>{query=e.target.value.trim();if(query){view='catalogo';currentProjectId=null;}filter='Todos';render()});
  document.getElementById('mobile-search-btn').addEventListener('click',()=>{navigate('catalogo');document.getElementById('topbar').classList.toggle('search-open');if(document.getElementById('topbar').classList.contains('search-open'))search.focus();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&currentProjectId)closeProject();});
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
  syncRoute();
})();
