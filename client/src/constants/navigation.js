import {
  LayoutDashboard,
  FilePlus,
  ListTodo,
  ClipboardCheck,
  CreditCard,
  UserPlus,
  List,
  Tags,
  Users,
  Plane,
  UserMinus,
  Database,
  Tractor,
  Mail,
  SlidersHorizontal,
} from 'lucide-react';
import { ROLES } from './roles';

// Stable keys used for routing (activeTab) — kept separate from display labels
// so relabeling a screen never silently breaks navigation.
export const NAV_LABELS = {
  'new-case': '新規登録',
  'my-cases': 'マイ案件一覧',
  'review-queue': '案件確認（レビューキュー）',
  'accounting-home': 'ホーム',
  'payment-processing': '精算・回収処理',
  'admin-home': 'ホーム',
  'admin-new-registration': 'ユーザー登録',
  'admin-user-list': 'ユーザー一覧',
  'master-data': 'マスタ管理',
  'expense-type-master': '種別マスタ管理',
  'staff-master': 'サービススタッフマスタ',
  'farmer-master': '派遣先・農家マスタ',
  'postage-rate-master': '郵送費',
  'installment-settings': '分割天引き設定',
  'hr-legacy': '参考／旧HR機能',
  'hr-staff-registration': 'スタッフ登録',
  'hr-staff-list': 'スタッフ一覧',
  'hr-visa-management': 'ビザ管理',
  'hr-resignation': '退職管理',
  settings: '設定',
};

export const NAV_ITEMS_BY_ROLE = {
  [ROLES.APPLICANT]: [
    { key: 'new-case', icon: FilePlus },
    { key: 'my-cases', icon: ListTodo },
  ],
  [ROLES.REVIEWER]: [
    { key: 'review-queue', icon: ClipboardCheck },
  ],
  [ROLES.ACCOUNTING]: [
    { key: 'accounting-home', icon: LayoutDashboard },
    { key: 'payment-processing', icon: CreditCard },
  ],
  [ROLES.ADMIN]: [
    { key: 'admin-home', icon: LayoutDashboard },
    { key: 'admin-new-registration', icon: UserPlus },
    { key: 'admin-user-list', icon: List },
    {
      key: 'master-data',
      icon: Database,
      subItems: [
        { key: 'expense-type-master', icon: Tags },
        { key: 'staff-master', icon: Users },
        { key: 'farmer-master', icon: Tractor },
        { key: 'postage-rate-master', icon: Mail },
        { key: 'installment-settings', icon: SlidersHorizontal },
      ],
    },
    {
      key: 'hr-legacy',
      icon: Users,
      subItems: [
        { key: 'hr-staff-registration', icon: UserPlus },
        { key: 'hr-staff-list', icon: List },
        { key: 'hr-visa-management', icon: Plane },
        { key: 'hr-resignation', icon: UserMinus },
      ],
    },
  ],
};

export const DEFAULT_TAB_BY_ROLE = {
  [ROLES.APPLICANT]: 'new-case',
  [ROLES.REVIEWER]: 'review-queue',
  [ROLES.ACCOUNTING]: 'accounting-home',
  [ROLES.ADMIN]: 'admin-home',
};
