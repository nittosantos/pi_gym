(function () {
  (async function redirectIfLoggedIn() {
    try {
      const me = await getMe();
      window.location.href = me.user.role === 'owner' ? 'owner.html' : 'member.html';
    } catch {
      /* não logado */
    }
  })();

  const alertEl = document.getElementById('alert');
  document.getElementById('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    alertEl.classList.add('d-none');
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    try {
      const data = await apiJson('/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      window.location.href = data.user.role === 'owner' ? 'owner.html' : 'member.html';
    } catch (err) {
      alertEl.textContent = err.message || 'Falha no login';
      alertEl.classList.remove('d-none');
    }
  });
})();
