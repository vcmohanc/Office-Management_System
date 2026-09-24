import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import Employee from '../models/Employee.js';
import Case from '../models/Case.js';
import SettlementPayment from '../models/SettlementPayment.js';
import Claim from '../models/Claim.js';
const router = express.Router();

// Get dashboard stats & employees (Protected)
router.get('/', verifyToken, async (req, res) => {
  try {
    const employees = await Employee.find();
    
    // HR Stats
    const totalStaff = employees.length;
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);
    const pendingVisas = employees.filter(e => e.visaEndDate && new Date(e.visaEndDate) < nextMonth && new Date(e.visaEndDate) > new Date()).length;
    const recentResignations = 2; // Mock as no resignation tracking currently
    
    // Account Stats
    const cases = await Case.find();
    const openCases = cases.filter(c => c.status !== 'Completed').length;
    const pendingSettlements = cases.filter(c => c.status === 'Pending' || c.status === 'APPROVED_FOR_PAYMENT').length;
    
    const startOfDay = new Date();
    startOfDay.setHours(0,0,0,0);
    const todaysPayments = await SettlementPayment.find({
      paymentDate: { $gte: startOfDay },
      status: 'PAID'
    });
    const todaysRevenue = todaysPayments.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
    
    // Support Stats
    const claims = await Claim.find();
    const openClaims = claims.filter(c => c.status !== 'Completed' && c.status !== 'Paid').length;
    const criticalIssues = claims.filter(c => c.status === 'Needs Edit' || c.status === 'Returned').length;
    
    const stats = {
      totalEmployees: totalStaff,
      activeProjects: 12,
      pendingRequests: 5,
      hr: {
        totalStaff,
        pendingVisas,
        recentResignations
      },
      account: {
        openCases,
        pendingSettlements,
        todaysRevenue
      },
      support: {
        openClaims,
        avgResolutionTime: '2.4 hrs',
        criticalIssues
      }
    };

    res.json({ stats, employees });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Account Dashboard stats
router.get('/account', verifyToken, async (req, res) => {
  try {
    const cases = await Case.find();
    
    // Calculate Total Active Advances
    const activeCases = cases.filter(c => c.status !== 'Completed');
    const totalActiveAdvances = activeCases.reduce((sum, c) => sum + (c.final_total_amount || 0), 0);
    
    // Calculate Pending Settlements
    const pendingSettlements = cases.filter(c => c.status === 'Pending' || c.status === 'APPROVED_FOR_PAYMENT').length;
    
    // Calculate Recovered This Period (Current Month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const recentPayments = await SettlementPayment.find({
      paymentDate: { $gte: startOfMonth },
      status: 'PAID'
    });
    const recoveredThisPeriod = recentPayments.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
    
    // Calculate Fund Flow Patterns
    // PTN-1: VCfund -> Staff Advance
    const ptn1Cases = cases.filter(c => c.advancer_category === 'Service staff' && c.bearing_party === 'VC');
    const ptn1Advanced = ptn1Cases.reduce((sum, c) => sum + (c.final_total_amount || 0), 0);
    // Approximate recovery via paid terms (simple fallback if payments not matched)
    let ptn1Recovered = 0;
    
    // PTN-2: VCfund -> Farmer Advance
    const ptn2Cases = cases.filter(c => c.advancer_category === 'Dispatch destination: Farm' && c.bearing_party === 'VC');
    const ptn2Advanced = ptn2Cases.reduce((sum, c) => sum + (c.final_total_amount || 0), 0);
    let ptn2Recovered = 0;
    
    // Calculate recoveries per case from SettlementPayments
    const allPayments = await SettlementPayment.find({ status: 'PAID' });
    const paymentsByCaseId = {};
    allPayments.forEach(p => {
      if (!paymentsByCaseId[p.caseId]) paymentsByCaseId[p.caseId] = 0;
      paymentsByCaseId[p.caseId] += (p.paidAmount || 0);
    });
    
    ptn1Cases.forEach(c => {
      ptn1Recovered += (paymentsByCaseId[c.case_id] || 0);
    });
    
    ptn2Cases.forEach(c => {
      ptn2Recovered += (paymentsByCaseId[c.case_id] || 0);
    });
    
    // For PTN-3 and PTN-4, we can mock or calculate inverse if exists. Currently the DB seems to just have 'Dispatch destination: Farm' and 'Service staff'.
    // In our DB check we only saw bearing_party: ['Dispatch destination: Farm', 'VC'].
    // We will structure them with default 0s if they don't match, or map accordingly.
    const ptn3Cases = cases.filter(c => c.advancer_category === 'VC' && c.bearing_party === 'Dispatch destination: Farm');
    const ptn3Advanced = ptn3Cases.reduce((sum, c) => sum + (c.final_total_amount || 0), 0);
    let ptn3Recovered = 0;
    ptn3Cases.forEach(c => { ptn3Recovered += (paymentsByCaseId[c.case_id] || 0); });

    const ptn4Cases = cases.filter(c => c.advancer_category === 'VC' && c.bearing_party === 'Service staff');
    const ptn4Advanced = ptn4Cases.reduce((sum, c) => sum + (c.final_total_amount || 0), 0);
    let ptn4Recovered = 0;
    ptn4Cases.forEach(c => { ptn4Recovered += (paymentsByCaseId[c.case_id] || 0); });
    
    res.json({
      totalActiveAdvances,
      pendingSettlements,
      recoveredThisPeriod,
      fundFlowPatterns: {
        ptn1: {
          activeCount: ptn1Cases.filter(c => c.status !== 'Completed').length,
          totalAdvanced: ptn1Advanced,
          totalRecovered: ptn1Recovered,
          netExposure: ptn1Advanced - ptn1Recovered
        },
        ptn2: {
          activeCount: ptn2Cases.filter(c => c.status !== 'Completed').length,
          totalAdvanced: ptn2Advanced,
          totalRecovered: ptn2Recovered,
          netExposure: ptn2Advanced - ptn2Recovered
        },
        ptn3: {
          activeCount: ptn3Cases.filter(c => c.status !== 'Completed').length,
          totalAdvanced: ptn3Advanced,
          totalRecovered: ptn3Recovered,
          netExposure: ptn3Advanced - ptn3Recovered
        },
        ptn4: {
          activeCount: ptn4Cases.filter(c => c.status !== 'Completed').length,
          totalAdvanced: ptn4Advanced,
          totalRecovered: ptn4Recovered,
          netExposure: ptn4Advanced - ptn4Recovered
        }
      }
    });
  } catch (error) {
    console.error('Error fetching account dashboard data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Support Dashboard stats
router.get('/support', verifyToken, async (req, res) => {
  try {
    const claims = await Claim.find().sort({ createdAt: -1 });
    
    // Active Claims
    const activeClaims = claims.filter(c => c.status !== 'Completed' && c.status !== 'Paid').length;
    
    // Recent Activity mapping
    const recentActivity = claims.slice(0, 5).map(c => {
      let statusColor = 'bg-gray-100 text-gray-700';
      if (c.status === 'Approved') statusColor = 'bg-green-100 text-green-700';
      else if (c.status === 'Pending') statusColor = 'bg-yellow-100 text-yellow-700';
      else if (c.status === 'In Finance Review') statusColor = 'bg-blue-100 text-blue-700';
      else if (c.status === 'Returned for Edits' || c.status === 'Needs Edit' || c.status === 'Returned') statusColor = 'bg-red-100 text-red-700';
      
      const dateStr = new Date(c.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

      return {
        id: c._id,
        staff: c.full_name || 'Unknown Staff',
        type: c.expense_type || 'Unknown Type',
        status: c.status || 'Pending',
        statusColor,
        date: dateStr
      };
    });
    
    res.json({
      activeClaims,
      pendingLeaves: 7, // Mocked as no Leave model exists
      scheduledShifts: 18, // Mocked as no Shift model exists
      taskCompletionRate: '82%', // Mocked as no Task model exists
      recentActivity
    });
  } catch (error) {
    console.error('Error fetching support dashboard data:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
