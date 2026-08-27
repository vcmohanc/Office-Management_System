import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Employee from './models/Employee.js';
import Case from './models/Case.js';
import Claim from './models/Claim.js';

const MONGODB_URI = 'mongodb://localhost:27017/office_manage_system';

const seedData = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing collections
    await User.deleteMany({});
    await Employee.deleteMany({});
    await Case.deleteMany({});
    await Claim.deleteMany({});
    console.log('Cleared existing data');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const users = [
      { username: 'admin', password: hashedPassword, role: 'admin' },
      { username: 'hr_user', password: hashedPassword, role: 'hr' },
      { username: 'account_user', password: hashedPassword, role: 'account' },
      { username: 'support_user', password: hashedPassword, role: 'support' },
    ];
    await User.insertMany(users);
    console.log('Users seeded successfully');

    const employees = [
      {
        department: 'Audit & Compliance',
        joinDate: new Date('2022-04-01'),
        katakanaName: 'ヤマダ タロウ',
        romajiName: 'Yamada Taro',
        nationality: 'Japan',
        dob: new Date('1990-01-01'),
        age: 34,
        gender: 'Male',
        visaStatus: 'Permanent Resident',
        joiningType: 'Full-time',
        educationalQualifications: [{ passingYear: '2012', qualification: 'Bachelor', institution: 'Tokyo Univ' }],
        workExperience: [{ companyName: 'ABC Corp', workPeriod: '2012-2022', jobDescription: 'Auditor' }],
        personality: 'Detail-oriented',
        languageFluency: { english: 'Fluent', japanese: 'Native' },
        physicalAttributes: { height: 175, weight: 65, clothingSize: 'M', shoeSize: '27.0' },
        onboardingStatus: 'Active'
      },
      {
        department: 'Taxation',
        joinDate: new Date('2023-05-15'),
        katakanaName: 'サトウ ハナコ',
        romajiName: 'Sato Hanako',
        nationality: 'Japan',
        dob: new Date('1992-05-05'),
        age: 32,
        gender: 'Female',
        visaStatus: 'Permanent Resident',
        joiningType: 'Full-time',
        educationalQualifications: [{ passingYear: '2014', qualification: 'Master', institution: 'Osaka Univ' }],
        workExperience: [],
        personality: 'Proactive',
        languageFluency: { english: 'Conversational', japanese: 'Native' },
        physicalAttributes: { height: 160, weight: 50, clothingSize: 'S', shoeSize: '23.5' },
        onboardingStatus: 'Active'
      }
    ];
    await Employee.insertMany(employees);
    console.log('Employees seeded successfully');

    const cases = [
      {
        staffName: 'Yamada Taro',
        staffId: 'EMP-001',
        location: 'Tokyo Office',
        expenseType: 'Travel',
        advancerCategory: 'Company',
        advancerName: 'OMS Corp',
        bearingParty: 'Client A',
        amount: 15000,
        expensePeriodStart: new Date('2024-05-01'),
        expensePeriodEnd: new Date('2024-05-05'),
        attachments: [],
        totalExpense: 15000,
        currency: 'JPY',
        previousBalance: 0,
        includeBalance: false,
        finalTotal: 15000,
        settlementMethod: 'Bank Transfer',
        expectedSettlementDate: new Date('2024-05-31'),
        collectionMethod: 'Invoice',
        installmentPlan: 'Single Payment',
        collectionStartMonth: '2024-06',
        status: 'Pending'
      }
    ];
    await Case.insertMany(cases);
    console.log('Cases seeded successfully');

    const claims = [
      {
        expenseType: 'meals',
        expenseDate: new Date('2024-05-15'),
        amount: 3000,
        expenseCategory: 'Management',
        costBearer: 'Department A',
        staffName: 'admin',
        projectRef: 'PRJ-102',
        paymentMethod: 'corporate_card',
        description: 'Business lunch with client',
        status: 'Submitted'
      }
    ];
    await Claim.insertMany(claims);
    console.log('Claims seeded successfully');

    mongoose.disconnect();
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
