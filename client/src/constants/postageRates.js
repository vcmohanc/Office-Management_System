// 郵送費レート表マスタ（管理者が登録。送り元・送り先の組み合わせから金額を自動反映する）
export const POSTAGE_RATES = [
  { origin: '東京都', destination: '北海道', amount: 1800 },
  { origin: '東京都', destination: '大阪府', amount: 900 },
  { origin: '東京都', destination: '福岡県', amount: 1500 },
  { origin: '東京都', destination: '沖縄県', amount: 2200 },
  { origin: '大阪府', destination: '東京都', amount: 900 },
  { origin: '大阪府', destination: '福岡県', amount: 1100 },
];

export const POSTAGE_ORIGINS = [...new Set(POSTAGE_RATES.map((r) => r.origin))];
export const POSTAGE_DESTINATIONS = [...new Set(POSTAGE_RATES.map((r) => r.destination))];

export const getPostageAmount = (origin, destination) => {
  const match = POSTAGE_RATES.find((r) => r.origin === origin && r.destination === destination);
  return match ? match.amount : null;
};
