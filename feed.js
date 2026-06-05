// feed.js
// Lógica do feed: render de statuses (10 slots), posts, sugestões, reações (emoji), comentários/respostas, partilha.

(function(){
  function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]); }
  const session = DB.getSession();
  if (!session) return;

  const statusStrip = document.getElementById('statusStrip');
  const feedEl = document.getElementById('feed');
  const suggestions = document.getElementById('suggestions');
  const mediaModal = document.getElementById('mediaModal');
  const mediaHolder = document.getElementById('mediaHolder');
  const closeMedia = document.getElementById('closeMedia');
  const loadMoreBtn = document.getElementById('loadMore');

  let posts = DB.getPosts() || [];
  let statuses = DB.getStatuses() || [];
  let page = 0;
  const pageSize = 6;
  const rings = ['ring-1','ring-2','ring-3','ring-4','ring-5'];

  const EMOJIS = { like:'👍', love:'❤️', wow:'😮', sad:'😢', angry:'😡' };
  const EMO_KEYS = Object.keys(EMOJIS);

  function renderAll(){
    posts = DB.getPosts() || [];
    statuses = DB.getStatuses() || [];
    renderStatuses();
    renderFeed();
    renderSuggestions();
  }

  function renderStatuses(){
    const now = new Date();
    statuses = statuses.filter(s => new Date(s.expiresAt) > now);
    DB.saveStatuses(statuses);
    statusStrip.innerHTML = '';

    const me = DB.getUsers().find(u => (u.email||'').toLowerCase() === session);
    const myStatus = statuses.find(s => s.authorEmail === session);
    statusStrip.appendChild(createStatusSlot({
      name: me ? me.name : 'Você',
      avatar: me ? me.avatar : 'avatar-default.png',
      status: myStatus || null,
      isMine: true,
      ringClass: myStatus ? rings[0] : 'empty'
    }));

    const friends = DB.getFriends().filter(f => f.a === session || f.b === session).map(f => (f.a === session ? f.b : f.a));
    const friendStatuses = statuses.filter(s => s.authorEmail !== session && friends.includes(s.authorEmail));

    const maxSlots = 10;
    for (let i=0;i<maxSlots;i++){
      const s = friendStatuses[i];
      if (s) {
        const u = DB.getUsers().find(u => (u.email||'').toLowerCase() === (s.authorEmail||'').toLowerCase()) || { name: s.authorEmail, avatar:'avatar-default.png' };
        statusStrip.appendChild(createStatusSlot({ name: u.name, avatar: u.avatar, status: s, isMine:false, ringClass: rings[(i+1)%rings.length] }));
      } else {
        statusStrip.appendChild(createEmptySlot(i));
      }
    }
  }

  function createStatusSlot({name, avatar, status, isMine, ringClass}){
    const slot = document.createElement('div'); slot.className = 'status-slot';
    const ring = document.createElement('div'); ring.className = 'status-ring ' + (status ? ringClass : 'empty');
    const img = document.createElement('img'); img.className = 'status-avatar'; img.src = avatar || 'avatar-default.png';
    ring.appendChild(img);
    slot.appendChild(ring);
    const nm = document.createElement('div'); nm.className = 'status-name'; nm.textContent = name;
    slot.appendChild(nm);
    const time = document.createElement('div'); time.className = 'status-time';
    time.textContent = status ? new Date(status.time).toLocaleTimeString() : (isMine ? 'Adicionar' : 'Vazio');
    slot.appendChild(time);

    slot.addEventListener('click', ()=> {
      if (isMine) location.href = 'status.html';
      else if (status) showStatusModal(status);
      else alert('Ainda não há status aqui.');
    });

    return slot;
  }

  function createEmptySlot(index){
    const slot = document.createElement('div'); slot.className = 'status-slot';
    const ring = document.createElement('div'); ring.className = 'status-ring empty';
    ring.innerHTML = `<div style="font-size:22px;color:rgba(15,23,42,0.12)">+</div>`;
    slot.appendChild(ring);
    const nm = document.createElement('div'); nm.className = 'status-name'; nm.textContent = 'Vazio';
    slot.appendChild(nm);
    const time = document.createElement('div'); time.className = 'status-time'; time.textContent = '';
    slot.appendChild(time);
    slot.addEventListener('click', ()=> alert('Ainda não há status aqui.'));
    return slot;
  }

  function showStatusModal(s){
    mediaHolder.innerHTML = '';
    const container = document.createElement('div');
    container.style.padding = '18px';
    container.style.background = s.bgColor || '#0b5ed7';
    container.style.borderRadius = '12px';
    container.style.color = '#fff';
    container.style.maxWidth = '420px';
    container.innerHTML = `<div style="font-size:18px;margin-bottom:8px">${escapeHtml(s.text)}</div>`;
    if (s.image) { const img = document.createElement('img'); img.src = s.image; img.style.maxWidth='100%'; container.appendChild(img); }
    if (s.video) { const v = document.createElement('video'); v.src = s.video; v.controls = true; v.style.maxWidth='100%'; container.appendChild(v); }
    mediaHolder.appendChild(container);
    mediaModal.style.display = 'flex';
  }

  closeMedia.addEventListener('click', ()=> { mediaModal.style.display = 'none'; mediaHolder.innerHTML = ''; });

  function renderFeed(){
    feedEl.innerHTML = '';
    const friends = DB.getFriends();
    const visible = posts.filter(p => {
      if (p.privacy === 'public') return true;
      if (p.privacy === 'onlyme') return p.authorEmail === session;
      if (p.privacy === 'friends') {
        return friends.some(f => (f.a === session && f.b === p.authorEmail) || (f.b === session && f.a === p.authorEmail)) || p.authorEmail === session;
      }
      return true;
    });

    const start = page * pageSize;
    const items = visible.slice(start, start + pageSize);
    items.forEach(p => feedEl.appendChild(postElement(p)));
    loadMoreBtn.style.display = (start + pageSize >= visible.length) ? 'none' : 'block';
  }

  function postElement(post){
    const div = document.createElement('div'); div.className = 'post card';
    const time = new Date(post.time).toLocaleString();
    div.innerHTML = `
      <div class="meta">
        <img src="${post.avatar||'avatar-default.png'}" alt="">
        <div style="flex:1">
          <strong>${escapeHtml(post.name)}</strong>
          <div class="muted" style="font-size:12px">${time} • ${escapeHtml(post.privacy)}</div>
        </div>
        <div>${post.authorEmail === session ? '<button class="btn small editBtn">Editar</button> <button class="btn small danger deleteBtn">Apagar</button>' : ''}</div>
      </div>
      <div class="content">${post.text ? escapeHtml(post.text) : ''}</div>
      <div class="media"></div>
      <div class="actions">
        <button class="btn small likeBtn" data-post="${post.id}">👍 <span class="count-like">${post.reactions?.like||0}</span></button>
        <button class="btn small reactBtn" data-post="${post.id}">❤️</button>
        <button class="btn small commentToggle" data-post="${post.id}">Comentários (${post.comments?.length||0})</button>
        <button class="btn small shareBtn" data-post="${post.id}">Partilhar</button>
      </div>
      <div class="reaction-list" data-post="${post.id}" style="margin-top:8px"></div>
      <div class="comments" data-post="${post.id}" style="display:none;margin-top:8px"></div>
    `;
    const mediaWrap = div.querySelector('.media');
    if (post.image) {
      const img = document.createElement('img'); img.src = post.image; img.alt='foto';
      img.addEventListener('click', ()=> { mediaHolder.innerHTML = `<img src="${post.image}">`; mediaModal.style.display='flex'; });
      mediaWrap.appendChild(img);
    } else if (post.video) {
      const v = document.createElement('video'); v.src = post.video; v.controls = true; mediaWrap.appendChild(v);
    }

    const reactionList = div.querySelector('.reaction-list');
    reactionList.innerHTML = renderReactionSummary(post);

    const commentsWrap = div.querySelector('.comments');
    commentsWrap.innerHTML = renderCommentsHtml(post);

    div.querySelectorAll('[data-post]').forEach(el => el.dataset.post = post.id);

    return div;
  }

  function renderReactionSummary(post){
    const parts = [];
    const reactions = post.reactions || {};
    for (const k of EMO_KEYS) {
      if (reactions[k]) parts.push(`${EMOJIS[k]} ${reactions[k]}`);
    }
    return parts.join('  ');
  }

  function renderCommentsHtml(post){
    const comments = post.comments || [];
    const top = comments.filter(c => !c.parentId);
    const container = document.createElement('div');
    top.forEach(c => {
      const el = document.createElement('div');
      el.style.padding='8px'; el.style.borderRadius='8px'; el.style.background='#f8fafc'; el.style.marginBottom='6px';
      el.innerHTML = `<strong>${escapeHtml(c.name)}</strong> <span class="muted" style="font-size:12px">${new Date(c.time).toLocaleString()}</span><div style="margin-top:6px">${escapeHtml(c.text)}</div>
        <div style="margin-top:6px"><button class="btn tiny replyBtn" data-comment="${c.id}" data-post="${post.id}">Responder</button></div>`;
      const replies = comments.filter(r => r.parentId === c.id);
      if (replies.length) {
        const repWrap = document.createElement('div'); repWrap.style.marginTop='8px'; repWrap.style.marginLeft='12px';
        replies.forEach(r => {
          const rEl = document.createElement('div'); rEl.style.padding='6px'; rEl.style.background='#fff'; rEl.style.borderRadius='6px'; rEl.style.marginBottom='6px';
          rEl.innerHTML = `<strong>${escapeHtml(r.name)}</strong> <div class="muted" style="font-size:12px">${new Date(r.time).toLocaleString()}</div><div>${escapeHtml(r.text)}</div>`;
          repWrap.appendChild(rEl);
        });
        el.appendChild(repWrap);
      }
      container.appendChild(el);
    });

    const inputRow = document.createElement('div');
    inputRow.style.display='flex'; inputRow.style.gap='8px'; inputRow.style.marginTop='8px';
    inputRow.innerHTML = `<input class="commentInput" placeholder="Escrever um comentário..." style="flex:1;padding:8px;border-radius:8px;border:1px solid #e6eef6"><button class="btn small commentSend" data-post="">Enviar</button>`;
    container.appendChild(inputRow);
    return container.innerHTML;
  }

  let reactionPopup = null;
  function showReactionPopup(targetEl, postId){
    hideReactionPopup();
    reactionPopup = document.createElement('div');
    reactionPopup.className = 'reaction-popup';
    EMO_KEYS.forEach(k => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.innerText = EMOJIS[k];
      btn.title = k;
      btn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        applyReaction(postId, k);
        hideReactionPopup();
      });
      reactionPopup.appendChild(btn);
    });
    document.body.appendChild(reactionPopup);
    const rect = targetEl.getBoundingClientRect();
    reactionPopup.style.left = (rect.left + rect.width/2 - reactionPopup.offsetWidth/2) + 'px';
    reactionPopup.style.top = (rect.top - reactionPopup.offsetHeight - 8) + 'px';
  }
  function hideReactionPopup(){ if (reactionPopup && reactionPopup.parentNode) reactionPopup.parentNode.removeChild(reactionPopup); reactionPopup = null; }

  function applyReaction(postId, emojiKey){
    posts = DB.getPosts() || [];
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    post.reactions = post.reactions || {};
    post.userReactions = post.userReactions || {};
    const prev = post.userReactions[session];
    if (prev === emojiKey) {
      post.reactions[prev] = Math.max(0,(post.reactions[prev]||1)-1);
      delete post.userReactions[session];
    } else {
      if (prev) post.reactions[prev] = Math.max(0,(post.reactions[prev]||1)-1);
      post.reactions[emojiKey] = (post.reactions[emojiKey]||0) + 1;
      post.userReactions[session] = emojiKey;
    }
    DB.savePosts(posts);
    renderFeed();
  }

  function toggleLike(postId){ applyReaction(postId, 'like'); }

  function sendComment(postId, text, parentId = null){
    if (!text || !text.trim()) return;
    posts = DB.getPosts() || [];
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    post.comments = post.comments || [];
    const me = DB.getUsers().find(u => (u.email||'').toLowerCase() === session);
    const comment = { id: 'c'+Date.now(), authorEmail: session, name: me ? me.name : session, text: text.trim(), time: new Date().toISOString(), parentId: parentId || null };
    post.comments.push(comment);
    DB.savePosts(posts);
    if (post.authorEmail !== session) DB.pushNotification(post.authorEmail, session, 'comment', `${me ? me.name : session} comentou na sua publicação`, { postId: post.id, commentId: comment.id });
    renderFeed();
  }

  function replyToComment(postId, parentCommentId, replyText){
    sendComment(postId, replyText, parentCommentId);
    posts = DB.getPosts() || [];
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const parent = post.comments.find(x => x.id === parentCommentId);
    if (parent && parent.authorEmail !== session) {
      const me = DB.getUsers().find(u => (u.email||'').toLowerCase() === session);
      DB.pushNotification(parent.authorEmail, session, 'reply', `${me ? me.name : session} respondeu ao seu comentário`, { postId: post.id, parentId: parentCommentId });
    }
  }

  function sharePost(postId){
    posts = DB.getPosts() || [];
    const original = posts.find(p => p.id === postId);
    if (!original) return;
    const me = DB.getUsers().find(u => (u.email||'').toLowerCase() === session);
    const shared = {
      id: 'p'+Date.now(),
      authorEmail: session,
      name: me ? me.name : session,
      avatar: me ? me.avatar : 'avatar-default.png',
      text: `Compartilhou: ${original.text || ''}`,
      image: original.image || null,
      video: original.video || null,
      time: new Date().toISOString(),
      reactions: {}, userReactions: {}, comments: [], privacy: 'public'
    };
    posts.unshift(shared);
    DB.savePosts(posts);
    renderFeed();
  }

  feedEl.addEventListener('click', (e) => {
    const likeBtn = e.target.closest('.likeBtn');
    if (likeBtn) { const postId = likeBtn.dataset.post; toggleLike(postId); return; }

    const reactBtn = e.target.closest('.reactBtn');
    if (reactBtn) { const postId = reactBtn.dataset.post; showReactionPopup(reactBtn, postId); return; }

    const shareBtn = e.target.closest('.shareBtn');
    if (shareBtn) { const postId = shareBtn.dataset.post; sharePost(postId); return; }

    const commentToggle = e.target.closest('.commentToggle');
    if (commentToggle) {
      const postId = commentToggle.dataset.post;
      const commentsWrap = feedEl.querySelector(`.comments[data-post="${postId}"]`);
      if (!commentsWrap) return;
      commentsWrap.style.display = commentsWrap.style.display === 'none' ? 'block' : 'none';
      posts = DB.getPosts() || [];
      const post = posts.find(p => p.id === postId);
      if (post) commentsWrap.innerHTML = renderCommentsHtml(post);
      // set data-post on send button
      const sendBtn = commentsWrap.querySelector('.commentSend');
      if (sendBtn) sendBtn.dataset.post = postId;
      return;
    }

    const replyBtn = e.target.closest('.replyBtn');
    if (replyBtn) {
      const parentId = replyBtn.dataset.comment;
      const postId = replyBtn.dataset.post;
      const replyText = prompt('Responder ao comentário:');
      if (replyText && replyText.trim()) replyToComment(postId, parentId, replyText.trim());
      return;
    }

    const commentSend = e.target.closest('.commentSend');
    if (commentSend) {
      const postId = commentSend.dataset.post || (() => {
        const container = commentSend.closest('.comments');
        return container ? container.dataset.post : null;
      })();
      if (!postId) return;
      const input = commentSend.parentElement.querySelector('.commentInput');
      if (!input) return;
      const text = input.value || '';
      if (!text.trim()) return;
      sendComment(postId, text);
      return;
    }

    const deleteBtn = e.target.closest('.deleteBtn');
    if (deleteBtn) {
      const postDiv = deleteBtn.closest('.post');
      const postId = postDiv && postDiv.querySelector('[data-post]') ? postDiv.querySelector('[data-post]').dataset.post : null;
      if (!postId) return;
      if (!confirm('Apagar esta publicação?')) return;
      posts = DB.getPosts() || [];
      posts = posts.filter(p => p.id !== postId);
      DB.savePosts(posts);
      renderFeed();
      return;
    }

    const editBtn = e.target.closest('.editBtn');
    if (editBtn) {
      const postDiv = editBtn.closest('.post');
      const postId = postDiv && postDiv.querySelector('[data-post]') ? postDiv.querySelector('[data-post]').dataset.post : null;
      if (!postId) return;
      const postsArr = DB.getPosts() || [];
      const post = postsArr.find(p => p.id === postId);
      if (!post) return;
      const newText = prompt('Editar publicação', post.text || '');
      if (newText !== null) { post.text = newText; DB.savePosts(postsArr); renderFeed(); }
      return;
    }
  });

  feedEl.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const input = e.target;
    if (!input.classList.contains('commentInput')) return;
    e.preventDefault();
    const postContainer = input.closest('.comments');
    if (!postContainer) return;
    const postId = postContainer.dataset.post;
    const text = input.value || '';
    if (!text.trim()) return;
    sendComment(postId, text);
  });

  document.addEventListener('click', (e) => {
    if (reactionPopup && !reactionPopup.contains(e.target) && !e.target.closest('.reactBtn')) hideReactionPopup();
  });

  function renderSuggestions(){
    suggestions.innerHTML = '';
    const all = DB.getUsers().filter(u => (u.email||'').toLowerCase() !== session);
    const friends = DB.getFriends();
    const notFriends = all.filter(u => !friends.some(f => (f.a===session && f.b===u.email) || (f.b===session && f.a===u.email)));
    notFriends.slice(0,4).forEach(u => {
      const div = document.createElement('div'); div.style.display='flex';div.style.justifyContent='space-between';div.style.marginBottom='8px';
      div.innerHTML = `<div style="display:flex;gap:8px;align-items:center"><img src="${u.avatar||'avatar-default.png'}" style="width:44px;height:44px;border-radius:8px"><div><strong>${escapeHtml(u.name)}</strong><div class="muted" style="font-size:12px">${escapeHtml(u.email)}</div></div></div><div><button class="btn small addFriendBtn" data-email="${escapeHtml(u.email)}">Adicionar</button></div>`;
      suggestions.appendChild(div);
    });
    suggestions.querySelectorAll('.addFriendBtn').forEach(b => b.addEventListener('click', ()=> { Friendship.sendRequestTo(b.getAttribute('data-email')); b.textContent='Enviado'; b.disabled=true; }));
  }

  window.addEventListener('storage', (e) => {
    posts = DB.getPosts() || [];
    statuses = DB.getStatuses() || [];
    renderStatuses();
    renderFeed();
  });

  setInterval(() => {
    const newPosts = DB.getPosts() || [];
    const newStatuses = DB.getStatuses() || [];
    if (newPosts.length !== posts.length || newStatuses.length !== statuses.length) {
      posts = newPosts; statuses = newStatuses;
      renderStatuses(); renderFeed();
    }
  }, 1500);

  renderAll();

  document.getElementById('addStatusBtn').addEventListener('click', ()=> location.href='status.html');
  document.getElementById('createPostBtn').addEventListener('click', ()=> location.href='create_post.html');
  document.getElementById('loadMore').addEventListener('click', ()=> { page++; renderFeed(); });

})();