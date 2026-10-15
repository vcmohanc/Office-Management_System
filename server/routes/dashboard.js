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

    // Map expense type → pattern id (mirrors client-side EXPENSE_TYPE_TO_PATTERN_ID)
    const EXPENSE_TO_PTN = {
      'Postage': 'PTN-1', '郵便料金': 'PTN-1',
      'Transportation / Airfare': 'PTN-1', '交通費 / 航空運賃': 'PTN-1',
      'Waiting dormitory fees': 'PTN-1', '待機寮費': 'PTN-1',
      'Visa application fee': 'PTN-2', 'ビザ申請料': 'PTN-2',
      'Accommodation costs': 'PTN-2', '宿泊費': 'PTN-2',
      'Language course fees': 'PTN-2', '語学講習費': 'PTN-2',
      'Equipment / Consumables': 'PTN-3', '機材費': 'PTN-3',
      '過払い回収': 'PTN-3', '返金': 'PTN-3', 'Wi-Fi': 'PTN-3',
      'Other': 'PTN-4', '出張費': 'PTN-4', 'その他': 'PTN-4',
      'Hospital fees / Medicine': 'PTN-5', 'relocation costs': 'PTN-5',
    };

    // Build per-caseId recovered amount index from SettlementPayment
    const paymentsByCaseId = {};
    allPayments.filter(p => p.status === 'PAID' || p.status === 'PARTIAL').forEach(p => {
      paymentsByCaseId[p.caseId] = (paymentsByCaseId[p.caseId] || 0) + (p.paidAmount || 0);
    });

    // Also include Settlement records (confirmed settlements)
    const settlementByCaseId = {};
    allSettlements.forEach(s => {
      const key = s.caseId?.toString();
      if (key) settlementByCaseId[key] = (settlementByCaseId[key] || 0) + (s.financials?.netPayable || 0);
    });

    // Per-pattern metrics computed from real payment data
    const patternMetrics = {};
    ['PTN-1', 'PTN-2', 'PTN-3', 'PTN-4', 'PTN-5'].forEach(id => {
      patternMetrics[id] = { totalAdvanced: 0, totalRecovered: 0, active: 0, netExposure: 0, progress: 0 };
    });

    const completedStatuses = ['Completed', '完了', '支払済', 'PAID'];
    let totalAdvances = 0;
    let totalRecovered = 0;
    let pendingSettlements = 0;

    allRecords.forEach(c => {
      const expType = c.expense_type || 'Other';
      const ptnId = EXPENSE_TO_PTN[expType] || 'PTN-4';
      const amt = c.finalTotal || 0;
      const caseIdStr = c._id?.toString() || '';

      // Real recovered: SettlementPayment first, then Settlement, then installment_records
      const fromPayments = paymentsByCaseId[caseIdStr] || 0;
      const fromSettlement = settlementByCaseId[caseIdStr] || 0;
      const fromInstallments = (c.installment_records || [])
        .filter(r => r.status === 'DEDUCTED')
        .reduce((sum, r) => sum + (r.amount || 0), 0);
      const recovered = Math.max(fromPayments + fromSettlement, fromInstallments);
      const remaining = Math.max(0, amt - recovered);

      totalAdvances += amt;
      totalRecovered += recovered;
      if (!completedStatuses.includes(c.status)) pendingSettlements += 1;

      patternMetrics[ptnId].totalAdvanced += amt;
      patternMetrics[ptnId].totalRecovered += recovered;
      if (remaining > 0) patternMetrics[ptnId].active += 1;
    });

    // Compute derived pattern fields
    Object.values(patternMetrics).forEach(m => {
      m.netExposure = Math.max(0, m.totalAdvanced - m.totalRecovered);
      m.progress = m.totalAdvanced > 0
        ? Math.min(100, Math.round((m.totalRecovered / m.totalAdvanced) * 100))
        : 0;
    });

    const totalActiveAdvances = Math.max(0, totalAdvances - totalRecovered);

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
      activeAdvancesMoM,
      patternMetrics
    });
  } catch (error) {
    console.error('Error fetching account dashboard data:', error);
    res.status(500).json({ error: 'Server error fetching account dashboard data' });
  }
});

// Recovery breakdown: individual payment records making up 今期の回収額
router.get('/account/recovery-breakdown', verifyToken, requireRole('admin', 'account'), async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [payments, settlements, rawCases, rawClaims] = await Promise.all([
      SettlementPayment.find({ status: 'PAID', paymentDate: { $gte: startOfMonth } }).lean(),
      Settlement.find({ paymentDate: { $gte: startOfMonth } }).lean(),
      Case.find({}, { _id: 1, case_id: 1, staff_name: 1, expense_type: 1, final_total_amount: 1 }).lean(),
      Claim.find({}, { _id: 1, claim_id: 1, full_name: 1, expense_type: 1, total_expense_amount: 1 }).lean()
    ]);

    // Build lookup maps
    const caseMap = {};
    rawCases.forEach(c => { caseMap[c._id.toString()] = c; });
    rawClaims.forEach(c => { caseMap[c._id.toString()] = { ...c, staff_name: c.full_name, case_id: c.claim_id, final_total_amount: c.total_expense_amount }; });

    const rows = [];

    payments.forEach(p => {
      const rec = caseMap[p.caseId] || {};
      rows.push({
        id: p._id,
        source: 'payment',
        caseId: p.caseId,
        caseRef: rec.case_id || p.caseId,
        staffName: rec.staff_name || '—',
        expenseType: rec.expense_type || '—',
        termNumber: p.termNumber,
        amount: p.paidAmount,
        paymentDate: p.paymentDate,
        totalCaseAmount: rec.final_total_amount || 0,
      });
    });

    settlements.forEach(s => {
      const key = s.caseId?.toString();
      const rec = key ? (caseMap[key] || {}) : {};
      rows.push({
        id: s._id,
        source: 'settlement',
        caseId: key || '',
        caseRef: rec.case_id || key || '—',
        staffName: s.payeeName || rec.staff_name || '—',
        expenseType: rec.expense_type || '—',
        termNumber: null,
        amount: s.financials?.netPayable || 0,
        paymentDate: s.paymentDate,
        totalCaseAmount: rec.final_total_amount || 0,
      });
    });

    rows.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));
    const total = rows.reduce((sum, r) => sum + r.amount, 0);

    res.json({ rows, total, month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}` });
  } catch (error) {
    console.error('Error fetching recovery breakdown:', error);
    res.status(500).json({ error: 'Server error fetching recovery breakdown' });
  }
});

// DELETE a recovery-breakdown row (payment or settlement)
router.delete('/account/recovery-breakdown/:source/:id', verifyToken, requireRole('admin', 'account'), async (req, res) => {
  try {
    const { source, id } = req.params;
    if (source === 'payment') {
      const doc = await SettlementPayment.findByIdAndDelete(id);
      if (!doc) return res.status(404).json({ error: '支払い記録が見つかりません' });
    } else if (source === 'settlement') {
      const doc = await Settlement.findByIdAndDelete(id);
      if (!doc) return res.status(404).json({ error: '決済記録が見つかりません' });
    } else {
      return res.status(400).json({ error: '無効なソース種別です' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting recovery record:', error);
    res.status(500).json({ error: 'Server error deleting recovery record' });
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
