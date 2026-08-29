import mongoose from 'mongoose';
import dotenv from 'dotenv';
import B2BPartner from './models/B2BPartner.js';

dotenv.config();

const partnersData = [
  {
    partner_name: 'TechCorp Solutions',
    industry: 'Software & IT',
    contract_start_date: new Date('2026-01-15'),
    contract_end_date: new Date('2027-01-14'),
    status: 'Active',
    monthly_revenue: 125000
  },
  {
    partner_name: 'Global Logistics Inc.',
    industry: 'Transportation',
    contract_start_date: new Date('2026-03-02'),
    contract_end_date: new Date('2028-03-01'),
    status: 'Active',
    monthly_revenue: 950000
  },
  {
    partner_name: 'Nexus Healthcare',
    industry: 'Medical',
    contract_start_date: null,
    contract_end_date: null,
    status: 'Pending',
    monthly_revenue: 55000
  },
  {
    partner_name: 'Apex Manufacturing',
    industry: 'Industrial',
    contract_start_date: new Date('2023-09-10'),
    contract_end_date: new Date('2026-09-09'),
    status: 'Expiring Soon',
    monthly_revenue: 70000
  },
  {
    partner_name: 'CloudSync Services',
    industry: 'Software & IT',
    contract_start_date: new Date('2025-05-15'),
    contract_end_date: new Date('2027-05-14'),
    status: 'Active',
    monthly_revenue: 300000
  },
  {
    partner_name: 'BioGen Labs',
    industry: 'Medical',
    contract_start_date: new Date('2022-01-10'),
    contract_end_date: new Date('2024-01-09'),
    status: 'Terminated',
    monthly_revenue: 0
  },
  {
    partner_name: 'FastFreight Shipping',
    industry: 'Transportation',
    contract_start_date: null,
    contract_end_date: null,
    status: 'Pending',
    monthly_revenue: 150000
  },
  {
    partner_name: 'Stellar Robotics',
    industry: 'Industrial',
    contract_start_date: new Date('2024-11-01'),
    contract_end_date: new Date('2029-10-31'),
    status: 'Active',
    monthly_revenue: 450000
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/office_manage_system');
    console.log('Connected to MongoDB');

    // Clear existing data
    await B2BPartner.deleteMany({});
    console.log('Cleared existing B2B Partners');

    // Insert new data
    const inserted = await B2BPartner.insertMany(partnersData);
    console.log(`Successfully seeded ${inserted.length} B2B Partners`);

    // Log the current active partners count & revenue to check calculations
    const activeCount = await B2BPartner.countDocuments({ status: 'Active' });
    const revenueResult = await B2BPartner.aggregate([
      { $group: { _id: null, totalMonthlyRevenue: { $sum: "$monthly_revenue" } } }
    ]);
    const totalRev = revenueResult.length > 0 ? revenueResult[0].totalMonthlyRevenue : 0;
    
    console.log(`Active Partners: ${activeCount}`);
    console.log(`Total Monthly Revenue: $${totalRev}`);

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

seedDB();
