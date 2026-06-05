// ui.js (atualizado)
const UI = {
  showWelcome(email) {
    const users = DB.getUsers();
    const user = users.find(u => u.email === email);
    if (user) document.title = `Book-face — ${user.name}`;
  },

  createPostElement(post) {
    const session = DB.getSession();
    const users = DB.getUsers();
    const authorIsMe = post.authorEmail === session;
    const div = document.createElement('div');
    div.className = 'post card';
    const time = new Date(post.time).toLocaleString();
    const reactionsSummary = Object.entries(post.reactions || {}).map(([k,v]) => `${k} ${v}`).join(' • ');

    div.innerHTML = `
      <div class="meta">
        <img src="${post.avatar || 'avatar-default.png'}" alt="">
        <div style="flex:1">
          <strong>${post.name}</strong>
          <div class="muted" style="font-size:12px">${time} • ${post.privacy}</div>
        </div>
        <div>
          ${authorIsMe ? '<button class="btn small editBtn">Editar</button> <button class="btn small danger deleteBtn">Apagar</button>' : '<button class="btn small addFriendBtn">Adicionar</button>'}
        </div>
      </div>
      <div class="content">${escapeHtml(post.text)}</div>
      ${post.image ? `<div style="margin-top:8px"><img src="${post.image}" style="max-width:100%;border-radius:8px"></div>` : ''}
      <div class="actions" style="margin-top:8px">
        <button class="btn small likeBtn">Curtir (${post.reactions?.like||0})</button>
        <button class="btn small reactBtn">Reagir</button>
        <button class="btn small commentToggle">Comentários (${post.comments?.length||0})</button>
        <a class="link" href="post.html?id=${post.id}">Ver</a>
      </div>
      <div class="comments" style="margin-top:8px;display:none">
        <div class="comment-list"></div>
        <div class="row" style="margin-top:8px">
          <input class="commentInput" placeholder="Escrever um comentário..." style="flex:1;padding:8px;border-radius:8px;border:1px solid #e6eef6">
          <button class="btn small commentSend">Enviar</button>
        </div>
      </div>
      <div class="reactions-summary muted" style="margin-top:6px;font-size:13px">${reactionsSummary}</div>
    `;

    // eventos
    div.querySelector('.likeBtn').addEventListener('click', ()=> Feed.toggleReaction(post.id, 'like'));
    div.querySelector('.reactBtn').addEventListener('click', ()=> {
      // simples menu de reações
      const r = prompt('Reação (like,love,care,wow,sad,angry):','like');
      if (r) Feed.toggleReaction(post.id, r);
    });

    const commentToggle = div.querySelector('.commentToggle');
    const commentsEl = div.querySelector('.comments');
    commentToggle.addEventListener('click', ()=> {
      commentsEl.style.display = commentsEl.style.display === 'none' ? 'block' : 'none';
      UI.renderComments(post, commentsEl.querySelector('.comment-list'));
    });

    div.querySelector('.commentSend').addEventListener('click', ()=> {
      const input = div.querySelector('.commentInput');
      const text = input.value.trim();
      if (!text) return;
      Feed.addComment(post.id, text);
      input.value = '';
    });

    if (authorIsMe) {
      div.querySelector('.deleteBtn').addEventListener('click', ()=> {
        if (confirm('Apagar este post?')) Feed.deletePost(post.id);
      });
      div.querySelector('.editBtn').addEventListener('click', ()=> {
        const newText = prompt('Editar post', post.text);
        if (newText !== null) Feed.editPost(post.id, newText);
      });
    } else {
      div.querySelector('.addFriendBtn').addEventListener('click', ()=> {
        Friendship.sendRequest(post.authorEmail);
        alert('Pedido de amizade enviado');
      });
    }

    return div;
  },

  renderComments(post, container) {
    container.innerHTML = '';
    (post.comments || []).forEach(c => {
      const el = document.createElement('div');
      el.className = 'card';
      el.style.padding = '8px';
      el.style.marginBottom = '6px';
      el.innerHTML = `<strong>${escapeHtml(c.name)}</strong> <div class="muted" style="font-size:12px">${new Date(c.time).toLocaleString()}</div><div>${escapeHtml(c.text)}</div>`;
      container.appendChild(el);
    });
  }
};