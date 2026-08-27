// 分割天引きの上限金額設定（プロトタイプ用にlocalStorageで保持）
const STORAGE_KEY = 'installmentThreshold';
export const DEFAULT_INSTALLMENT_THRESHOLD = 50000;

export const getInstallmentThreshold = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  const parsed = stored ? Number(stored) : NaN;
  return Number.isFinite(parsed) ? parsed : DEFAULT_INSTALLMENT_THRESHOLD;
};

export const setInstallmentThreshold = (value) => {
  localStorage.setItem(STORAGE_KEY, String(value));
};
