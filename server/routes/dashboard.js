import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import Employee from '../models/Employee.js';
import Case from '../models/Case.js';
import SettlementPayment from '../models/SettlementPayment.js';
import Claim from '../models/Claim.js';
import Settlement from '../models/Settlement.js';
const router = express.Router();

// Get dashboard stats & employees (Admin and HR only)
router.get('/', verifyToken, requireRole('admin', 'hr'), async (req, res) => {
  try {
    const employees = await Employee.find(
      {},
      { _id: 1, name: 1, staffId: 1, department: 1, role: 1, joinDate: 1, visaEndDate: 1, onboardingステータス: 1 }
    );
    
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
    console.error('Error fetching dashboard home data:', error);
    res.status(500).json({ error: 'Server error fetching dashboard data' });
  }
});

// Get Account Dashboard stats (Admin and Account roles only)
router.get('/account', verifyToken, requireRole('admin', 'account'), async (req, res) => {
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

    // Total amount advanced across all cases and claims
    const totalAdvances = allRecords.reduce((sum, c) => sum + (c.finalTotal || 0), 0);

    // Total actually recovered = sum of paidAmount from PAID/PARTIAL SettlementPayment records
    // + netPayable from confirmed Settlement records (separate settlement flow)
    const totalRecoveredFromPayments = allPayments
      .filter(p => p.status === 'PAID' || p.status === 'PARTIAL')
      .reduce((sum, p) => sum + (p.paidAmount || 0), 0);

    const totalRecoveredFromSettlements = allSettlements
      .reduce((sum, s) => sum + (s.financials?.netPayable || 0), 0);

    const totalRecovered = totalRecoveredFromPayments + totalRecoveredFromSettlements;

    // Active advances = total advanced minus all recovered amounts
    const totalActiveAdvances = Math.max(0, totalAdvances - totalRecovered);

    // Pending = cases/claims not in a completed status
    const completedStatuses = ['Completed', '完了', '支払済', 'PAID'];
    const pendingSettlements = allRecords.filter(c => !completedStatuses.includes(c.status)).length;

    // This period (current month) recovered amounts
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const paidThisPeriod = allPayments
      .filter(p => p.status === 'PAID' && p.paymentDate && new Date(p.paymentDate) >= startOfMonth)
      .reduce((sum, p) => sum + (p.paidAmount || 0), 0);

    const settledThisPeriod = allSettlements
      .filter(s => s.paymentDate && new Date(s.paymentDate) >= startOfMonth)
      .reduce((sum, s) => sum + (s.financials?.netPayable || 0), 0);

    const recoveredThisPeriod = paidThisPeriod + settledThisPeriod;

    const overallRecoveryRate = totalAdvances > 0 ? Math.round((totalRecovered / totalAdvances) * 100) : 0;

    const casesCreatedThisMonth = allRecords.filter(c => {
      try { return new Date(c.createdAt) >= startOfMonth; } catch { return false; }
    });
    const advancesCreatedThisMonth = casesCreatedThisMonth.reduce((sum, c) => sum + (c.finalTotal || 0), 0);
    const lastMonthActiveAdvances = totalActiveAdvances + advancesCreatedThisMonth - recoveredThisPeriod;

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
    res.status(500).json({ error: 'Server error fetching account dashboard data' });
  }
});

// Get Support Dashboard stats (Admin and Support roles only)
router.get('/support', verifyToken, requireRole('admin', 'support'), async (req, res) => {
  try {
    const [claims, employees] = await Promise.all([
      Claim.find().sort({ createdAt: -1 }).lean(),
      Employee.find({}, { katakanaName: 1, romajiName: 1, department: 1, visaEndDate: 1, joinDate: 1 }).lean()
    ]);

    const completedStatuses = ['Completed', 'Paid', '完了', '支払済'];
    const pendingActionStatuses = ['Pending', 'Needs Edit', 'Returned', 'RETURNED_FOR_CORRECTION', '保留中 Correction'];

    // KPI: active claims (not completed/paid)
    const activeClaims = claims.filter(c => !completedStatuses.includes(c.status)).length;

    // KPI: claims currently needing support action
    const pendingActionClaims = claims.filter(c => pendingActionStatuses.includes(c.status)).length;

    // KPI: total active staff count (proxy for scheduled shifts — no Shift model)
    const totalStaff = employees.length;

    // KPI: task (claim) completion rate
    const completedCount = claims.filter(c => completedStatuses.includes(c.status)).length;
    const completionRate = claims.length > 0 ? Math.round((completedCount / claims.length) * 100) : 0;

    // Staff with valid visas vs total (for coverage badge)
    const now = new Date();
    const validVisaStaff = employees.filter(e => !e.visaEndDate || new Date(e.visaEndDate) > now).length;
    const staffCoverageRate = totalStaff > 0 ? Math.round((validVisaStaff / totalStaff) * 100) : 100;

    // Month-over-month completion trend
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const completedThisMonth = claims.filter(c => completedStatuses.includes(c.status) && new Date(c.updatedAt) >= startOfThisMonth).length;
    const completedLastMonth = claims.filter(c => completedStatuses.includes(c.status) && new Date(c.updatedAt) >= startOfLastMonth && new Date(c.updatedAt) < startOfThisMonth).length;
    const completionTrend = completedThisMonth >= completedLastMonth ? 'up' : 'down';

    // Task delegation: pending/completed counts + top 3 active claims as "tasks"
    const tasksPending = activeClaims;
    const tasksCompleted = completedCount;
    const recentTasks = claims
      .filter(c => !completedStatuses.includes(c.status))
      .slice(0, 3)
      .map(c => {
        const deadline = c.expected_settlement_date
          ? new Date(c.expected_settlement_date).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })
          : null;
        const isExpired = c.expected_settlement_date && new Date(c.expected_settlement_date) < now;
        return {
          id: c._id,
          title: `${c.expense_type || 'クレーム'} — ${c.claim_id || ''}`.trim(),
          person: c.full_name || '不明',
          deadline,
          isExpired
        };
      });

    // Recent activity: last 8 claims
    const statusColorMap = {
      'Approved': 'bg-green-100 text-green-700',
      'Pending': 'bg-yellow-100 text-yellow-700',
      'In Finance Review': 'bg-blue-100 text-blue-700',
      'Needs Edit': 'bg-red-100 text-red-700',
      'Returned': 'bg-red-100 text-red-700',
      'RETURNED_FOR_CORRECTION': 'bg-red-100 text-red-700',
      'Completed': 'bg-green-100 text-green-700',
      'Paid': 'bg-green-100 text-green-700',
    };
    const recentActivity = claims.slice(0, 8).map(c => ({
      id: c._id,
      staff: c.full_name || '不明',
      type: c.expense_type || '不明',
      status: c.status || 'Pending',
      statusColor: statusColorMap[c.status] || 'bg-gray-100 text-gray-700',
      date: new Date(c.createdAt || Date.now()).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    }));

    res.json({
      activeClaims,
      pendingActionClaims,
      totalStaff,
      completionRate,
      staffCoverageRate,
      completionTrend,
      taskDelegation: { pending: tasksPending, completed: tasksCompleted, tasks: recentTasks },
      recentActivity
    });
  } catch (error) {
    console.error('Error fetching support dashboard data:', error);
    res.status(500).json({ error: 'Server error fetching support dashboard data' });
  }
});

export default router;
