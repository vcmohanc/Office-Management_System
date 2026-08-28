// §1-20 権限管理機能
// client/src/constants/roles.js と同じ定義。変更時は両方を更新すること。

export const ROLES = {
  APPLICANT: 'applicant',
  REVIEWER: 'reviewer',
  ACCOUNTING: 'accounting',
  ADMIN: 'admin',
};

export const PERMISSIONS = {
  VIEW: 'view',                       // 閲覧
  CREATE: 'create',                   // 新規登録
  EDIT: 'edit',                       // 編集
  REJECT: 'reject',                   // 差戻し
  APPROVE: 'approve',                 // 承認
  UPDATE_PROCESS: 'updateProcess',    // 処理状態更新
  VIEW_ATTACHMENT: 'viewAttachment',  // 添付ファイル閲覧
  EXPORT_CSV: 'exportCsv',            // CSV出力
  CANCEL: 'cancel',                   // 取消
  MANAGE_MASTER: 'manageMaster',      // マスタ管理
};

const P = PERMISSIONS;

export const ROLE_PERMISSIONS = {
  [ROLES.APPLICANT]: [P.VIEW, P.CREATE, P.EDIT, P.VIEW_ATTACHMENT, P.CANCEL],
  [ROLES.REVIEWER]: [P.VIEW, P.EDIT, P.REJECT, P.APPROVE, P.VIEW_ATTACHMENT, P.CANCEL],
  [ROLES.ACCOUNTING]: [P.VIEW, P.UPDATE_PROCESS, P.VIEW_ATTACHMENT, P.EXPORT_CSV],
  [ROLES.ADMIN]: Object.values(P),
};

export const can = (role, permission) => (ROLE_PERMISSIONS[role] || []).includes(permission);
