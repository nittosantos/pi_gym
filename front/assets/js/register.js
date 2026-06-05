(function () {
  const alertEl = document.getElementById('alert');
  const gymMultipleWrap = document.getElementById('gymMultipleWrap');
  const gymIdFixed = document.getElementById('gym_id_fixed');
  const gymSelect = document.getElementById('gym_select');
  const btnSubmit = document.getElementById('btnSubmit');

  function showLoadError(msg) {
    alertEl.className = 'alert alert-danger';
    alertEl.textContent = msg;
    alertEl.classList.remove('d-none');
  }

  async function setupGyms() {
    try {
      const data = await apiJson('/gyms');
      const gyms = data.gyms || [];
      if (!gyms.length) {
        showLoadError('Nenhuma academia configurada no sistema. Entre em contato com o suporte.');
        btnSubmit.disabled = true;
        return;
      }
      gymMultipleWrap.classList.add('d-none');
      gymIdFixed.value = '';
      if (gyms.length === 1) {
        gymIdFixed.value = String(gyms[0].id);
      } else {
        gymSelect.innerHTML = gyms.map((g) => `<option value="${g.id}">${g.name}</option>`).join('');
        gymMultipleWrap.classList.remove('d-none');
      }
      btnSubmit.disabled = false;
    } catch {
      showLoadError('Não foi possível carregar os dados. Verifique se a API e o banco estão no ar.');
      btnSubmit.disabled = true;
    }
  }

  function resolveGymId() {
    if (!gymMultipleWrap.classList.contains('d-none')) {
      return parseInt(gymSelect.value, 10);
    }
    return parseInt(gymIdFixed.value, 10);
  }

  setupGyms();

  document.getElementById('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    alertEl.classList.add('d-none');
    const gym_id = resolveGymId();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    if (!gym_id || Number.isNaN(gym_id)) {
      showLoadError('Não foi possível identificar a academia. Recarregue a página.');
      return;
    }
    try {
      const data = await apiJson('/auth/register', {
        method: 'POST',
        body: { gym_id, email, password },
      });
      alertEl.className = 'alert alert-success';
      alertEl.textContent = data.message || 'Cadastro criado.';
      alertEl.classList.remove('d-none');
      document.getElementById('form').reset();
      await setupGyms();
    } catch (err) {
      alertEl.className = 'alert alert-danger';
      alertEl.textContent = err.message || 'Erro ao cadastrar';
      alertEl.classList.remove('d-none');
    }
  });
})();
