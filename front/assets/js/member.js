(function () {
  const pendingEl = document.getElementById('pending');
  const activeArea = document.getElementById('activeArea');
  const workoutsEl = document.getElementById('workouts');
  const historyEl = document.getElementById('historyList');
  const recordWorkoutEl = document.getElementById('recordWorkout');
  window.memberConsultationOnly = false;

  function switchSection(section) {
    if (window.memberConsultationOnly && section === 'record') {
      section = 'dashboard';
    }
    switchPanelSection(section);
  }

  bindSidebarSections((section) => {
    if (window.memberConsultationOnly && section === 'record') {
      return 'dashboard';
    }
    return section;
  });

  function applyConsultationMode(suspended, label) {
    window.memberConsultationOnly = suspended;
    const banner = document.getElementById('suspendedBanner');
    const detail = document.getElementById('suspendedBannerDetail');
    if (suspended) {
      banner.classList.remove('d-none');
      detail.textContent = label ? 'Motivo informado pela gestão: ' + label + '.' : '';
    } else {
      banner.classList.add('d-none');
      detail.textContent = '';
    }
    const recordNav = document.querySelector('.sidebar-btn[data-section="record"]');
    const btnGoRecord = document.getElementById('btnGoRecord');
    const btnSaveRecord = document.getElementById('btnSaveRecord');
    ['recordWorkout', 'arrivalTime', 'departureTime'].forEach((fid) => {
      const el = document.getElementById(fid);
      if (el) el.disabled = suspended;
    });
    [recordNav, btnGoRecord, btnSaveRecord].forEach((el) => {
      if (!el) return;
      el.disabled = suspended;
      el.classList.toggle('opacity-50', suspended);
    });
  }

  async function loadWorkouts() {
    const data = await apiJson('/member/workouts');
    workoutsEl.innerHTML = '';
    recordWorkoutEl.innerHTML = '<option value="">Selecione um treino...</option>';
    if (!data.workouts.length) {
      workoutsEl.innerHTML =
        '<div class="card shadow-sm workout-card"><div class="card-body text-center text-secondary py-4">Nenhum treino cadastrado ainda.</div></div>';
      return;
    }
    for (const w of data.workouts) {
      const card = document.createElement('div');
      card.className = 'card shadow-sm workout-card';
      card.innerHTML = `
            <div class="card-body workout-head py-2 px-3">${w.title ? escapeHtml(w.title) : 'Treino #' + w.id}</div>
            <div class="card-body">
              <div class="small text-muted mb-2">${
                w.updated_at || w.created_at
                  ? escapeHtml(formatWorkoutMeta(w.updated_at || w.created_at))
                  : ''
              }</div>
              <div class="small" style="white-space: pre-wrap">${escapeHtml(w.content)}</div>
            </div>`;
      workoutsEl.appendChild(card);
      const label = w.title ? escapeHtml(w.title) : `Treino #${w.id}`;
      recordWorkoutEl.innerHTML += `<option value="${w.id}">${label}</option>`;
    }
  }

  async function loadHistory() {
    const data = await apiJson('/member/training-history');
    if (!data.history.length) {
      historyEl.innerHTML =
        '<div class="text-center text-secondary py-3">Nenhum registro de treino ainda.</div>';
      return;
    }
    historyEl.innerHTML = data.history
      .map((r) => {
        const done = Boolean(r.checked_out_at);
        return `
              <div class="history-item p-3 d-flex justify-content-between align-items-center gap-3">
                <div class="d-flex align-items-center gap-3">
                  <span class="history-dot"><i class="bi bi-clock"></i></span>
                  <div>
                    <div>${escapeHtml(formatDateLongBr(r.checked_in_at))}</div>
                    <div class="small fw-semibold">${escapeHtml(r.workout_title || 'Treino não informado')}</div>
                    <div class="small text-secondary">${formatTimeBr(r.checked_in_at)} – ${done ? formatTimeBr(r.checked_out_at) : '--:--'}</div>
                  </div>
                </div>
                <span class="${done ? 'status-done' : 'status-open'}">${done ? 'Concluído' : 'Em aberto'}</span>
              </div>
            `;
      })
      .join('');
  }

  bindPanelLogout();

  document.getElementById('btnGoRecord').addEventListener('click', () => switchSection('record'));

  document.getElementById('btnRefresh').addEventListener('click', async () => {
    hidePanelError();
    try {
      await loadWorkouts();
      await loadHistory();
    } catch (e) {
      showPanelError(e.message);
    }
  });

  document.getElementById('btnSaveRecord').addEventListener('click', async () => {
    if (window.memberConsultationOnly) return;
    hidePanelError();
    const date = document.getElementById('recordDate').value;
    const workout_id = parseInt(recordWorkoutEl.value, 10);
    const arrival_time = document.getElementById('arrivalTime').value;
    const departure_time = document.getElementById('departureTime').value;
    if (!workout_id) {
      showPanelError('Selecione o treino realizado.');
      return;
    }
    if (!arrival_time || !departure_time) {
      showPanelError('Informe horário de chegada e saída.');
      return;
    }
    try {
      await apiJson('/member/training-records', {
        method: 'POST',
        body: { date, workout_id, arrival_time, departure_time },
      });
      recordWorkoutEl.value = '';
      document.getElementById('arrivalTime').value = '';
      document.getElementById('departureTime').value = '';
      await loadHistory();
      switchSection('dashboard');
    } catch (e) {
      showPanelError(e.message);
    }
  });

  (async function init() {
    let me;
    try {
      me = await getMe();
    } catch {
      window.location.href = 'login.html';
      return;
    }
    if (me.user.role === 'owner') {
      window.location.href = 'owner.html';
      return;
    }

    setWhoBar(me);

    const canUsePanel =
      me.user.status === 'active' &&
      (me.user.membership_status === 'active' || me.user.membership_status === 'suspended');
    if (!canUsePanel) {
      pendingEl.textContent =
        'Seu cadastro ainda não foi aprovado (ou a associação está pendente). Quando a gestão da academia aprovar, atualize esta página.';
      pendingEl.classList.remove('d-none');
      return;
    }

    const suspended = me.user.membership_status === 'suspended';
    applyConsultationMode(suspended, me.user.suspension_label || '');

    activeArea.classList.remove('d-none');
    switchSection('dashboard');
    document.getElementById('recordDate').value = todayIsoInBusinessTz();
    try {
      await loadWorkouts();
      await loadHistory();
    } catch (e) {
      showPanelError(e.message);
    }
  })();
})();
