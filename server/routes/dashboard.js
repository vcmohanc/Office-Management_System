import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import Employee from '../models/Employee.js';
import Case from '../models/Case.js';
import SettlementPayment from '../models/SettlementPayment.js';
import Claim from '../models/Claim.js';
import Settlement from '../models/Settlement.js';
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
    const [rawCases, rawClaims, allSettlements, allPayments] = await Promise.all([
      Case.find().lean(),
      Claim.find().lean(),
      Settlement.find().lean(),
      SettlementPayment.find().lean()
    ]);

    const mappedCases = rawCases.map(c => ({
      ...c,
      finalTotal: c.final_total_amount || c.total_expense || c.expense_amount || 0,
      totalTerms: c.installment_count || 1,
      paidTerms: c.paidTerms || 0,
      advancerCategory: c.advancer_category || 'Service staff',
      bearingParty: c.bearing_party || 'VC'
    }));

    const mappedClaims = rawClaims.map(c => ({
      ...c,
      finalTotal: c.total_expense_amount || c.expense_amount || 0,
      totalTerms: c.installment_count || 1,
      paidTerms: c.paidTerms || 0,
      advancerCategory: c.advancer_category || 'Service staff',
      bearingParty: c.bearing_party || 'VC'
    }));

    const allRecords = [...mappedCases, ...mappedClaims];

    // Compute metrics
    let totalAdvances = 0;
    let totalRecovered = 0;
    let totalActiveAdvances = 0;
    let pendingSettlements = 0;

    allRecords.forEach(c => {
      const amt = c.finalTotal;
      const terms = c.totalTerms;
      const paid = c.paidTerms;
      const nextPayment = terms > 0 ? amt / terms : amt;
      const remaining = Math.max(0, amt - (paid * nextPayment));
      const recovered = amt - remaining;

      totalAdvances += amt;
      totalRecovered += recovered;

      const isCompleted = ['Completed', '完了', '支払済', 'PAID'].includes(c.status) && remaining <= 0;
      if (!isCompleted) {
        totalActiveAdvances += remaining;
        pendingSettlements += 1;
      }
    });

    // Check recent settlements this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const recentSettlements = allSettlements.filter(s => s.paymentDate && new Date(s.paymentDate) >= startOfMonth);
    const recoveredThisPeriod = recentSettlements.length > 0 
      ? recentSettlements.reduce((sum, s) => sum + (s.financials?.netPayable || 0), 0)
      : totalRecovered;

    const overallRecoveryRate = totalAdvances > 0 ? Math.round((totalRecovered / totalAdvances) * 100) : 0;
    
    const casesCreatedThisMonth = allRecords.filter(c => new Date(c.createdAt || c._id.getTimestamp()) >= startOfMonth);
    const advancesCreatedThisMonth = casesCreatedThisMonth.reduce((sum, c) => sum + c.finalTotal, 0);
    const lastMonthActiveAdvances = totalActiveAdvances - advancesCreatedThisMonth + recoveredThisPeriod;
    
    let activeAdvancesMoM = 0;
    if (lastMonthActiveAdvances > 0) {
      activeAdvancesMoM = Math.round(((totalActiveAdvances - lastMonthActiveAdvances) / lastMonthActiveAdvances) * 100);
    } else if (totalActiveAdvances > 0) {
      activeAdvancesMoM = 100;
    }

    res.json({
      totalActiveAdvances,
      pendingSettlements,
      recoveredThisPeriod,
      overallRecoveryRate,
      activeAdvancesMoM
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
