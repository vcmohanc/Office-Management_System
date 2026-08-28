// バックエンドAPIの呼び出しをまとめる。Vite の proxy 経由で http://localhost:5000 に届く。

const authHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const request = async (path, { method = 'GET', body, headers = {} } = {}) => {
  const res = await fetch(`/api${path}`, {
    method,
    headers: {
      ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...authHeader(),
      ...headers,
    },
    ...(body ? { body: body instanceof FormData ? body : JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `リクエストに失敗しました (${res.status})`);
  }
  return res.status === 204 ? null : res.json();
};

// サーバーの案件を画面が扱う形に揃える（サーバーは caseId、画面は id を使う）
export const normalizeCase = (c) => ({
  ...c,
  id: c.caseId,
  updatedOn: (c.updatedAt || c.createdAt || '').slice(0, 10),
  group: c.group || (c.targetCategory === '派遣先・農家' ? 'host' : 'staff'),
  extras: c.extras || {},
  attachments: c.attachments || [],
  installments: c.installments || [],
  comments: c.comments || [],
  history: c.history || [],
});

// §1-15 / §1-16 一覧と絞り込み
export const fetchCases = async (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '' && value !== false && value !== null && value !== undefined) {
      params.append(key, String(value));
    }
  });
  const query = params.toString();
  const cases = await request(`/cases${query ? `?${query}` : ''}`);
  return cases.map(normalizeCase);
};

export const fetchCase = async (caseId) => normalizeCase(await request(`/cases/${caseId}`));

// §1-1 立替案件登録
export const createCase = async (payload) => normalizeCase(await request('/cases', { method: 'POST', body: payload }));

export const updateCase = async (caseId, payload) =>
  normalizeCase(await request(`/cases/${caseId}`, { method: 'PUT', body: payload }));

// §1-18 承認・差戻し・取消
export const approveCase = async (caseId) => normalizeCase(await request(`/cases/${caseId}/approve`, { method: 'POST' }));
export const rejectCase = async (caseId, reason) =>
  normalizeCase(await request(`/cases/${caseId}/reject`, { method: 'POST', body: { reason } }));
export const cancelCase = async (caseId, reason) =>
  normalizeCase(await request(`/cases/${caseId}/cancel`, { method: 'POST', body: { reason } }));

// §1-7 処理状態更新（leg: 'settlement' | 'recovery'）
export const updateProcess = async (caseId, leg, payload) =>
  normalizeCase(await request(`/cases/${caseId}/process/${leg}`, { method: 'PUT', body: payload }));

// §1-10 分割天引きの各月を更新
export const updateInstallment = async (caseId, index, payload) =>
  normalizeCase(await request(`/cases/${caseId}/installments/${index}`, { method: 'PUT', body: payload }));

// §1-12 派遣先請求・控除の更新
export const updateBilling = async (caseId, payload) =>
  normalizeCase(await request(`/cases/${caseId}/billing`, { method: 'PUT', body: payload }));

// §1-17 コメント
export const addComment = async (caseId, text) =>
  normalizeCase(await request(`/cases/${caseId}/comments`, { method: 'POST', body: { text } }));

// §1-13 添付ファイル
export const uploadAttachments = async (caseId, files, kinds) => {
  const form = new FormData();
  files.forEach((file) => form.append('files', file));
  form.append('kinds', JSON.stringify(kinds));
  return normalizeCase(await request(`/cases/${caseId}/attachments`, { method: 'POST', body: form }));
};

export const deleteAttachment = async (caseId, storedName) =>
  normalizeCase(await request(`/cases/${caseId}/attachments/${storedName}`, { method: 'DELETE' }));

// 添付の閲覧は認証ヘッダーが必要なため、取得してから blob URL で開く
export const openAttachment = async (caseId, storedName) => {
  const res = await fetch(`/api/cases/${caseId}/attachments/${storedName}`, { headers: authHeader() });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || '添付ファイルを開けませんでした');
  }
  const url = URL.createObjectURL(await res.blob());
  window.open(url, '_blank', 'noopener');
  // 開いたタブが読み込むまでの猶予をとってから解放する
  setTimeout(() => URL.revokeObjectURL(url), 60000);
};

// §1-11 退職時の給与天引き（誓約書が未添付なら warning が返る）
export const updateResignation = async (caseId, payload) => {
  const result = await request(`/cases/${caseId}/resignation`, { method: 'PUT', body: payload });
  return { case: normalizeCase(result.case), warning: result.warning };
};

// §1-14 保留などのステータス変更
export const setCaseStatus = async (caseId, status) =>
  normalizeCase(await request(`/cases/${caseId}/status`, { method: 'POST', body: { status } }));

// マスタ
export const fetchExpenseTypes = (enabledOnly = false) =>
  request(`/masters/expense-types${enabledOnly ? '?enabledOnly=true' : ''}`);
export const saveExpenseType = (key, payload) =>
  request(`/masters/expense-types/${key}`, { method: 'PUT', body: payload });
export const createExpenseType = (payload) => request('/masters/expense-types', { method: 'POST', body: payload });

export const fetchStaff = () => request('/masters/staff');
export const fetchHostFarmers = () => request('/masters/host-farmers');
export const fetchPostageRates = () => request('/masters/postage-rates');

export const fetchSetting = (key) => request(`/masters/settings/${key}`);
export const saveSetting = (key, value) => request(`/masters/settings/${key}`, { method: 'PUT', body: { value } });

// §1-19 CSV出力（認証ヘッダーが必要なので blob で受け取って保存する）
export const downloadExport = async (kind, filename) => {
  const res = await fetch(`/api/exports/${kind}`, { headers: authHeader() });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'CSVの出力に失敗しました');
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const fetchDashboard = () => request('/dashboard');
