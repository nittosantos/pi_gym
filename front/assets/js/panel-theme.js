/* Toggle tema claro/escuro nos painéis — usa data-bs-theme + localStorage */
(function () {
  var KEY = 'pi_gym_panel_theme';

  function applyIcon(theme) {
    var btn = document.getElementById('panelThemeToggle');
    if (!btn) return;
    var icon = btn.querySelector('i');
    var isDark = theme === 'dark';
    btn.title = isDark ? 'Usar tema claro' : 'Usar tema escuro';
    btn.setAttribute('aria-label', isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro');
    if (icon) {
      icon.className = isDark ? 'bi bi-sun-fill' : 'bi bi-moon-fill';
    }
  }

  function toggle() {
    var next =
      document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem(KEY, next);
    } catch (e) {}
    document.documentElement.setAttribute('data-bs-theme', next);
    applyIcon(next);
  }

  document.getElementById('panelThemeToggle')?.addEventListener('click', toggle);
  applyIcon(document.documentElement.getAttribute('data-bs-theme') || 'light');
})();
