/* DubWorks Play — Comentários por episódio.
 * Todos podem ler comentários aprovados; login Google para participar.
 * O Supabase RLS mantém comentários novos como pendentes e valida moderação.
 */
(function(){
  'use strict';
  const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'
  })[c]);
  const roles=['moderator','admin','director'];
  let readToken=0, busy=false, eventController=null;
  const formatDate=date=>{
    try{return new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(date))}
    catch{return ''}
  };
  const current=()=>window.DubWorksPlay?.getCurrentEpisode?.();
  const getClient=async()=>window.DWAuth?.getClientAsync?.();
  const identity=()=>window.DWAuth?.getUser?.()||null;
  const isStaff=()=>roles.includes(window.DWAuth?.getRole?.());
  const statusLabel=status=>({pending:'Aguardando aprovação',rejected:'Não aprovado',approved:'Publicado'})[status]||'';
  const root=()=>document.getElementById('dw-episode-comments');

  function renderRows(data,me,staff){
    if(!data.length)return '<p class="dw-comments-empty">Ainda não há comentários publicados. Que tal começar a conversa?</p>';
    return '<div class="dw-comments-list">'+data.map(comment=>{
      const own=comment.user_id===me;
      const pending=comment.status!=='approved';
      return '<article class="dw-comment" data-comment-row="'+escapeHtml(comment.id)+'">'
        +'<div class="dw-comment-avatar" aria-hidden="true">'+(own?'✦':'DW')+'</div>'
        +'<div class="dw-comment-content"><div class="dw-comment-header">'
        +'<strong>'+(own?'Você':'Comunidade DubWorks')+'</strong>'
        +'<time>'+escapeHtml(formatDate(comment.created_at))+'</time>'
        +(pending?'<span class="dw-comment-pending">'+escapeHtml(statusLabel(comment.status))+'</span>':'')
        +'</div><p>'+escapeHtml(comment.body)+'</p>'
        +'<div class="dw-comment-actions">'
        +(staff&&comment.status==='pending'
          ?'<button type="button" data-mod-comment="'+escapeHtml(comment.id)+'" data-mod-status="approved">✓ Aprovar</button>'
           +'<button type="button" data-mod-comment="'+escapeHtml(comment.id)+'" data-mod-status="rejected">✕ Rejeitar</button>':'')
        +(own?'<button type="button" data-delete-comment="'+escapeHtml(comment.id)+'">Excluir</button>':'')
        +'</div></div></article>';
    }).join('')+'</div>';
  }
  async function renderComments(){
    if(eventController){eventController.abort();eventController=null}
    const host=root(),episode=current();
    if(!host)return;
    const token=++readToken;
    host.innerHTML='<div class="dw-comments-title"><h2>Comentários <span>✦</span></h2>'
      +'<p>Troque ideias com a comunidade após assistir.</p></div>'
      +'<div class="dw-comments-loading">Carregando comentários...</div>';
    if(!episode?.published||!episode.dbId){
      host.innerHTML='<div class="dw-comments-title"><h2>Comentários <span>✦</span></h2></div>'
        +'<p class="dw-comments-empty">Os comentários serão liberados quando o episódio estiver publicado no DubWorks Play.</p>';
      return;
    }
    let api;
    try{api=await getClient()}
    catch(error){console.warn('DubWorks Play: autenticação indisponível nos comentários',error)}
    if(!api){
      if(token===readToken&&root()===host)host.innerHTML='<h2>Comentários</h2><p>Não foi possível carregar os comentários agora.</p>';
      return;
    }
    const user=identity();
    const staff=isStaff();
    const {data,error}=await api.from('comments').select('id,user_id,body,status,created_at')
      .eq('episode_id',episode.dbId).order('created_at',{ascending:false}).limit(80);
    if(token!==readToken||root()!==host||current()?.dbId!==episode.dbId)return;
    if(error){
      console.warn('DubWorks Play: falha na consulta de comentários',error);
      host.innerHTML='<h2>Comentários</h2><p>Não foi possível carregar os comentários.</p>';
      return;
    }
    const comments=data||[];
    host.innerHTML='<div class="dw-comments-title"><h2>Comentários <span>✦</span></h2>'
      +'<p>Compartilhe sua opinião sobre '+escapeHtml(episode.title)+'. Comentários novos passam por moderação.</p></div>'
      +(user?'<form id="dw-comment-form" class="dw-comment-form">'
        +'<label for="dw-comment-body">Deixe seu comentário</label>'
        +'<textarea id="dw-comment-body" name="body" rows="3" minlength="2" maxlength="1500" required placeholder="O que achou das vozes, cenas e momentos deste episódio?"></textarea>'
        +'<div class="dw-comment-form-footer"><span>Respeite os demais participantes. Seu comentário será analisado antes de aparecer para todos.</span>'
        +'<button type="submit">Publicar comentário</button></div></form>'
        :'<div class="dw-comments-login"><strong>Quer participar da conversa?</strong>'
        +'<p>Entre com sua conta Google para comentar. Assistir continua sendo gratuito e sem login.</p>'
        +'<button type="button" data-comment-login="true">Entrar com Google</button></div>')
      +(staff&&comments.some(c=>c.status==='pending')?'<p class="dw-moderation-note">⚑ Há comentários aguardando moderação.</p>':'')
      +renderRows(comments,user?.id,staff)
      +'<p class="dw-comment-feedback" id="dw-comment-feedback" aria-live="polite" role="status"></p>';
    eventController=new AbortController();
    const signal=eventController.signal;
    host.addEventListener('submit',async event=>{
      if(event.target?.id!=='dw-comment-form')return;
      event.preventDefault();
      if(busy)return;
      const input=host.querySelector('#dw-comment-body');
      const body=input?.value.trim()||'';
      if(body.length<2||body.length>1500){feedback(host,'Escreva um comentário entre 2 e 1.500 caracteres.');return}
      busy=true;
      const button=event.target.querySelector('button[type=submit]');
      if(button)button.disabled=true;
      try{
        const {data:check,error:authError}=await api.auth.getUser();
        if(authError||!check?.user)throw Error('Entre com Google para comentar.');
        const {error:insertError}=await api.from('comments').insert({
          user_id:check.user.id,episode_id:episode.dbId,body
        });
        if(insertError)throw insertError;
        await renderComments();
        feedback(root(),'Comentário enviado! Ele aparecerá para todos após a aprovação da moderação.');
      }catch(error){console.error('DubWorks Play: comentário',error);feedback(root(),'Não foi possível enviar seu comentário. Tente novamente.')}
      finally{busy=false;if(button?.isConnected)button.disabled=false}
    },{signal});
    host.addEventListener('click',async event=>{
      const button=event.target.closest('button');
      if(!button||busy)return;
      if(button.dataset.commentLogin){
        window.DWAuth?.login?.();return;
      }
      if(button.dataset.modComment){
        if(!isStaff()||!['approved','rejected'].includes(button.dataset.modStatus))return;
        busy=true;button.disabled=true;
        try{
          const {error:changeError}=await api.from('comments').update({status:button.dataset.modStatus})
            .eq('id',button.dataset.modComment).eq('episode_id',episode.dbId);
          if(changeError)throw changeError;
          await renderComments();
        }catch(error){console.error(error);feedback(host,'Não foi possível moderar este comentário.')}
        finally{busy=false;if(button.isConnected)button.disabled=false}
      }
      if(button.dataset.deleteComment){
        if(!identity())return;
        busy=true;button.disabled=true;
        try{
          const {error:deleteError}=await api.from('comments').delete()
            .eq('id',button.dataset.deleteComment).eq('user_id',identity().id);
          if(deleteError)throw deleteError;
          await renderComments();
        }catch(error){console.error(error);feedback(host,'Não foi possível excluir o comentário.')}
        finally{busy=false;if(button.isConnected)button.disabled=false}
      }
    },{signal});
  }
  function feedback(host,message){
    const el=host?.querySelector('#dw-comment-feedback');
    if(el)el.textContent=message;
  }
  window.DWEngagement={renderComments};
  if(root())renderComments().catch(console.error);
})();
