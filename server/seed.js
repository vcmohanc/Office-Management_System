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
        visaStartDate: new Date('2020-04-01'),
        visaEndDate: new Date('2025-04-01'),
        visaRenewalDate: new Date('2025-03-01'),
        educationalQualifications: [{ passingYear: '2012', qualification: 'Bachelor\'s Degree', institution: 'Tokyo University' }],
        workExperience: [{ companyName: 'ABC Corp', workPeriod: 'Apr 2012 - Mar 2022', jobDescription: 'Senior Auditor responsible for internal compliance.' }],
        personality: 'Detail-oriented and highly organized',
        languageFluency: { english: 'Fluent', japanese: 'Native', other: { name: 'Chinese', level: 'Basic' } },
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
        visaStartDate: new Date('2020-05-15'),
        visaEndDate: new Date('2027-05-15'),
        visaRenewalDate: new Date('2027-04-15'),
        educationalQualifications: [{ passingYear: '2014', qualification: 'Master\'s Degree', institution: 'Osaka University' }, { passingYear: '2012', qualification: 'Bachelor\'s Degree', institution: 'Osaka University' }],
        workExperience: [{ companyName: 'Global Tax Partners', workPeriod: 'Jun 2014 - Apr 2023', jobDescription: 'Tax consultant for enterprise clients.' }],
        personality: 'Proactive and communicative',
        languageFluency: { english: 'Conversational', japanese: 'Native', other: { name: '', level: '' } },
        physicalAttributes: { height: 160, weight: 50, clothingSize: 'S', shoeSize: '23.5' },
        onboardingStatus: 'Active'
      },
      {
        department: 'Service',
        joinDate: new Date('2023-01-15'),
        katakanaName: 'スズキ イチロウ',
        romajiName: 'Suzuki Ichiro',
        nationality: 'Japan',
        dob: new Date('1985-10-22'),
        age: 38,
        gender: 'Male',
        visaStatus: 'Permanent Resident',
        joiningType: 'Full-time',
        visaStartDate: new Date('2015-10-22'),
        visaEndDate: new Date('2025-10-22'),
        visaRenewalDate: new Date('2025-09-22'),
        educationalQualifications: [{ passingYear: '2007', qualification: 'Bachelor\'s Degree', institution: 'Kyoto University' }],
        workExperience: [{ companyName: 'Customer First Inc.', workPeriod: 'Apr 2008 - Dec 2022', jobDescription: 'Customer Service Manager' }],
        personality: 'Friendly and empathetic',
        languageFluency: { english: 'Basic', japanese: 'Native' },
        physicalAttributes: { height: 180, weight: 75, clothingSize: 'L', shoeSize: '28.0' },
        onboardingStatus: 'Active'
      },
      {
        department: 'Farm Operations',
        joinDate: new Date('2023-11-01'),
        katakanaName: 'タカハシ ケン',
        romajiName: 'Takahashi Ken',
        nationality: 'Japan',
        dob: new Date('1995-03-14'),
        age: 29,
        gender: 'Male',
        visaStatus: 'Permanent Resident',
        joiningType: 'Contract',
        visaStartDate: new Date('2023-11-01'),
        visaEndDate: new Date('2026-11-01'),
        visaRenewalDate: new Date('2026-10-01'),
        educationalQualifications: [{ passingYear: '2017', qualification: 'Bachelor\'s Degree', institution: 'Hokkaido Agriculture College' }],
        workExperience: [{ companyName: 'Green Fields Co.', workPeriod: 'Apr 2017 - Oct 2023', jobDescription: 'Farm machinery operator and crop manager.' }],
        personality: 'Hardworking and resilient',
        languageFluency: { english: 'Basic', japanese: 'Native' },
        physicalAttributes: { height: 170, weight: 68, clothingSize: 'M', shoeSize: '26.5' },
        onboardingStatus: 'Active'
      },
      {
        department: 'HR',
        joinDate: new Date('2024-01-10'),
        katakanaName: 'イトウ エミ',
        romajiName: 'Ito Emi',
        nationality: 'Japan',
        dob: new Date('1991-07-07'),
        age: 33,
        gender: 'Female',
        visaStatus: 'Permanent Resident',
        joiningType: 'Full-time',
        visaStartDate: new Date('2020-01-10'),
        visaEndDate: new Date('2030-01-10'),
        visaRenewalDate: new Date('2029-12-10'),
        educationalQualifications: [{ passingYear: '2013', qualification: 'Bachelor\'s Degree', institution: 'Waseda University' }],
        workExperience: [{ companyName: 'Tech HR Solutions', workPeriod: 'Apr 2013 - Dec 2023', jobDescription: 'Talent acquisition and employee relations specialist.' }],
        personality: 'Organized and approachable',
        languageFluency: { english: 'Fluent', japanese: 'Native' },
        physicalAttributes: { height: 155, weight: 48, clothingSize: 'S', shoeSize: '23.0' },
        onboardingStatus: 'Active'
      },
      {
        department: 'Service Support',
        joinDate: new Date('2024-02-20'),
        katakanaName: 'キムラ タクヤ',
        romajiName: 'Kimura Takuya',
        nationality: 'Japan',
        dob: new Date('1993-11-13'),
        age: 30,
        gender: 'Male',
        visaStatus: 'Permanent Resident',
        joiningType: 'Full-time',
        visaStartDate: new Date('2021-02-20'),
        visaEndDate: new Date('2026-02-20'),
        visaRenewalDate: new Date('2026-01-20'),
        educationalQualifications: [{ passingYear: '2015', qualification: 'Bachelor\'s Degree', institution: 'Keio University' }],
        workExperience: [{ companyName: 'Support Hub Japan', workPeriod: 'Apr 2015 - Jan 2024', jobDescription: 'Technical support specialist.' }],
        personality: 'Outgoing and patient',
        languageFluency: { english: 'Conversational', japanese: 'Native' },
        physicalAttributes: { height: 176, weight: 70, clothingSize: 'L', shoeSize: '27.5' },
        onboardingStatus: 'Verification Pending'
      },
      {
        department: 'Farm Operations',
        joinDate: new Date('2023-08-05'),
        katakanaName: 'ナカムラ ユキ',
        romajiName: 'Nakamura Yuki',
        nationality: 'Japan',
        dob: new Date('1998-02-28'),
        age: 26,
        gender: 'Female',
        visaStatus: 'Permanent Resident',
        joiningType: 'Part-time',
        visaStartDate: new Date('2022-08-05'),
        visaEndDate: new Date('2027-08-05'),
        visaRenewalDate: new Date('2027-07-05'),
        educationalQualifications: [{ passingYear: '2020', qualification: 'Bachelor\'s Degree', institution: 'Tohoku University' }],
        workExperience: [{ companyName: 'Local Agri-Coop', workPeriod: 'Apr 2020 - Jul 2023', jobDescription: 'Agricultural researcher and field assistant.' }],
        personality: 'Patient and observant',
        languageFluency: { english: 'Basic', japanese: 'Native' },
        physicalAttributes: { height: 162, weight: 55, clothingSize: 'M', shoeSize: '24.0' },
        onboardingStatus: 'Active'
      },
      {
        department: 'Payroll',
        joinDate: new Date('2021-06-15'),
        katakanaName: 'ワタナベ ケンジ',
        romajiName: 'Watanabe Kenji',
        nationality: 'Japan',
        dob: new Date('1988-12-05'),
        age: 35,
        gender: 'Male',
        visaStatus: 'Permanent Resident',
        joiningType: 'Full-time',
        visaStartDate: new Date('2015-06-15'),
        visaEndDate: new Date('2025-06-15'),
        visaRenewalDate: new Date('2025-05-15'),
        educationalQualifications: [{ passingYear: '2010', qualification: 'Bachelor\'s Degree', institution: 'Nagoya University' }],
        workExperience: [{ companyName: 'Finance Group LLC', workPeriod: 'Apr 2010 - May 2021', jobDescription: 'Payroll administrator handling 500+ employees.' }],
        personality: 'Analytical and precise',
        languageFluency: { english: 'Fluent', japanese: 'Native' },
        physicalAttributes: { height: 172, weight: 66, clothingSize: 'M', shoeSize: '26.0' },
        onboardingStatus: 'Active'
      },
      {
        department: 'Service Support',
        joinDate: new Date('2024-04-10'),
        katakanaName: 'ジョン スミス',
        romajiName: 'John Smith',
        nationality: 'USA',
        dob: new Date('1992-09-18'),
        age: 31,
        gender: 'Male',
        visaStatus: 'Working Visa',
        joiningType: 'Full-time',
        visaStartDate: new Date('2024-03-10'),
        visaEndDate: new Date('2025-03-10'),
        visaRenewalDate: new Date('2025-02-10'),
        educationalQualifications: [{ passingYear: '2014', qualification: 'Bachelor\'s Degree', institution: 'University of California' }],
        workExperience: [{ companyName: 'Tech Global', workPeriod: 'Jul 2014 - Mar 2024', jobDescription: 'International service coordinator.' }],
        personality: 'Enthusiastic and adaptable',
        languageFluency: { english: 'Native', japanese: 'Conversational', other: { name: 'Spanish', level: 'Fluent' } },
        physicalAttributes: { height: 182, weight: 80, clothingSize: 'XL', shoeSize: '29.0' },
        onboardingStatus: 'Missing Documents'
      },
      {
        department: 'Farm Operations',
        joinDate: new Date('2024-05-01'),
        katakanaName: 'マリア ガルシア',
        romajiName: 'Maria Garcia',
        nationality: 'Spain',
        dob: new Date('1996-04-22'),
        age: 28,
        gender: 'Female',
        visaStatus: 'Working Visa',
        joiningType: 'Contract',
        visaStartDate: new Date('2024-04-01'),
        visaEndDate: new Date('2025-04-01'),
        visaRenewalDate: new Date('2025-03-01'),
        educationalQualifications: [{ passingYear: '2018', qualification: 'Bachelor\'s Degree', institution: 'University of Madrid' }],
        workExperience: [{ companyName: 'EuroAgri', workPeriod: 'Sep 2018 - Apr 2024', jobDescription: 'Farm management and crop yield analysis.' }],
        personality: 'Energetic and passionate',
        languageFluency: { english: 'Fluent', japanese: 'Basic', other: { name: 'Spanish', level: 'Native' } },
        physicalAttributes: { height: 165, weight: 58, clothingSize: 'M', shoeSize: '24.5' },
        onboardingStatus: 'Active'
      },
      {
        department: 'HR',
        joinDate: new Date('2020-03-01'),
        katakanaName: 'コバヤシ マユ',
        romajiName: 'Kobayashi Mayu',
        nationality: 'Japan',
        dob: new Date('1989-08-30'),
        age: 34,
        gender: 'Female',
        visaStatus: 'Permanent Resident',
        joiningType: 'Full-time',
        visaStartDate: new Date('2015-03-01'),
        visaEndDate: new Date('2025-03-01'),
        visaRenewalDate: new Date('2025-02-01'),
        educationalQualifications: [{ passingYear: '2011', qualification: 'Bachelor\'s Degree', institution: 'Kobe University' }],
        workExperience: [{ companyName: 'HR Consultants Inc.', workPeriod: 'Apr 2011 - Feb 2020', jobDescription: 'Recruitment and training manager.' }],
        personality: 'Reliable and trustworthy',
        languageFluency: { english: 'Conversational', japanese: 'Native' },
        physicalAttributes: { height: 158, weight: 52, clothingSize: 'S', shoeSize: '23.5' },
        onboardingStatus: 'Active'
      },
      {
        department: 'Service',
        joinDate: new Date('2022-10-15'),
        katakanaName: 'カトウ ヒロシ',
        romajiName: 'Kato Hiroshi',
        nationality: 'Japan',
        dob: new Date('1994-01-11'),
        age: 30,
        gender: 'Male',
        visaStatus: 'Permanent Resident',
        joiningType: 'Full-time',
        visaStartDate: new Date('2020-10-15'),
        visaEndDate: new Date('2030-10-15'),
        visaRenewalDate: new Date('2030-09-15'),
        educationalQualifications: [{ passingYear: '2016', qualification: 'Bachelor\'s Degree', institution: 'Hiroshima University' }],
        workExperience: [{ companyName: 'Fast Service Co.', workPeriod: 'Apr 2016 - Sep 2022', jobDescription: 'Field service technician resolving hardware issues.' }],
        personality: 'Resourceful and quick-thinking',
        languageFluency: { english: 'Basic', japanese: 'Native' },
        physicalAttributes: { height: 178, weight: 72, clothingSize: 'L', shoeSize: '27.0' },
        onboardingStatus: 'Active'
      },
      {
        department: 'Farm Operations',
        joinDate: new Date('2024-06-01'),
        katakanaName: 'アウン サン',
        romajiName: 'Aung San',
        nationality: 'Myanmar',
        dob: new Date('1999-05-15'),
        age: 25,
        gender: 'Male',
        visaStatus: 'Student Visa',
        joiningType: 'Part-time',
        visaStartDate: new Date('2023-04-01'),
        visaEndDate: new Date('2025-04-01'),
        visaRenewalDate: new Date('2025-03-01'),
        educationalQualifications: [{ passingYear: '2025', qualification: 'Bachelor\'s Degree', institution: 'Tokyo Agriculture University (Ongoing)' }],
        workExperience: [{ companyName: 'Campus Farm', workPeriod: 'May 2023 - Present', jobDescription: 'Part-time agricultural assistant.' }],
        personality: 'Diligent and eager to learn',
        languageFluency: { english: 'Conversational', japanese: 'N3', other: { name: 'Burmese', level: 'Native' } },
        physicalAttributes: { height: 168, weight: 60, clothingSize: 'M', shoeSize: '25.5' },
        onboardingStatus: 'Verification Pending'
      },
      {
        department: 'Audit & Compliance',
        joinDate: new Date('2021-02-01'),
        katakanaName: 'ヨシダ アイ',
        romajiName: 'Yoshida Ai',
        nationality: 'Japan',
        dob: new Date('1990-06-20'),
        age: 33,
        gender: 'Female',
        visaStatus: 'Permanent Resident',
        joiningType: 'Full-time',
        visaStartDate: new Date('2018-02-01'),
        visaEndDate: new Date('2028-02-01'),
        visaRenewalDate: new Date('2028-01-01'),
        educationalQualifications: [{ passingYear: '2012', qualification: 'Bachelor\'s Degree', institution: 'Yokohama National University' }, { passingYear: '2014', qualification: 'Master\'s Degree', institution: 'Yokohama National University' }],
        workExperience: [{ companyName: 'Secure Audit Partners', workPeriod: 'May 2014 - Jan 2021', jobDescription: 'Compliance officer reviewing financial standards.' }],
        personality: 'Meticulous and logical',
        languageFluency: { english: 'Fluent', japanese: 'Native', other: { name: 'French', level: 'Basic' } },
        physicalAttributes: { height: 163, weight: 54, clothingSize: 'M', shoeSize: '24.0' },
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

    const claims = [];
    await Claim.insertMany(claims);
    console.log('Claims seeded successfully');

    mongoose.disconnect();
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
