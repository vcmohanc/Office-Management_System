// Run: node server/seedB2B.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

import B2BPartner from './models/B2BPartner.js';

const partners = [
  // Hotels / Hospitality
  {
    partner_name: 'Tokyo Bay Hotel Group',
    industry: 'Hotel & Hospitality',
    workplaceCategories: ['Hotels'],
    priority: 'High',
    status: 'Active',
    contract_start_date: new Date('2024-04-01'),
    contract_end_date: new Date('2026-03-31'),
    monthly_revenue: 480000,
    contact_name: 'Tanaka Hiroshi',
    contact_email: 'tanaka@tokyobayhotel.co.jp',
    contact_phone: '03-1234-5678',
    website: 'tokyobayhotel.co.jp',
    notes: '3ホテル、計42名を派遣中。季節変動あり。',
  },
  {
    partner_name: 'Sakura Resort & Spa',
    industry: 'Hotel & Hospitality',
    workplaceCategories: ['Hotels'],
    priority: 'Medium',
    status: 'Active',
    contract_start_date: new Date('2025-01-01'),
    contract_end_date: new Date('2026-12-31'),
    monthly_revenue: 210000,
    contact_name: 'Yamamoto Keiko',
    contact_email: 'yamamoto@sakuraresort.jp',
    contact_phone: '0467-21-3344',
    website: 'sakuraresort.jp',
    notes: '箱根リゾート。フロント・客室清掃担当。',
  },
  // Food & Beverage
  {
    partner_name: 'Hakata Ramen Chain Corp',
    industry: 'Food & Beverage',
    workplaceCategories: ['Food and Beverage'],
    priority: 'High',
    status: 'Active',
    contract_start_date: new Date('2024-10-01'),
    contract_end_date: new Date('2026-09-30'),
    monthly_revenue: 320000,
    contact_name: 'Nakamura Sho',
    contact_email: 'nakamura@hakataramen.co.jp',
    contact_phone: '092-555-7890',
    website: 'hakataramen.co.jp',
    notes: '全国28店舗。ホールスタッフ・キッチン担当。',
  },
  {
    partner_name: 'Sunshine Catering Services',
    industry: 'Food & Beverage',
    workplaceCategories: ['Food and Beverage'],
    priority: 'Medium',
    status: 'Expiring Soon',
    contract_start_date: new Date('2024-06-01'),
    contract_end_date: new Date('2025-11-30'),
    monthly_revenue: 145000,
    contact_name: 'Ito Mariko',
    contact_email: 'ito@sunshinecatering.jp',
    contact_phone: '06-6200-1122',
    website: 'sunshinecatering.jp',
    notes: 'イベントケータリング専門。繁忙期は追加派遣あり。',
  },
  // Food Manufacturing
  {
    partner_name: 'Nippon Food Processing Ltd',
    industry: 'Food Manufacturing',
    workplaceCategories: ['Food and Beverage Manufacturing'],
    priority: 'High',
    status: 'Active',
    contract_start_date: new Date('2024-01-01'),
    contract_end_date: new Date('2026-12-31'),
    monthly_revenue: 560000,
    contact_name: 'Suzuki Takashi',
    contact_email: 'suzuki@nipponfoods.co.jp',
    contact_phone: '0285-23-4567',
    website: 'nipponfoods.co.jp',
    notes: '栃木工場。冷凍食品ライン担当。24時間シフト制。',
  },
  {
    partner_name: 'Kansai Fresh Foods Factory',
    industry: 'Food Manufacturing & Processing',
    workplaceCategories: ['Food and Beverage Manufacturing'],
    priority: 'Medium',
    status: 'Active',
    contract_start_date: new Date('2025-04-01'),
    contract_end_date: new Date('2027-03-31'),
    monthly_revenue: 290000,
    contact_name: 'Aoki Hiroyuki',
    contact_email: 'aoki@kansaifresh.co.jp',
    contact_phone: '06-7700-3344',
    website: 'kansaifresh.co.jp',
    notes: '大阪・堺の食品加工工場。惣菜・弁当ライン担当。',
  },
  // Agriculture & Forestry
  {
    partner_name: 'Hokkaido Fresh Farm Co.',
    industry: 'Agriculture & Farming',
    workplaceCategories: ['Agriculture and Forestry'],
    priority: 'High',
    status: 'Active',
    contract_start_date: new Date('2025-03-01'),
    contract_end_date: new Date('2027-02-28'),
    monthly_revenue: 390000,
    contact_name: 'Kobayashi Jun',
    contact_email: 'kobayashi@hokkaido-farm.jp',
    contact_phone: '011-800-2233',
    website: 'hokkaido-farm.jp',
    notes: '北海道十勝。ジャガイモ・トウモロコシ収穫期に大量増員。',
  },
  {
    partner_name: 'Kyushu Forestry Partners',
    industry: 'Forestry & Agriculture',
    workplaceCategories: ['Agriculture and Forestry'],
    priority: 'Medium',
    status: 'Active',
    contract_start_date: new Date('2024-07-01'),
    contract_end_date: new Date('2026-06-30'),
    monthly_revenue: 180000,
    contact_name: 'Matsuda Ryota',
    contact_email: 'matsuda@kyushu-forestry.jp',
    contact_phone: '095-300-4455',
    website: 'kyushu-forestry.jp',
    notes: '熊本・宮崎の山林管理。伐採・植林作業担当。',
  },
  // Cleaning / Maintenance
  {
    partner_name: 'Clean Pro Services Japan',
    industry: 'Cleaning & Facility Management',
    workplaceCategories: ['Cleaning'],
    priority: 'Medium',
    status: 'Active',
    contract_start_date: new Date('2025-02-01'),
    contract_end_date: new Date('2027-01-31'),
    monthly_revenue: 240000,
    contact_name: 'Endo Mika',
    contact_email: 'endo@cleanpro.jp',
    contact_phone: '03-4500-6677',
    website: 'cleanpro.jp',
    notes: 'オフィス・商業施設の清掃。早朝・深夜シフトあり。',
  },
  // Warehousing / Packaging
  {
    partner_name: 'Logis Pack Center Kanto',
    industry: 'Warehousing & Packaging',
    workplaceCategories: ['Warehousing/Packaging'],
    priority: 'High',
    status: 'Active',
    contract_start_date: new Date('2024-09-01'),
    contract_end_date: new Date('2026-08-31'),
    monthly_revenue: 410000,
    contact_name: 'Ogawa Daisuke',
    contact_email: 'ogawa@logispack.co.jp',
    contact_phone: '048-700-8899',
    website: 'logispack.co.jp',
    notes: '埼玉・川越の大型物流倉庫。ピッキング・梱包担当。',
  },
  {
    partner_name: 'East Japan Storage Solutions',
    industry: 'Warehousing & Storage',
    workplaceCategories: ['Warehousing/Packaging'],
    priority: 'Low',
    status: 'Pending',
    contract_start_date: new Date('2025-12-01'),
    contract_end_date: new Date('2027-11-30'),
    monthly_revenue: 0,
    contact_name: 'Shimizu Akira',
    contact_email: 'shimizu@ejss.jp',
    contact_phone: '043-200-3344',
    website: 'ejss.jp',
    notes: '新規提案中。千葉・船橋の冷蔵倉庫案件。',
  },
  // Logistics / Transport
  {
    partner_name: 'Nippon Express Partner Network',
    industry: 'Logistics & Transportation',
    workplaceCategories: ['Logistics'],
    priority: 'High',
    status: 'Active',
    contract_start_date: new Date('2024-03-01'),
    contract_end_date: new Date('2026-02-28'),
    monthly_revenue: 520000,
    contact_name: 'Watanabe Kenji',
    contact_email: 'watanabe@nep-logistics.jp',
    contact_phone: '03-5500-1122',
    website: 'nep-logistics.jp',
    notes: '全国物流ネットワーク。ドライバー・仕分け担当。',
  },
  {
    partner_name: 'Osaka Fast Delivery Co.',
    industry: 'Transportation & Logistics',
    workplaceCategories: ['Logistics'],
    priority: 'Medium',
    status: 'Active',
    contract_start_date: new Date('2025-06-01'),
    contract_end_date: new Date('2027-05-31'),
    monthly_revenue: 220000,
    contact_name: 'Nishimura Takuya',
    contact_email: 'nishimura@osakafastdel.jp',
    contact_phone: '06-5500-9988',
    website: 'osakafastdel.jp',
    notes: '近畿圏ラストマイル配送。軽貨物ドライバー中心。',
  },
  // Telecoms / Retail
  {
    partner_name: 'Softcom Mobile Retail',
    industry: 'Telecommunications & Retail',
    workplaceCategories: ['Telecommunications/Retail'],
    priority: 'Medium',
    status: 'Active',
    contract_start_date: new Date('2025-01-15'),
    contract_end_date: new Date('2026-01-14'),
    monthly_revenue: 195000,
    contact_name: 'Fujita Naoko',
    contact_email: 'fujita@softcom-retail.jp',
    contact_phone: '03-6600-7788',
    website: 'softcom-retail.jp',
    notes: 'キャリアショップ staffing。販売スタッフ・受付担当。',
  },
  {
    partner_name: 'Japan Telecom Staffing Alliance',
    industry: 'Telecom & Retail Services',
    workplaceCategories: ['Telecommunications/Retail'],
    priority: 'High',
    status: 'Active',
    contract_start_date: new Date('2024-08-01'),
    contract_end_date: new Date('2026-07-31'),
    monthly_revenue: 310000,
    contact_name: 'Inoue Satoshi',
    contact_email: 'inoue@jtsa.jp',
    contact_phone: '03-3300-0011',
    website: 'jtsa.jp',
    notes: '全国量販店・通信代理店。MVNOショップ運営サポート。',
  },
  // Registration / Support
  {
    partner_name: 'Global Registration Center',
    industry: 'Registration & Administrative Support',
    workplaceCategories: ['Registration Support'],
    priority: 'High',
    status: 'Active',
    contract_start_date: new Date('2024-11-01'),
    contract_end_date: new Date('2026-10-31'),
    monthly_revenue: 280000,
    contact_name: 'Hayashi Tomoko',
    contact_email: 'hayashi@grc-support.jp',
    contact_phone: '03-3300-5566',
    website: 'grc-support.jp',
    notes: '外国人登録・ビザサポート業務専門。多言語対応。',
  },
];

async function seed() {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGO_URI not set in .env');
    await mongoose.connect(uri, { dbName: 'office_manage_system' });
    console.log('Connected to MongoDB (office_manage_system)');

    const seedNames = partners.map(p => p.partner_name);
    const deleted = await B2BPartner.deleteMany({ partner_name: { $in: seedNames } });
    console.log(`Removed ${deleted.deletedCount} existing seed records`);

    const inserted = await B2BPartner.insertMany(partners);
    console.log(`✅ Inserted ${inserted.length} B2B partner records`);
    inserted.forEach(p => console.log(`  • ${p.partner_name} [${p.workplaceCategories.join(', ')}] — ${p.status}`));
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

seed();
