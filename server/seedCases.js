import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Case from './models/Case.js';

dotenv.config();

const dummyCases = [
  {
    staffName: 'Yamada Taro',
    staffId: 'ID-000001',
    location: 'Tokyo Office',
    expenseType: 'Travel',
    advancerCategory: 'Office',
    advancerName: 'Tokyo Admin',
    bearingParty: 'Office',
    amount: 15000,
    expensePeriodStart: new Date('2023-10-01'),
    expensePeriodEnd: new Date('2023-10-05'),
    receipts: [],
    remark: 'Business trip to Osaka',
    totalExpense: 15000,
    currency: 'JPY',
    finalTotal: 15000,
    settlementMethod: 'Bank Transfer',
    expectedSettlementDate: new Date('2023-10-25'),
    collectionMethod: 'Deduction',
    installmentPlan: '1 month',
    collectionStartMonth: '2023-11',
    status: 'Pending'
  },
  {
    staffName: 'Sato Hanako',
    staffId: 'ID-000002',
    location: 'Osaka Office',
    expenseType: 'Meals',
    advancerCategory: 'Staff',
    advancerName: 'Sato Hanako',
    bearingParty: 'Host Company',
    amount: 5000,
    expensePeriodStart: new Date('2023-10-10'),
    expensePeriodEnd: new Date('2023-10-10'),
    receipts: [],
    remark: 'Client dinner',
    totalExpense: 5000,
    currency: 'JPY',
    finalTotal: 5000,
    settlementMethod: 'Cash',
    expectedSettlementDate: new Date('2023-10-15'),
    collectionMethod: 'Cash',
    installmentPlan: 'Immediate',
    collectionStartMonth: '2023-10',
    status: 'Completed'
  },
  {
    staffName: 'Suzuki Ichiro',
    staffId: 'ID-000003',
    location: 'Nagoya Office',
    expenseType: 'Office Supplies',
    advancerCategory: 'Host Company',
    advancerName: 'ABC Corp',
    bearingParty: 'Office',
    amount: 12000,
    expensePeriodStart: new Date('2023-10-02'),
    expensePeriodEnd: new Date('2023-10-02'),
    receipts: [],
    remark: 'Printer ink and paper',
    totalExpense: 12000,
    currency: 'JPY',
    finalTotal: 12000,
    settlementMethod: 'Bank Transfer',
    expectedSettlementDate: new Date('2023-10-31'),
    collectionMethod: 'Invoice',
    installmentPlan: '1 month',
    collectionStartMonth: '2023-11',
    status: 'Processing'
  },
  {
    staffName: 'Tanaka Yui',
    staffId: 'ID-000004',
    location: 'Fukuoka Office',
    expenseType: 'WIFI',
    advancerCategory: 'Office',
    advancerName: 'Fukuoka Admin',
    bearingParty: 'Staff',
    amount: 4500,
    expensePeriodStart: new Date('2023-09-01'),
    expensePeriodEnd: new Date('2023-09-30'),
    receipts: [],
    remark: 'Monthly mobile wifi',
    totalExpense: 4500,
    currency: 'JPY',
    finalTotal: 4500,
    settlementMethod: 'Salary Deduction',
    expectedSettlementDate: new Date('2023-10-25'),
    collectionMethod: 'Deduction',
    installmentPlan: '1 month',
    collectionStartMonth: '2023-10',
    status: 'Pending'
  }
];

const seedCases = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/office_manage_system');
    console.log('Connected to MongoDB');
    
    await Case.deleteMany({});
    console.log('Cleared existing cases');

    await Case.insertMany(dummyCases);
    console.log('Successfully seeded cases');

    process.exit(0);
  } catch (err) {
    console.error('Error seeding cases:', err);
    process.exit(1);
  }
};

seedCases();
