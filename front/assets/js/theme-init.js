/** Aplica tema salvo antes do paint (evita flash). Mesma chave que panel-theme.js. */
(function () {
  var KEY = 'pi_gym_panel_theme';
  try {
    var t = localStorage.getItem(KEY);
    if (t !== 'light' && t !== 'dark') {
      t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-bs-theme', t);
  } catch (e) {
    document.documentElement.setAttribute('data-bs-theme', 'light');
  }
})();
