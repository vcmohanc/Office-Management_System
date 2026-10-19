/**
 * Seed script for dummy B2B partner companies.
 * Run from the server directory: node scripts/seedB2B.js
 * Uses MONGO_URI from environment (load via dotenv or set in shell).
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) { console.error('MONGO_URI not set'); process.exit(1); }

const B2BPartnerSchema = new mongoose.Schema({
  partner_name: String,
  industry: String,
  priority: String,
  status: String,
  contract_start_date: Date,
  contract_end_date: Date,
  monthly_revenue: Number,
  contact_name: String,
  contact_email: String,
  contact_phone: String,
  website: String,
  notes: String,
  workplaceCategories: [String],
}, { timestamps: true });

const B2BPartner = mongoose.model('B2BPartner', B2BPartnerSchema);

const today = new Date();
const d = (offsetMonths) => {
  const dt = new Date(today);
  dt.setMonth(dt.getMonth() + offsetMonths);
  return dt;
};

const partners = [
  // ── Hotels ──────────────────────────────────────────────────────────
  {
    partner_name: 'グランドホテル東京株式会社',
    industry: 'ホテル・宿泊業',
    priority: 'High',
    status: 'Active',
    contract_start_date: d(-10),
    contract_end_date: d(14),
    monthly_revenue: 850000,
    contact_name: '田中 誠一',
    contact_email: 'tanaka@grandhotel-tokyo.co.jp',
    contact_phone: '03-1234-5678',
    website: 'grandhotel-tokyo.co.jp',
    notes: '宿泊施設フロント・清掃スタッフを中心に派遣',
    workplaceCategories: ['Hotels'],
  },
  {
    partner_name: 'アパホテルグループ関東',
    industry: 'ホテル・宿泊業',
    priority: 'Medium',
    status: 'Active',
    contract_start_date: d(-6),
    contract_end_date: d(6),
    monthly_revenue: 620000,
    contact_name: '木村 裕子',
    contact_email: 'kimura@apa-kanto.co.jp',
    contact_phone: '03-8765-4321',
    website: 'apa-kanto.co.jp',
    notes: 'ビジネスホテル清掃・フロント要員',
    workplaceCategories: ['Hotels'],
  },

  // ── Food and Beverage ────────────────────────────────────────────────
  {
    partner_name: '株式会社フードサービス東日本',
    industry: '飲食サービス業',
    priority: 'High',
    status: 'Active',
    contract_start_date: d(-8),
    contract_end_date: d(16),
    monthly_revenue: 1100000,
    contact_name: '佐藤 健太',
    contact_email: 'sato@foodservice-east.co.jp',
    contact_phone: '03-2222-3333',
    website: 'foodservice-east.co.jp',
    notes: '飲食店ホール・キッチンスタッフ派遣',
    workplaceCategories: ['Food and Beverage'],
  },
  {
    partner_name: 'レストランチェーン株式会社リリー',
    industry: '外食チェーン業',
    priority: 'Medium',
    status: 'Active',
    contract_start_date: d(-4),
    contract_end_date: d(8),
    monthly_revenue: 480000,
    contact_name: '中村 亜美',
    contact_email: 'nakamura@lily-restaurant.co.jp',
    contact_phone: '06-5555-6666',
    website: 'lily-restaurant.co.jp',
    notes: '関西圏飲食店スタッフ',
    workplaceCategories: ['Food and Beverage'],
  },

  // ── Food and Beverage Manufacturing ─────────────────────────────────
  {
    partner_name: '日本食品工業株式会社',
    industry: '食品製造業',
    priority: 'High',
    status: 'Active',
    contract_start_date: d(-12),
    contract_end_date: d(12),
    monthly_revenue: 1450000,
    contact_name: '山田 浩二',
    contact_email: 'yamada@nippon-food.co.jp',
    contact_phone: '045-7777-8888',
    website: 'nippon-food.co.jp',
    notes: '食品加工ライン・品質管理要員派遣',
    workplaceCategories: ['Food and Beverage Manufacturing'],
  },
  {
    partner_name: 'マルフーズ製造株式会社',
    industry: '食品・飲料製造',
    priority: 'Medium',
    status: 'Expiring Soon',
    contract_start_date: d(-14),
    contract_end_date: d(1),
    monthly_revenue: 780000,
    contact_name: '伊藤 真理',
    contact_email: 'ito@marufoods.co.jp',
    contact_phone: '052-9999-0000',
    website: 'marufoods.co.jp',
    notes: '名古屋工場向け製造ライン作業員',
    workplaceCategories: ['Food and Beverage Manufacturing'],
  },

  // ── Cleaning ─────────────────────────────────────────────────────────
  {
    partner_name: '株式会社クリーンプロ・ジャパン',
    industry: '清掃・ビルメンテナンス',
    priority: 'Medium',
    status: 'Active',
    contract_start_date: d(-9),
    contract_end_date: d(15),
    monthly_revenue: 560000,
    contact_name: '鈴木 隆',
    contact_email: 'suzuki@cleanpro-japan.co.jp',
    contact_phone: '03-4444-5555',
    website: 'cleanpro-japan.co.jp',
    notes: 'ビル・施設清掃スタッフ',
    workplaceCategories: ['Cleaning'],
  },
  {
    partner_name: 'ダイワクリーニングサービス株式会社',
    industry: 'ハウスクリーニング・産業清掃',
    priority: 'Low',
    status: 'Active',
    contract_start_date: d(-3),
    contract_end_date: d(9),
    monthly_revenue: 320000,
    contact_name: '高橋 みどり',
    contact_email: 'takahashi@daiwa-cleaning.co.jp',
    contact_phone: '011-3333-4444',
    website: 'daiwa-cleaning.co.jp',
    notes: '北海道エリア清掃要員',
    workplaceCategories: ['Cleaning'],
  },

  // ── Warehousing/Packaging ────────────────────────────────────────────
  {
    partner_name: '東洋ロジスティクス倉庫株式会社',
    industry: '倉庫・物流業',
    priority: 'High',
    status: 'Active',
    contract_start_date: d(-7),
    contract_end_date: d(17),
    monthly_revenue: 970000,
    contact_name: '渡辺 大輔',
    contact_email: 'watanabe@toyo-logistics.co.jp',
    contact_phone: '03-6666-7777',
    website: 'toyo-logistics.co.jp',
    notes: '倉庫内ピッキング・梱包作業員派遣',
    workplaceCategories: ['Warehousing/Packaging'],
  },
  {
    partner_name: 'パックマスター株式会社',
    industry: '梱包・包装業',
    priority: 'Medium',
    status: 'Active',
    contract_start_date: d(-5),
    contract_end_date: d(7),
    monthly_revenue: 430000,
    contact_name: '松本 恵美',
    contact_email: 'matsumoto@packmaster.co.jp',
    contact_phone: '06-1111-2222',
    website: 'packmaster.co.jp',
    notes: '食品・工業品梱包ラインスタッフ',
    workplaceCategories: ['Warehousing/Packaging'],
  },

  // ── Telecommunications/Retail ────────────────────────────────────────
  {
    partner_name: 'モバイルキャリアサポート株式会社',
    industry: '通信・携帯販売',
    priority: 'High',
    status: 'Active',
    contract_start_date: d(-6),
    contract_end_date: d(18),
    monthly_revenue: 1250000,
    contact_name: '西田 翔太',
    contact_email: 'nishida@mobile-carrier.co.jp',
    contact_phone: '03-8888-9999',
    website: 'mobile-carrier.co.jp',
    notes: '携帯ショップ販売員・登録サポート要員',
    workplaceCategories: ['Telecommunications/Retail', 'Registration Support'],
  },
  {
    partner_name: 'テックリテール株式会社',
    industry: '家電量販・小売',
    priority: 'Medium',
    status: 'Active',
    contract_start_date: d(-3),
    contract_end_date: d(9),
    monthly_revenue: 550000,
    contact_name: '小林 奈々',
    contact_email: 'kobayashi@tech-retail.co.jp',
    contact_phone: '03-0000-1111',
    website: 'tech-retail.co.jp',
    notes: '量販店フロア販売スタッフ',
    workplaceCategories: ['Telecommunications/Retail'],
  },

  // ── Registration Support ─────────────────────────────────────────────
  {
    partner_name: '外国人サポートセンター株式会社',
    industry: '行政手続きサポート',
    priority: 'High',
    status: 'Active',
    contract_start_date: d(-11),
    contract_end_date: d(13),
    monthly_revenue: 680000,
    contact_name: '加藤 誠',
    contact_email: 'kato@foreign-support.co.jp',
    contact_phone: '03-2345-6789',
    website: 'foreign-support.co.jp',
    notes: '在留資格・住民登録サポート専門',
    workplaceCategories: ['Registration Support'],
  },

  // ── Agriculture and Forestry ─────────────────────────────────────────
  {
    partner_name: '株式会社グリーンファーム北海道',
    industry: '農業・農産物生産',
    priority: 'High',
    status: 'Active',
    contract_start_date: d(-9),
    contract_end_date: d(15),
    monthly_revenue: 890000,
    contact_name: '北川 誠二',
    contact_email: 'kitagawa@greenfarm-hokkaido.co.jp',
    contact_phone: '011-2222-3333',
    website: 'greenfarm-hokkaido.co.jp',
    notes: '季節農業・ハウス栽培作業員',
    workplaceCategories: ['Agriculture and Forestry'],
  },
  {
    partner_name: '九州農業生産組合',
    industry: '農林業・産直',
    priority: 'Medium',
    status: 'Active',
    contract_start_date: d(-4),
    contract_end_date: d(8),
    monthly_revenue: 520000,
    contact_name: '福田 美咲',
    contact_email: 'fukuda@kyushu-farm.co.jp',
    contact_phone: '092-4444-5555',
    website: 'kyushu-farm.co.jp',
    notes: '九州エリア農場・林業作業員',
    workplaceCategories: ['Agriculture and Forestry'],
  },

  // ── Logistics ────────────────────────────────────────────────────────
  {
    partner_name: '全日本物流サービス株式会社',
    industry: '輸送・物流',
    priority: 'High',
    status: 'Active',
    contract_start_date: d(-13),
    contract_end_date: d(11),
    monthly_revenue: 1380000,
    contact_name: '山口 剛',
    contact_email: 'yamaguchi@all-japan-logistics.co.jp',
    contact_phone: '03-7777-8888',
    website: 'all-japan-logistics.co.jp',
    notes: 'ドライバー・仕分け・配送センター要員',
    workplaceCategories: ['Logistics'],
  },
  {
    partner_name: 'クイックデリバリー株式会社',
    industry: '宅配・ラストマイル配送',
    priority: 'Medium',
    status: 'Active',
    contract_start_date: d(-2),
    contract_end_date: d(10),
    monthly_revenue: 490000,
    contact_name: '吉田 彩',
    contact_email: 'yoshida@quick-delivery.co.jp',
    contact_phone: '06-6666-7777',
    website: 'quick-delivery.co.jp',
    notes: '関西圏宅配ドライバー',
    workplaceCategories: ['Logistics'],
  },

  // ── Global Bittory ───────────────────────────────────────────────────
  {
    partner_name: 'Global Bittory Partners Ltd.',
    industry: 'グローバル人材派遣',
    priority: 'High',
    status: 'Active',
    contract_start_date: d(-15),
    contract_end_date: d(21),
    monthly_revenue: 2100000,
    contact_name: 'Priya Sharma',
    contact_email: 'priya@globalbittory.com',
    contact_phone: '03-9999-0000',
    website: 'globalbittory.com',
    notes: '多国籍人材の日本法人向けマッチング',
    workplaceCategories: ['Global Bittory'],
  },

  // ── Office Staff — IT / Technical ────────────────────────────────────
  {
    partner_name: '株式会社ITソリューションズジャパン',
    industry: 'ITサービス・システム開発',
    priority: 'High',
    status: 'Active',
    contract_start_date: d(-8),
    contract_end_date: d(16),
    monthly_revenue: 1750000,
    contact_name: '岡田 誠',
    contact_email: 'okada@it-solutions-jp.co.jp',
    contact_phone: '03-1111-2222',
    website: 'it-solutions-jp.co.jp',
    notes: 'ITエンジニア・社内SE向け業務委託',
    workplaceCategories: ['IT / Technical'],
  },

  // ── Office Staff — HR / Recruitment ─────────────────────────────────
  {
    partner_name: 'パーソネルソリューション株式会社',
    industry: '人材紹介・採用支援',
    priority: 'High',
    status: 'Active',
    contract_start_date: d(-6),
    contract_end_date: d(18),
    monthly_revenue: 980000,
    contact_name: '河野 優子',
    contact_email: 'kawano@personnel-solution.co.jp',
    contact_phone: '03-3333-4444',
    website: 'personnel-solution.co.jp',
    notes: '外国人採用・在留資格サポート付き',
    workplaceCategories: ['HR / Recruitment'],
  },

  // ── Office Staff — Accounting & Finance ──────────────────────────────
  {
    partner_name: '東京会計パートナーズ株式会社',
    industry: '会計・税務サービス',
    priority: 'Medium',
    status: 'Active',
    contract_start_date: d(-5),
    contract_end_date: d(7),
    monthly_revenue: 650000,
    contact_name: '浜田 隆史',
    contact_email: 'hamada@tokyo-accounting.co.jp',
    contact_phone: '03-5555-6666',
    website: 'tokyo-accounting.co.jp',
    notes: '経理・財務スタッフの業務委託',
    workplaceCategories: ['Accounting & Finance'],
  },

  // ── Office Staff — Sales / Marketing ─────────────────────────────────
  {
    partner_name: 'セールスフォース・ジャパンパートナー',
    industry: '営業支援・マーケティング',
    priority: 'Medium',
    status: 'Active',
    contract_start_date: d(-4),
    contract_end_date: d(8),
    monthly_revenue: 720000,
    contact_name: '辻 拓也',
    contact_email: 'tsuji@salesforce-partner-jp.co.jp',
    contact_phone: '03-7777-8888',
    website: 'salesforce-partner-jp.co.jp',
    notes: '法人営業・マーケティング支援',
    workplaceCategories: ['Sales', 'Marketing'],
  },

  // ── Office Staff — Administration / Operations ────────────────────────
  {
    partner_name: 'バックオフィスサポート株式会社',
    industry: '総務・一般事務サービス',
    priority: 'Low',
    status: 'Active',
    contract_start_date: d(-3),
    contract_end_date: d(9),
    monthly_revenue: 380000,
    contact_name: '池田 香',
    contact_email: 'ikeda@backoffice-support.co.jp',
    contact_phone: '03-2222-3333',
    website: 'backoffice-support.co.jp',
    notes: '総務・オペレーション支援スタッフ',
    workplaceCategories: ['Administration', 'Operations'],
  },

  // ── Office Staff — Customer Support ──────────────────────────────────
  {
    partner_name: 'コールセンタープロ株式会社',
    industry: 'コールセンター・カスタマーサポート',
    priority: 'Medium',
    status: 'Active',
    contract_start_date: d(-7),
    contract_end_date: d(11),
    monthly_revenue: 540000,
    contact_name: '三浦 聖子',
    contact_email: 'miura@callcenter-pro.co.jp',
    contact_phone: '03-4444-5555',
    website: 'callcenter-pro.co.jp',
    notes: '多言語対応カスタマーサポート',
    workplaceCategories: ['Customer Support'],
  },
];

async function seed() {
  await mongoose.connect(MONGO_URI, { dbName: 'office_manage_system' });
  console.log('Connected to MongoDB (office_manage_system)');

  let inserted = 0;
  let skipped = 0;
  for (const p of partners) {
    const exists = await B2BPartner.findOne({ partner_name: p.partner_name });
    if (exists) {
      console.log(`  SKIP (exists): ${p.partner_name}`);
      skipped++;
    } else {
      await B2BPartner.create(p);
      console.log(`  INSERT: ${p.partner_name}`);
      inserted++;
    }
  }

  console.log(`\nDone. ${inserted} inserted, ${skipped} skipped.`);
  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
