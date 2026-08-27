export const ROLES = {
  APPLICANT: 'applicant',
  REVIEWER: 'reviewer',
  ACCOUNTING: 'accounting',
  ADMIN: 'admin',
};

export const ROLE_LABELS = {
  [ROLES.APPLICANT]: '申請者',
  [ROLES.REVIEWER]: '内容確認者',
  [ROLES.ACCOUNTING]: '経理・給与処理担当者',
  [ROLES.ADMIN]: 'システム管理者',
};

export const ROLE_BADGE_COLORS = {
  [ROLES.APPLICANT]: 'bg-blue-100 text-blue-700 border-blue-200',
  [ROLES.REVIEWER]: 'bg-amber-100 text-amber-700 border-amber-200',
  [ROLES.ACCOUNTING]: 'bg-green-100 text-green-700 border-green-200',
  [ROLES.ADMIN]: 'bg-purple-100 text-purple-700 border-purple-200',
};
