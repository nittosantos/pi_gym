(function () {
  const membersBody = document.getElementById('membersBody');
  const memberSelect = document.getElementById('memberSelect');
  const checkinMemberFilter = document.getElementById('checkinMemberFilter');
  const workoutsList = document.getElementById('workoutsList');
  const checkinsBody = document.getElementById('checkinsBody');
  const editModal = new bootstrap.Modal(document.getElementById('editModal'));
  const suspendModal = new bootstrap.Modal(document.getElementById('suspendModal'));

  const SPINNER = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>';

  bindSidebarSections();
  bindPanelLogout();

  document.getElementById('goMembers').addEventListener('click', () => switchPanelSection('members'));
  document.getElementById('goMembersPending').addEventListener('click', () => switchPanelSection('members'));
  document.getElementById('goCheckins').addEventListener('click', () => switchPanelSection('checkins'));
  document.getElementById('goWorkouts').addEventListener('click', () => switchPanelSection('workouts'));

  document.getElementById('refreshDashboard').addEventListener('click', async () => {
    const btn = document.getElementById('refreshDashboard');
    hidePanelError();
    await withButtonLoading(btn, SPINNER + 'Atualizando...', async () => {
      await loadMembers();
      await loadCheckins();
    }).catch((e) => showPanelError(e.message));
  });

  async function gate() {
    try {
      const me = await getMe();
      if (me.user.role !== 'owner') {
        window.location.href = 'member.html';
        return null;
      }
      setWhoBar(me);
      return me;
    } catch {
      window.location.href = 'login.html';
      return null;
    }
  }

  async function loadMembers() {
    const data = await apiJson('/owner/members');
    membersBody.innerHTML = '';
    const opts = '<option value="">Selecione um aluno…</option>';
    let optionsHtml = opts;
    const totalColsMembers = 5;

    for (const m of data.members) {
      const tr = document.createElement('tr');
      const accountBadge =
        m.status === 'active'
          ? '<span class="status-pill status-active">Ativo</span>'
          : '<span class="status-pill status-pending">Pendente</span>';
      let membershipBadge = '';
      if (m.membership_status === 'active') {
        membershipBadge = '<span class="status-pill status-active">Ativo</span>';
      } else if (m.membership_status === 'suspended') {
        membershipBadge = '<span class="status-pill status-suspended">Suspenso</span>';
      } else {
        membershipBadge = '<span class="status-pill status-pending">Pendente</span>';
      }
      let actionCell = '';
      if (m.membership_status === 'pending') {
        actionCell = `<button type="button" class="btn btn-sm btn-success" data-approve="${m.id}">Aprovar</button>`;
      } else if (m.membership_status === 'active') {
        actionCell = `<button type="button" class="btn btn-sm btn-outline-warning" data-suspend="${m.id}">Suspender</button>`;
      } else if (m.membership_status === 'suspended') {
        actionCell = `<button type="button" class="btn btn-sm btn-success" data-reactivate="${m.id}">Reativar</button>`;
      }
      tr.innerHTML = `
            <td>${m.id}</td>
            <td>${escapeHtml(m.email)}</td>
            <td>${accountBadge}</td>
            <td>${membershipBadge}</td>
            <td>${actionCell}</td>`;
      membersBody.appendChild(tr);
      optionsHtml += `<option value="${m.id}">${escapeHtml(m.email)} (#${m.id})</option>`;
    }

    memberSelect.innerHTML = optionsHtml;
    checkinMemberFilter.innerHTML =
      '<option value="">Todos os alunos</option>' +
      data.members.map((m) => `<option value="${m.id}">${escapeHtml(m.email)}</option>`).join('');
    document.getElementById('metricMembers').textContent = data.members.length;
    document.getElementById('metricPending').textContent = data.members.filter(
      (m) => m.membership_status === 'pending'
    ).length;
    if (!data.members.length) {
      membersBody.innerHTML = `<tr><td colspan="${totalColsMembers}" class="text-center text-secondary py-4">Nenhum aluno cadastrado ainda.</td></tr>`;
    }

    membersBody.querySelectorAll('[data-approve]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-approve');
        await withButtonLoading(btn, SPINNER + 'Aprovando...', async () => {
          await apiJson('/owner/members/' + id + '/approve', { method: 'POST' });
          await loadMembers();
          await loadCheckins();
        }).catch((e) => showPanelError(e.message));
      });
    });

    membersBody.querySelectorAll('[data-suspend]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.getElementById('suspendMemberId').value = btn.getAttribute('data-suspend');
        document.getElementById('suspendReason').value = 'inadimplencia';
        suspendModal.show();
      });
    });

    membersBody.querySelectorAll('[data-reactivate]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-reactivate');
        await withButtonLoading(btn, SPINNER + 'Reativando...', async () => {
          await apiJson('/owner/members/' + id + '/reactivate', { method: 'POST' });
          await loadMembers();
          await loadCheckins();
        }).catch((e) => showPanelError(e.message));
      });
    });
  }

  async function loadWorkouts() {
    const mid = parseInt(memberSelect.value, 10);
    if (!mid) {
      showPanelError('Selecione um aluno.');
      return;
    }
    hidePanelError();
    const data = await apiJson('/owner/workouts?member_id=' + encodeURIComponent(mid));
    workoutsList.innerHTML = '';
    if (!data.workouts.length) {
      workoutsList.innerHTML =
        '<li class="list-group-item text-center text-secondary py-4">Nenhum treino cadastrado para este aluno.</li>';
      return;
    }
    for (const w of data.workouts) {
      const li = document.createElement('li');
      li.className = 'list-group-item d-flex justify-content-between align-items-start gap-2 py-3';
      li.innerHTML = `
            <div class="me-auto">
              <div class="fw-semibold">${w.title ? escapeHtml(w.title) : 'Treino #' + w.id}</div>
              <div class="small text-secondary">${escapeHtml(w.content).replace(/\n/g, '<br>')}</div>
            </div>
            <div class="btn-group btn-group-sm">
              <button type="button" class="btn btn-outline-primary" data-edit="${w.id}">
                <i class="bi bi-pencil-square"></i>
              </button>
              <button type="button" class="btn btn-outline-danger" data-del="${w.id}">
                <i class="bi bi-trash"></i>
              </button>
            </div>`;
      workoutsList.appendChild(li);
    }

    workoutsList.querySelectorAll('[data-edit]').forEach((b) => {
      b.addEventListener('click', async () => {
        const id = b.getAttribute('data-edit');
        const w = data.workouts.find((x) => String(x.id) === String(id));
        if (!w) {
          showPanelError('Treino não encontrado. Recarregue a lista.');
          return;
        }
        document.getElementById('editId').value = w.id;
        document.getElementById('editTitle').value = w.title || '';
        document.getElementById('editContent').value = w.content || '';
        editModal.show();
      });
    });
    workoutsList.querySelectorAll('[data-del]').forEach((b) => {
      b.addEventListener('click', async () => {
        if (!confirm('Excluir este treino?')) return;
        const id = b.getAttribute('data-del');
        await withButtonLoading(b, SPINNER + 'Excluindo...', async () => {
          await apiJson('/owner/workouts/' + id, { method: 'DELETE' });
          await loadWorkouts();
        }).catch((e) => showPanelError(e.message));
      });
    });
  }

  let checkinsLoading = false;
  async function loadCheckins() {
    if (checkinsLoading) return;
    checkinsLoading = true;
    checkinMemberFilter.disabled = true;
    const mid = checkinMemberFilter.value;
    try {
      const q = mid ? '?member_id=' + encodeURIComponent(mid) : '';
      const data = await apiJson('/owner/checkins' + q);
      document.getElementById('metricCheckins').textContent = data.checkins.filter((c) =>
        isBusinessToday(c.checked_in_at)
      ).length;
      if (!data.checkins.length) {
        checkinsBody.innerHTML =
          '<tr><td colspan="6" class="text-center text-secondary py-4">Nenhum check-in encontrado.</td></tr>';
        return;
      }
      checkinsBody.innerHTML = data.checkins
        .map((c) => {
          const memberDisplay = friendlyMemberName(c.member_email, c.member_user_id);
          return `<tr>
                  <td class="fw-semibold">${c.id}</td>
                  <td>${escapeHtml(memberDisplay.name)}</td>
                  <td>${escapeHtml(c.member_email || '')}</td>
                  <td>${escapeHtml(c.workout_title || '-')}</td>
                  <td>${escapeHtml(formatDateTimeLine(c.checked_in_at))}</td>
                  <td>${
                    c.checked_out_at
                      ? escapeHtml(formatDateTimeLine(c.checked_out_at))
                      : '<span class="status-pill status-pending">Em aberto</span>'
                  }</td>
                </tr>`;
        })
        .join('');
    } finally {
      checkinMemberFilter.disabled = false;
      checkinsLoading = false;
    }
  }

  function friendlyMemberName(email, userId) {
    const fallback = { name: 'Aluno', id: String(userId ?? '') };
    if (!email) return fallback;
    const local = String(email).split('@')[0] || '';
    if (!local) return fallback;
    const cleaned = local.replace(/[._-]+/g, ' ').trim();
    if (!cleaned) return fallback;
    const normalized = cleaned
      .split(' ')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
    return { name: normalized || 'Aluno', id: String(userId ?? '') };
  }

  document.getElementById('btnConfirmSuspend').addEventListener('click', async () => {
    const id = document.getElementById('suspendMemberId').value;
    const reason = document.getElementById('suspendReason').value;
    const btn = document.getElementById('btnConfirmSuspend');
    hidePanelError();
    await withButtonLoading(btn, SPINNER + 'Processando...', async () => {
      await apiJson('/owner/members/' + id + '/suspend', {
        method: 'POST',
        body: { reason },
      });
      suspendModal.hide();
      await loadMembers();
      await loadCheckins();
    }).catch((e) => showPanelError(e.message));
  });

  document.getElementById('btnLoadWorkouts').addEventListener('click', async () => {
    const btn = document.getElementById('btnLoadWorkouts');
    await withButtonLoading(btn, SPINNER + 'Carregando...', () => loadWorkouts()).catch((e) =>
      showPanelError(e.message)
    );
  });

  document.getElementById('checkinMemberFilter').addEventListener('change', () => {
    loadCheckins().catch((e) => showPanelError(e.message));
  });

  document.getElementById('btnAddWorkout').addEventListener('click', async () => {
    const btn = document.getElementById('btnAddWorkout');
    hidePanelError();
    const mid = parseInt(memberSelect.value, 10);
    if (!mid) {
      showPanelError('Selecione um aluno.');
      return;
    }
    const title = document.getElementById('wTitle').value.trim();
    const content = document.getElementById('wContent').value.trim();
    if (!content) {
      showPanelError('Preencha o conteúdo do treino.');
      return;
    }
    await withButtonLoading(btn, SPINNER + 'Adicionando...', async () => {
      await apiJson('/owner/workouts', {
        method: 'POST',
        body: { member_user_id: mid, title, content },
      });
      document.getElementById('wTitle').value = '';
      document.getElementById('wContent').value = '';
      await loadWorkouts();
    }).catch((e) => showPanelError(e.message));
  });

  document.getElementById('btnSaveEdit').addEventListener('click', async () => {
    const btn = document.getElementById('btnSaveEdit');
    hidePanelError();
    const id = document.getElementById('editId').value;
    const title = document.getElementById('editTitle').value.trim();
    const content = document.getElementById('editContent').value.trim();
    await withButtonLoading(btn, SPINNER + 'Salvando...', async () => {
      await apiJson('/owner/workouts/' + id, {
        method: 'PATCH',
        body: { title, content },
      });
      editModal.hide();
      await loadWorkouts();
    }).catch((e) => showPanelError(e.message));
  });

  (async function init() {
    const me = await gate();
    if (!me) return;
    switchPanelSection('dashboard');
    try {
      await loadMembers();
      await loadCheckins();
    } catch (e) {
      showPanelError(e.message);
    }
  })();
})();
