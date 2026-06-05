/** Utilitários compartilhados entre member.html e owner.html */

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showPanelError(msg) {
  const alertEl = document.getElementById('alert');
  if (!alertEl) return;
  alertEl.textContent = msg;
  alertEl.classList.remove('d-none');
}

function hidePanelError() {
  const alertEl = document.getElementById('alert');
  if (!alertEl) return;
  alertEl.classList.add('d-none');
}

function setWhoBar(me) {
  const gymEl = document.getElementById('whoGym');
  const sepEl = document.getElementById('whoSep');
  const emailEl = document.getElementById('whoEmail');
  if (!emailEl) return;

  const name = me.user.gym && me.user.gym.name ? me.user.gym.name : '';
  emailEl.textContent = me.user.email;
  if (!gymEl || !sepEl) return;

  if (name) {
    gymEl.textContent = name;
    gymEl.classList.remove('d-none');
    sepEl.classList.remove('d-none');
  } else {
    gymEl.textContent = '';
    gymEl.classList.add('d-none');
    sepEl.classList.add('d-none');
  }
}

function switchPanelSection(section) {
  document.querySelectorAll('.content-section').forEach((el) => {
    el.classList.toggle('d-none', el.id !== 'section-' + section);
  });
  document.querySelectorAll('.sidebar-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.section === section);
  });
}

function bindSidebarSections(resolveSection) {
  document.querySelectorAll('.sidebar-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      let section = btn.dataset.section;
      if (typeof resolveSection === 'function') {
        section = resolveSection(section);
      }
      switchPanelSection(section);
    });
  });
}

function bindPanelLogout() {
  document.getElementById('btnLogout')?.addEventListener('click', () => logout());
}

async function withButtonLoading(btn, loadingHtml, fn) {
  const original = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = loadingHtml;
  try {
    return await fn();
  } finally {
    btn.disabled = false;
    btn.innerHTML = original;
  }
}
