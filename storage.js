// storage.js
(function(global){
  if (global.DB) return;

  const keys = {
    users: 'bf_users',
    session: 'bf_session',
    posts: 'bf_posts',
    statuses: 'bf_statuses',
    friendRequests: 'bf_friendRequests',
    friends: 'bf_friends',
    conversations: 'bf_conversations',
    notifications: 'bf_notifications'
  };

  function read(k){ try { return JSON.parse(localStorage.getItem(k) || '[]'); } catch(e){ return []; } }
  function write(k,v){ localStorage.setItem(k, JSON.stringify(v)); }

  function ensureInit(){
    Object.values(keys).forEach(k => { if (!localStorage.getItem(k)) localStorage.setItem(k, '[]'); });
  }

  function seedDemoUsers(){
    const users = read(keys.users);
    if (users.length) return;
    const demo = [
      { name: 'Ana Silva', email: 'ana@example.com', password: '1234', avatar:'avatar-default.png', bio:'Olá, sou a Ana.', nationality:'Moçambicana' },
      { name: 'João Pereira', email: 'joao@example.com', password: '1234', avatar:'avatar-default.png', bio:'Gosto de fotografia.', nationality:'Portuguesa' },
      { name: 'Maria Costa', email: 'maria@example.com', password: '1234', avatar:'avatar-default.png', bio:'Amo viajar.', nationality:'Brasileira' },
      { name: 'Pedro Gomes', email: 'pedro@example.com', password: '1234', avatar:'avatar-default.png', bio:'Desenvolvedor web.', nationality:'Moçambicana' }
    ];
    write(keys.users, demo);
  }

  ensureInit();
  seedDemoUsers();

  const DBobj = {
    getUsers(){ return read(keys.users); },
    saveUsers(u){ write(keys.users, u); },
    setSession(email){ localStorage.setItem(keys.session, (email||'').toLowerCase()); },
    getSession(){ return (localStorage.getItem(keys.session) || '').toLowerCase(); },
    clearSession(){ localStorage.removeItem(keys.session); },

    getPosts(){ return read(keys.posts); },
    savePosts(p){ write(keys.posts, p); },

    getStatuses(){ return read(keys.statuses); },
    saveStatuses(s){ write(keys.statuses, s); },

    getFriendRequests(){ return read(keys.friendRequests); },
    saveFriendRequests(r){ write(keys.friendRequests, r); },

    getFriends(){ return read(keys.friends); },
    saveFriends(f){ write(keys.friends, f); },

    getConversations(){ return read(keys.conversations); },
    saveConversations(c){ write(keys.conversations, c); },

    getNotifications(){ return read(keys.notifications); },
    saveNotifications(n){ write(keys.notifications, n); },

    pushNotification(to, from, type, text, meta = {}) {
      const nots = read(keys.notifications);
      const n = { id: 'n'+Date.now()+Math.floor(Math.random()*999), to, from, type, text, time: new Date().toISOString(), read:false, meta };
      nots.unshift(n);
      write(keys.notifications, nots);
      return n;
    },

    findConversationBetween(a,b){
      const convs = read(keys.conversations);
      return convs.find(c => Array.isArray(c.members) && c.members.length===2 &&
        ((c.members[0]===a && c.members[1]===b) || (c.members[0]===b && c.members[1]===a)));
    },

    createConversation(a,b){
      const convs = read(keys.conversations);
      const id = 'conv' + Date.now() + Math.floor(Math.random()*999);
      const conv = { id, members:[a,b], messages:[], lastSeen:{} };
      convs.push(conv);
      write(keys.conversations, convs);
      return conv;
    }
  };

  global.DB = DBobj;
})(window);