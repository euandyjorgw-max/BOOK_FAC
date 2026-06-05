// nav.js
// Comportamento da barra superior: navegação, destaque e badges.

(function(){
  // navigation by data-target
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-target');
      if (!target) return;
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      window.location.href = target;
    });
  });

  // highlight active based on filename
  (function highlightActive(){
    const path = location.pathname.split('/').pop() || 'feed.html';
    const map = {
      'feed.html':'nav-home',
      'friend_requests.html':'nav-requests',
      'messages.html':'nav-messages',
      'notifications.html':'nav-notifs',
      'settings.html':'nav-settings',
      'profile.html':'nav-profile'
    };
    const id = map[path];
    if (id) {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      const el = document.getElementById(id);
      if (el) el.classList.add('active');
    }
  })();

  // update badges periodically
  function updateBadges(){
    const session = DB.getSession();
    if (!session) return;
    const reqs = DB.getFriendRequests().filter(r => r.to === session && r.status === 'pending').length;
    const convs = DB.getConversations() || [];
    const unreadMsgs = convs.reduce((acc,c) => acc + (Array.isArray(c.messages) ? c.messages.filter(m => m.to === session && !m.read).length : 0), 0);
    const notifs = DB.getNotifications().filter(n => n.to === session && !n.read).length;

    const bReq = document.getElementById('badge-requests');
    const bMsg = document.getElementById('badge-messages');
    const bNot = document.getElementById('badge-notifs');

    if (bReq) { bReq.textContent = reqs || ''; bReq.style.display = reqs ? 'inline-flex' : 'none'; }
    if (bMsg) { bMsg.textContent = unreadMsgs || ''; bMsg.style.display = unreadMsgs ? 'inline-flex' : 'none'; }
    if (bNot) { bNot.textContent = notifs || ''; bNot.style.display = notifs ? 'inline-flex' : 'none'; }
  }

  updateBadges();
  setInterval(updateBadges, 2000);
})();