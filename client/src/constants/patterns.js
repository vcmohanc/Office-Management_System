// 立替・精算パターン（要件定義書 §13）— 立替者区分・費用負担先の組み合わせから自動判定する
export const PATTERNS = [
  { key: 'PTN-1', advancerCategory: 'サービススタッフ', costBearer: 'VC', label: 'パターン1（スタッフ立替 → VC負担）' },
  { key: 'PTN-2', advancerCategory: 'VC', costBearer: 'サービススタッフ', label: 'パターン2（VC立替 → スタッフ負担）' },
  { key: 'PTN-3', advancerCategory: '派遣先・農家', costBearer: 'サービススタッフ', label: 'パターン3（農家立替 → スタッフ負担）' },
  { key: 'PTN-4', advancerCategory: 'VC', costBearer: '派遣先・農家', label: 'パターン4（VC立替 → 農家負担）' },
];

export const getPattern = (advancerCategory, costBearer) =>
  PATTERNS.find((p) => p.advancerCategory === advancerCategory && p.costBearer === costBearer) || null;
