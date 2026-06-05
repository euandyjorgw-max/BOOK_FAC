

// app.js
document.addEventListener('DOMContentLoaded', ()=>{
  // exemplo: proteger páginas que exigem sessão
  const protectedPages = ['feed.html','profile.html','messages.html','notifications.html','settings.html'];
  const path = location.pathname.split('/').pop();
  if(protectedPages.includes(path)){
    const user = sessionStorage.getItem('bf_user');
    if(!user) location.href = 'login.html';
  }
});