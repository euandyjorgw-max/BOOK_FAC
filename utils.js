

function showMsg(id, text, timeout=3500){
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  if (timeout) setTimeout(()=> { if (el) el.textContent = ''; }, timeout);
}
function validateEmail(email){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}