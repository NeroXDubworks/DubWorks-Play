/* DubWorks Play — Google Drive catalogue & editorial publishing.
 * External video files stay in the author's Google Drive.
 * Supabase RLS controls which records can be published, not the UI.
 */
(function(){
  'use strict';
  const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const isDriveId=s=>typeof s==='string'&&/^[A-Za-z0-9_-]{12,180}$/.test(s);
  const isKey=s=>typeof s==='string'&&/^[A-Za-z0-9_-]{5,180}$/.test(s);
  const isHttps=s=>typeof s==='string'&&/^https:\/\/[^\s"'<>]+$/i.test(s);
  let loading=false,client=null,editorOpen=false,seriesList=[],initialized=false;

  function driveLinkParts(input){
    const value=String(input||'').trim();
    if(!value)return null;
    // No arbitrary HTML/iframe, links to third-party sites or folders.
    let u;
    try{u=new URL(value)}catch{return null}
    if(u.protocol!=='https:'||!['drive.google.com','www.drive.google.com'].includes(u.hostname))return null;
    let fileId='';
    const m=u.pathname.match(/^\/file\/d\/([A-Za-z0-9_-]+)\/?(?:view|preview|edit)?\/?$/);
    if(m)fileId=m[1];
    if(!fileId&&['/open','/uc'].includes(u.pathname))fileId=u.searchParams.get('id')||'';
    if(!isDriveId(fileId))return null;
    const resourceKey=u.searchParams.get('resourcekey')||null;
    if(resourceKey&&!isKey(resourceKey))return null;
    return {id:fileId,resourceKey};
  }
  function shareUrl(id,resourceKey){
    return 'https://drive.google.com/file/d/'+encodeURIComponent(id)+'/view'
      +(resourceKey?'?resourcekey='+encodeURIComponent(resourceKey):'');
  }
  function notify(message,type='info'){
    const el=document.getElementById('dw-drive-notice');
    if(!el)return;
    el.textContent=message;el.dataset.type=type;el.hidden=false;
  }
  function pending(t){const el=document.getElementById('dw-admin-save');if(el){el.disabled=!!t;el.textContent=t?'Salvando...':'Salvar rascunho'}}
  async function getClient(){
    if(client)return client;
    if(!window.DWAuth?.getClientAsync)throw new Error('O login Google ainda está inicializando.');
    client=await window.DWAuth.getClientAsync();
    if(!client)throw new Error('Não foi possível conectar ao Supabase.');
    return client;
  }
  async function loadPublicCatalogue(){
    const api=await getClient();
    const [seriesResp,seasonsResp,epsResp]=await Promise.all([
      api.from('series').select('id,slug,title,synopsis,kind,genres,age_rating,release_year,cover_url,banner_url,status').eq('status','published'),
      api.from('seasons').select('id,series_id,season_number').eq('status','published'),
      api.from('episodes').select('id,season_id,episode_number,title,synopsis,duration_seconds,thumbnail_url,media_provider,drive_file_id,drive_resource_key,video_url,status').eq('status','published')
    ]);
    if(seriesResp.error)throw seriesResp.error;
    if(seasonsResp.error)throw seasonsResp.error;
    if(epsResp.error)throw epsResp.error;
    const seriesById=new Map((seriesResp.data||[]).map(s=>[s.id,s]));
    const seasonById=new Map((seasonsResp.data||[]).map(s=>[s.id,s]));
    const rows=[];
    for(const e of epsResp.data||[]){
      const season=seasonById.get(e.season_id);
      const serie=season&&seriesById.get(season.series_id);
      if(!season||!serie)continue;
      rows.push({
        slug:serie.slug,dbId:e.id,season:season.season_number,number:e.episode_number,
        name:e.title,description:e.synopsis,
        thumbnailUrl:e.thumbnail_url,durationSeconds:e.duration_seconds,
        mediaProvider:e.media_provider,driveFileId:e.drive_file_id,
        driveResourceKey:e.drive_resource_key,videoUrl:e.video_url,
        published:true
      });
    }
    window.DubWorksPlay?.applyPublishedEpisodes?.(rows,seriesResp.data||[]);
    return rows.length;
  }
  let queuedRefresh=false;
  async function refreshPublic(){
    if(loading){queuedRefresh=true;return}
    loading=true;
    try{await loadPublicCatalogue()}
    catch(e){console.warn('DubWorks Play: catálogo publicado indisponível',e)}
    finally{
      loading=false;
      if(queuedRefresh){queuedRefresh=false;refreshPublic().catch(console.error)}
    }
  }

  function editorHTML(){
    const choices=seriesList.map(s=>'<option value="'+safe(s.id)+'">'+safe(s.title)+'</option>').join('');
    return '<div class="dw-admin-overlay" id="dw-admin-overlay">'
      +'<section class="dw-admin-dialog" role="dialog" aria-modal="true" aria-labelledby="dw-admin-title">'
      +'<header class="dw-admin-heading"><div><span class="dw-admin-kicker">✦ DUBWORKS PLAY • DIRETORIA</span>'
      +'<h2 id="dw-admin-title">Publicar episódio</h2>'
      +'<p>Vincule um vídeo do seu Google Drive ao catálogo, sem enviá-lo para o Supabase.</p></div>'
      +'<button type="button" class="dw-admin-dismiss" id="dw-admin-dismiss" aria-label="Fechar painel">✕</button></header>'
      +'<div class="dw-admin-body"><aside class="dw-admin-steps">'
      +'<div class="dw-admin-step is-current"><span>01</span><strong>Projeto e temporada</strong><small>Escolha onde o vídeo aparecerá</small></div>'
      +'<div class="dw-admin-step"><span>02</span><strong>Vídeo no Drive</strong><small>Cole o link do arquivo final</small></div>'
      +'<div class="dw-admin-step"><span>03</span><strong>Revisão e publicação</strong><small>Confirme direitos e compartilhe</small></div>'
      +'<div class="dw-admin-security">🔒 Só Diretoria e Administradores podem publicar. Os espectadores nunca recebem acesso ao seu Google Drive.</div>'
      +'</aside><form id="dw-admin-form" class="dw-admin-form">'
      +'<div class="dw-admin-grid">'
      +'<label class="dw-admin-field dw-field-full">Série / projeto<select id="dw-series-id" required>'+choices+'</select></label>'
      +'<div class="dw-series-editor dw-field-full"><div class="dw-series-heading">Classificação indicativa e informações</div><div class="dw-series-fields">'
      +'<label class="dw-admin-field">Classificação indicativa<select id="dw-series-rating"><option value="">Não definida</option>'
      +['L','10','12','14','16','18'].map(x=>'<option value="'+x+'">'+(x==='L'?'Livre':x+' anos')+'</option>').join('')
      +'</select></label>'
      +'<label class="dw-admin-field">Ano de lançamento<input type="number" id="dw-series-year" min="1900" max="2100" placeholder="Ex.: 2016"></label></div>'
      +'<button type="button" id="dw-series-save" class="dw-admin-secondary">✓ Salvar classificação e ano</button>'
      +'<small>Use a classificação confirmada da obra. O ano é o do lançamento original, não necessariamente o da fandublagem.</small></div>'
      +'<label class="dw-admin-field">Temporada<input type="number" id="dw-season" min="1" max="999" value="1" required></label>'
      +'<label class="dw-admin-field">Episódio<input type="number" id="dw-episode" min="1" max="9999" value="1" required></label>'
      +'<label class="dw-admin-field dw-field-full">Título do episódio<input id="dw-episode-title" maxlength="200" required placeholder="Ex.: Mumkey Business"></label>'
      +'<label class="dw-admin-field dw-field-full">Descrição (opcional)<textarea id="dw-episode-description" rows="2" maxlength="2000" placeholder="Breve sinopse do episódio"></textarea></label>'
      +'<label class="dw-admin-field">Duração em minutos (opcional)<input id="dw-episode-duration" type="number" min="1" max="999" step="1" placeholder="Ex.: 11"></label>'
      +'<label class="dw-admin-field">Miniatura HTTPS (opcional)<input id="dw-episode-thumbnail" type="url" placeholder="https://...jpg"></label>'
      +'<label class="dw-admin-field dw-field-full">Link de compartilhamento do vídeo no Google Drive'
      +'<input id="dw-drive-link" type="url" placeholder="https://drive.google.com/file/d/.../view">'
      +'<small>Compartilhamento do arquivo: “Qualquer pessoa com o link” → “Leitor” para visitantes sem login.</small></label>'
      +'</div>'
      +'<div class="dw-link-status" id="dw-link-status" aria-live="polite">Cole o link do arquivo MP4 para verificar o formato.</div>'
      +'<label class="dw-rights-check"><input id="dw-rights-confirmed" type="checkbox"><span>Confirmo que temos autorização dos titulares para exibir este vídeo publicamente no DubWorks Play.</span></label>'
      +'<p class="dw-admin-note">O Drive não confirma automaticamente acessibilidade pelo link. Teste a reprodução como visitante antes de divulgar. Downloads continuam desativados.</p>'
      +'<div class="dw-admin-notice" id="dw-drive-notice" hidden role="status" aria-live="polite"></div>'
      +'<footer class="dw-admin-buttons"><button type="button" id="dw-admin-save" class="dw-admin-secondary">Salvar rascunho</button>'
      +'<button type="submit" id="dw-admin-publish" class="dw-admin-primary">▶ Salvar e publicar</button></footer>'
      +'</form></div></section></div>';
  }
  function input(id){return document.getElementById(id)}
  function getFields(){
    const frm=input('dw-admin-form');
    const formIsValid=frm?.reportValidity?.();
    if(!formIsValid)throw new Error('Preencha os campos obrigatórios.');
    const seriesId=input('dw-series-id').value;
    const season=Number(input('dw-season').value),number=Number(input('dw-episode').value);
    const title=input('dw-episode-title').value.trim();
    const duration=input('dw-episode-duration').value.trim();
    const thumbnail=input('dw-episode-thumbnail').value.trim();
    const description=input('dw-episode-description').value.trim();
    const link=input('dw-drive-link').value.trim();
    if(!seriesList.some(s=>s.id===seriesId))throw new Error('Escolha uma série do catálogo.');
    if(!Number.isSafeInteger(season)||season<1||season>999)throw new Error('Número de temporada inválido.');
    if(!Number.isSafeInteger(number)||number<1||number>9999)throw new Error('Número de episódio inválido.');
    if(!title||title.length>200)throw new Error('Informe o título do episódio.');
    if(thumbnail&&!isHttps(thumbnail))throw new Error('A miniatura precisa de uma URL HTTPS.');
    if(duration&&(!Number.isInteger(Number(duration))||Number(duration)<1||Number(duration)>999))
      throw new Error('A duração precisa ser um número inteiro de minutos.');
    if(link&&!driveLinkParts(link))throw new Error('Link do Drive inválido. Use o link de compartilhamento do arquivo, não de uma pasta.');
    return {seriesId,season,number,title,description,duration:duration?Number(duration)*60:null,
      thumbnail:thumbnail||null,drive:link?driveLinkParts(link):null,
      rights:input('dw-rights-confirmed').checked};
  }
  async function staffCheck(){
    const api=await getClient();
    const {data:auth,error:authError}=await api.auth.getUser();
    if(authError||!auth?.user)throw new Error('Entre com sua conta Google para publicar.');
    const {data:p,error}=await api.from('profiles').select('role').eq('user_id',auth.user.id).single();
    if(error||!['director','admin'].includes(p?.role))throw new Error('Seu usuário não tem permissão de publicação.');
    return api;
  }
  async function openAdmin(initial={}){
    let api;
    try{api=await staffCheck()}
    catch(error){window.alert(error.message);return}
    const {data,error}=await api.from('series').select('id,title,slug,status,age_rating,release_year').order('title');
    if(error){window.alert('Não foi possível carregar as séries do Supabase.');return}
    seriesList=data||[];
    if(!seriesList.length){window.alert('Ainda não existem séries cadastradas.');return}
    if(editorOpen){
      if(initial?.slug){
        const existingSeries=seriesList.find(x=>x.slug===initial.slug);
        if(existingSeries)input('dw-series-id').value=existingSeries.id;
        if(initial.season)input('dw-season').value=String(initial.season);
        if(initial.episode)input('dw-episode').value=String(initial.episode);
        setSeriesDetails();
        await loadExistingEpisode();
      }
      return;
    }
    editorOpen=true;
    const div=document.createElement('div');
    div.innerHTML=editorHTML();
    document.body.appendChild(div.firstElementChild);
    document.body.classList.add('dw-admin-open');
    input('dw-admin-dismiss').addEventListener('click',closeAdmin);
    input('dw-admin-overlay').addEventListener('click',e=>{if(e.target.id==='dw-admin-overlay')closeAdmin()});
    input('dw-drive-link').addEventListener('input',()=>{
      const v=input('dw-drive-link').value.trim(),label=input('dw-link-status');
      const parts=driveLinkParts(v);
      label.classList.toggle('dw-invalid',Boolean(v&&!parts));
      label.classList.toggle('dw-valid',Boolean(parts));
      label.textContent=parts?'✓ Formato reconhecido. Confirme manualmente se o vídeo está acessível.':
        v?'Link inválido: use o compartilhamento de um arquivo do Google Drive.':'Cole o link do arquivo MP4 para verificar o formato.';
    });
    input('dw-admin-form').addEventListener('submit',e=>{e.preventDefault();saveEpisode(true)});
    input('dw-admin-save').addEventListener('click',()=>saveEpisode(false));
    input('dw-series-save').addEventListener('click',()=>saveSeriesInfo());
    input('dw-series-id').addEventListener('change',setSeriesDetails);
    for(const id of ['dw-series-id','dw-season','dw-episode']){
      input(id).addEventListener('change',()=>loadExistingEpisode().catch(console.error));
    }
    if(initial?.slug){
      const selected=seriesList.find(item=>item.slug===initial.slug);
      if(selected)input('dw-series-id').value=selected.id;
    }
    if(initial?.season)input('dw-season').value=String(initial.season);
    if(initial?.episode)input('dw-episode').value=String(initial.episode);
    setSeriesDetails();
    if(initial?.focusSeries)input('dw-series-rating').focus();
    else input('dw-episode-title').focus();
    loadExistingEpisode().catch(console.error);
  }
  function setSeriesDetails(){
    const selected=seriesList.find(x=>x.id===input('dw-series-id')?.value);
    if(input('dw-series-rating'))input('dw-series-rating').value=selected?.age_rating||'';
    if(input('dw-series-year'))input('dw-series-year').value=selected?.release_year||'';
  }
  async function saveSeriesInfo(){
    const seriesId=input('dw-series-id')?.value;
    const selected=seriesList.find(x=>x.id===seriesId);
    if(!selected){notify('Série não encontrada.','error');return}
    const rating=input('dw-series-rating').value;
    const rawYear=input('dw-series-year').value.trim();
    const year=rawYear?Number(rawYear):null;
    if(rating&&!['L','10','12','14','16','18'].includes(rating)){notify('Classificação inválida.','error');return}
    if(rawYear&&(!Number.isInteger(year)||year<1900||year>2100)){notify('Ano inválido.','error');return}
    try{
      const api=await staffCheck();
      const {data,error}=await api.from('series')
        .update({age_rating:rating||null,release_year:year,updated_at:new Date().toISOString()})
        .eq('id',seriesId).select('id,age_rating,release_year').single();
      if(error)throw error;
      selected.age_rating=data.age_rating;selected.release_year=data.release_year;
      await refreshPublic();
      window.DWAdmin?.refresh?.();
      notify('Classificação indicativa e ano salvos com sucesso.','success');
    }catch(error){console.error('DubWorks Play: dados da série',error);notify('Não foi possível salvar os dados da série.','error')}
  }
  function closeAdmin(){
    input('dw-admin-overlay')?.remove();
    document.body.classList.remove('dw-admin-open');
    editorOpen=false;
  }
  async function findSeason(api,seriesId,seasonNumber){
    const {data,error}=await api.from('seasons').select('id,status').eq('series_id',seriesId).eq('season_number',seasonNumber).maybeSingle();
    if(error)throw error;
    return data;
  }
  async function loadExistingEpisode(){
    if(!editorOpen)return;
    const api=await staffCheck();
    const seriesId=input('dw-series-id').value;
    const n=Number(input('dw-season').value),number=Number(input('dw-episode').value);
    if(!Number.isInteger(n)||n<1||!Number.isInteger(number)||number<1)return;
    const season=await findSeason(api,seriesId,n);
    let existing=null;
    if(season){
      const {data,error}=await api.from('episodes').select('id,title,synopsis,duration_seconds,thumbnail_url,drive_file_id,drive_resource_key,rights_confirmed,status')
        .eq('season_id',season.id).eq('episode_number',number).maybeSingle();
      if(error)throw error;
      existing=data;
    }
    if(!editorOpen||input('dw-series-id')?.value!==seriesId
      ||Number(input('dw-season')?.value)!==n||Number(input('dw-episode')?.value)!==number)return;
    const fields=['dw-episode-title','dw-episode-description','dw-episode-duration','dw-episode-thumbnail','dw-drive-link'];
    fields.forEach(id=>input(id).value='');
    input('dw-rights-confirmed').checked=false;
    input('dw-link-status').textContent='Cole o link do arquivo MP4 para verificar o formato.';
    input('dw-link-status').className='dw-link-status';
    if(existing){
      input('dw-episode-title').value=existing.title||'';
      input('dw-episode-description').value=existing.synopsis||'';
      input('dw-episode-duration').value=existing.duration_seconds?String(Math.ceil(existing.duration_seconds/60)):'';
      input('dw-episode-thumbnail').value=existing.thumbnail_url||'';
      input('dw-drive-link').value=existing.drive_file_id?shareUrl(existing.drive_file_id,existing.drive_resource_key):'';
      input('dw-rights-confirmed').checked=existing.rights_confirmed===true;
      notify('Episódio existente encontrado ('+(existing.status==='published'?'publicado':'rascunho')+'). As alterações serão salvas neste cadastro.','info');
    }else{notify('Novo episódio: você pode salvar como rascunho ou publicar.','info')}
  }
  async function saveEpisode(publish){
    let fields;
    try{
      fields=getFields();
      if(publish&&!fields.drive)throw new Error('Cole o link do vídeo no Google Drive antes de publicar.');
      if(publish&&!fields.rights)throw new Error('Confirme as autorizações de publicação antes de liberar o episódio.');
      const selected=seriesList.find(x=>x.id===fields.seriesId);
      if(publish&&selected?.status!=='published')throw new Error('Publique primeiro a série no painel administrativo para liberar o episódio.');
      const api=await staffCheck();
      pending(true);
      input('dw-admin-publish').disabled=true;
      let season=await findSeason(api,fields.seriesId,fields.season);
      if(!season){
        const {data,error}=await api.from('seasons').insert({
          series_id:fields.seriesId,season_number:fields.season,
          status:publish?'published':'draft'
        }).select('id,status').single();
        if(error)throw error;season=data;
      }else if(publish&&season.status!=='published'){
        const {error}=await api.from('seasons').update({status:'published'}).eq('id',season.id);
        if(error)throw error;
      }
      const payload={
        season_id:season.id,episode_number:fields.number,title:fields.title,
        synopsis:fields.description,duration_seconds:fields.duration,thumbnail_url:fields.thumbnail,
        media_provider:'google_drive',drive_file_id:fields.drive?.id||null,
        drive_resource_key:fields.drive?.resourceKey||null,video_url:null,
        rights_confirmed:fields.rights,allow_download:false,
        status:publish?'published':'draft',published_at:publish?new Date().toISOString():null
      };
      const {data:existing,error:lookupError}=await api.from('episodes').select('id')
        .eq('season_id',season.id).eq('episode_number',fields.number).maybeSingle();
      if(lookupError)throw lookupError;
      const req=existing
        ?api.from('episodes').update(payload).eq('id',existing.id).select('id').single()
        :api.from('episodes').insert(payload).select('id').single();
      const {error}=await req;
      if(error)throw error;
      notify(publish?'Episódio publicado! Ele já pode aparecer no catálogo.':'Rascunho salvo. O vídeo ainda não está disponível ao público.','success');
      await refreshPublic();
      window.DWAdmin?.refresh?.();
    }catch(error){
      console.error('DubWorks Play: publicação',error);
      notify(error?.message||'Não foi possível salvar o episódio.','error');
    }finally{
      pending(false);
      if(input('dw-admin-publish'))input('dw-admin-publish').disabled=false;
    }
  }
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&editorOpen)closeAdmin()});
  window.DWDrive={openAdmin,refresh:refreshPublic,driveLinkParts};
  if(!initialized){initialized=true;refreshPublic().catch(console.error)}
})();
