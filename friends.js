// friends.js
// Funções para gerir pedidos de amizade, lista de amigos e conversas 1:1.

const Friendship = (function(DB){
  function sendRequestTo(email){
    const session = DB.getSession();
    if (!session) throw new Error('Sem sessão');
    if ((email||'').toLowerCase() === session) return;
    const reqs = DB.getFriendRequests();
    const exists = reqs.find(r => r.from === session && r.to === email && r.status === 'pending');
    if (exists) return exists;
    const r = { id: 'fr'+Date.now()+Math.floor(Math.random()*999), from: session, to: email, status: 'pending', time: new Date().toISOString() };
    reqs.unshift(r);
    DB.saveFriendRequests(reqs);
    DB.pushNotification(email, session, 'friend_request', `${session} enviou um pedido de amizade`, { requestId: r.id });
    return r;
  }

  function acceptRequestFrom(email){
    const session = DB.getSession();
    const reqs = DB.getFriendRequests();
    const idx = reqs.findIndex(r => r.from === email && r.to === session && r.status === 'pending');
    if (idx === -1) return false;
    reqs[idx].status = 'accepted';
    DB.saveFriendRequests(reqs);
    const friends = DB.getFriends();
    friends.push({ id: 'f'+Date.now()+Math.floor(Math.random()*999), a: session, b: email, time: new Date().toISOString() });
    DB.saveFriends(friends);
    DB.pushNotification(email, session, 'friend_accept', `${session} aceitou o seu pedido de amizade`, { });
    return true;
  }

  function declineRequestFrom(email){
    const session = DB.getSession();
    const reqs = DB.getFriendRequests();
    const idx = reqs.findIndex(r => r.from === email && r.to === session && r.status === 'pending');
    if (idx === -1) return false;
    reqs[idx].status = 'declined';
    DB.saveFriendRequests(reqs);
    return true;
  }

  function cancelRequestTo(email){
    const session = DB.getSession();
    let reqs = DB.getFriendRequests();
    reqs = reqs.filter(r => !(r.from === session && r.to === email && r.status === 'pending'));
    DB.saveFriendRequests(reqs);
    return true;
  }

  function removeFriend(email){
    const session = DB.getSession();
    let friends = DB.getFriends();
    friends = friends.filter(f => !((f.a === session && f.b === email) || (f.b === session && f.a === email)));
    DB.saveFriends(friends);
    return true;
  }

  function startConversationWith(email){
    const session = DB.getSession();
    if (!session) throw new Error('Sem sessão');
    if ((email||'').toLowerCase() === session) throw new Error('Não pode conversar consigo mesmo');
    let conv = DB.findConversationBetween(session, email);
    if (conv) return conv;
    conv = DB.createConversation(session, email);
    DB.pushNotification(email, session, 'conversation_started', `${session} iniciou uma conversa`, { convId: conv.id });
    return conv;
  }

  function getConversations(){ return DB.getConversations(); }
  function getFriendsList(){ return DB.getFriends(); }
  function getFriendRequestsList(){ return DB.getFriendRequests(); }

  return {
    sendRequestTo,
    acceptRequestFrom,
    declineRequestFrom,
    cancelRequestTo,
    removeFriend,
    startConversationWith,
    getConversations,
    getFriendsList,
    getFriendRequestsList
  };
})(DB);