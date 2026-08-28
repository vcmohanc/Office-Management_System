// サービススタッフ・派遣先/農家 マスタ（管理者が登録し、案件登録時に選択できるようにする）
export const STAFF_MASTER = [
  { id: 'STF-001', name: 'ラメシュ', status: '在籍中' },
  { id: 'STF-002', name: 'スニタ', status: '在籍中' },
  { id: 'STF-003', name: 'ビカス', status: '在籍中' },
  { id: 'STF-004', name: 'アルジュン', status: '在籍中' },
  { id: 'STF-005', name: 'サンジャイ', status: '休職中' },
];

export const FARMER_MASTER = [
  { id: 'HST-001', name: 'グリーンファーム農園', status: '契約中' },
  { id: 'HST-002', name: 'さくら農園', status: '契約中' },
  { id: 'HST-003', name: 'みどり牧場', status: '契約中' },
];

export const getStaffById = (id) => STAFF_MASTER.find((s) => s.id === id);
export const getFarmerById = (id) => FARMER_MASTER.find((f) => f.id === id);
