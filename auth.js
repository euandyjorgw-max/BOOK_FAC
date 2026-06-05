// auth.js
// Normaliza emails para lowercase; garante que contas criadas aparecem na pesquisa.

function showMsg(id, text, timeout=3500){
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  if (timeout) setTimeout(()=> { if (el) el.textContent = ''; }, timeout);
}
function validateEmail(email){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// SIGNUP
const signupForm = document.getElementById('signupForm');
if (signupForm) {
  signupForm.addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const email = (document.getElementById('email').value || '').trim().toLowerCase();
    const password = document.getElementById('password').value;
    const confirm = document.getElementById('confirm').value;
    const secCode = (document.getElementById('secCode').value || '').trim();

    if (!name) { showMsg('signupMsg','Nome obrigatório'); return; }
    if (!validateEmail(email)) { showMsg('signupMsg','Email inválido'); return; }
    if (password.length < 4) { showMsg('signupMsg','Senha muito curta'); return; }
    if (password !== confirm) { showMsg('signupMsg','Senhas não coincidem'); return; }
    if (!/^\d{4}$/.test(secCode)) { showMsg('signupMsg','Código de segurança deve ter 4 dígitos'); return; }

    const users = DB.getUsers();
    if (users.some(u => (u.email||'').toLowerCase() === email)) { showMsg('signupMsg','Email já cadastrado'); return; }

    users.push({ name, email, password, secCode, avatar: 'avatar-default.png' });
    DB.saveUsers(users);
    DB.setSession(email);
    window.location.href = 'feed.html';
  });
}

// LOGIN
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const email = (document.getElementById('loginEmail').value || '').trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;
    if (!validateEmail(email)) { showMsg('loginMsg','Email inválido'); return; }
    const users = DB.getUsers();
    const user = users.find(u => (u.email||'').toLowerCase() === email && u.password === password);
    if (!user) {
      showMsg('loginMsg','Dados incorretos. Crie uma conta primeiro.');
      return;
    }
    DB.setSession(email);
    window.location.href = 'feed.html';
  });
}

// FORGOT (recuperar por nome + código — mostra senha conforme pedido)
const forgotForm = document.getElementById('forgotForm');
if (forgotForm) {
  forgotForm.addEventListener('submit', e => {
    e.preventDefault();
    const name = (document.getElementById('forgotName').value || '').trim();
    const code = (document.getElementById('forgotCode').value || '').trim();
    const users = DB.getUsers();
    const user = users.find(u => u.name === name && u.secCode === code);
    if (!user) {
      showMsg('forgotMsg','Nome ou código incorreto');
      return;
    }
    showMsg('forgotMsg', `Senha encontrada: ${user.password}`, 10000);
  });
}