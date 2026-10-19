import express from 'express';
import B2BPartner from '../models/B2BPartner.js';
import User from '../models/User.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET /api/b2b/metrics
router.get('/metrics', async (req, res) => {
  try {
    const [
      activePartnersCount,
      ongoingContractsCount,
      pendingProposalsCount,
      expiringSoonCount,
      revenueResult,
    ] = await Promise.all([
      B2BPartner.countDocuments({ status: 'Active' }),
      B2BPartner.countDocuments({ status: { $in: ['Active', 'Expiring Soon'] } }),
      B2BPartner.countDocuments({ status: 'Pending' }),
      B2BPartner.countDocuments({ status: 'Expiring Soon' }),
      B2BPartner.aggregate([{ $group: { _id: null, totalMonthlyRevenue: { $sum: '$monthly_revenue' } } }]),
    ]);

    res.json({
      activePartnersCount,
      ongoingContractsCount,
      pendingProposalsCount,
      expiringSoonCount,
      totalMonthlyRevenue: revenueResult.length > 0 ? revenueResult[0].totalMonthlyRevenue : 0,
    });
  } catch (error) {
    console.error('Error fetching B2B metrics:', error);
    res.status(500).json({ message: 'Server error fetching metrics' });
  }
});

// GET /api/b2b/engagements
router.get('/engagements', async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status && typeof status === 'string') query.status = status;

    // Scope for support users: only their assigned partners
    if (req.user && req.user.role === 'support') {
      const userDoc = await User.findById(req.user.id);
      if (userDoc && Array.isArray(userDoc.assignedPartners) && userDoc.assignedPartners.length > 0) {
        query.partner_name = { $in: userDoc.assignedPartners };
      }
    }

    if (search && typeof search === 'string') {
      const sanitizedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchConditions = [
        { partner_name: { $regex: sanitizedSearch, $options: 'i' } },
        { industry: { $regex: sanitizedSearch, $options: 'i' } },
      ];
      if (query.partner_name) {
        query.$and = [
          { partner_name: query.partner_name },
          { $or: searchConditions }
        ];
        delete query.partner_name;
      } else {
        query.$or = searchConditions;
      }
    }

    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    const skip = (parsedPage - 1) * parsedLimit;

    const [data, total] = await Promise.all([
      B2BPartner.find(query).skip(skip).limit(parsedLimit).sort({ createdAt: -1 }),
      B2BPartner.countDocuments(query),
    ]);

    res.json({ data, pagination: { total, page: parsedPage, totalPages: Math.ceil(total / parsedLimit) } });
  } catch (error) {
    console.error('Error fetching B2B engagements:', error);
    res.status(500).json({ message: 'Server error fetching engagements' });
  }
});

// GET /api/b2b/partners (all partners)
router.get('/partners', async (req, res) => {
  try {
    const query = {};
    if (req.user && req.user.role === 'support') {
      const userDoc = await User.findById(req.user.id);
      if (userDoc && Array.isArray(userDoc.assignedPartners) && userDoc.assignedPartners.length > 0) {
        query.partner_name = { $in: userDoc.assignedPartners };
      }
    }
    const partners = await B2BPartner.find(query).sort({ partner_name: 1 });
    res.json(partners);
  } catch (error) {
    console.error('Error fetching B2B partners:', error);
    res.status(500).json({ message: 'Server error fetching partners' });
  }
});

// GET /api/b2b/partners/:id
router.get('/partners/:id', async (req, res) => {
  try {
    const partner = await B2BPartner.findById(req.params.id);
    if (!partner) return res.status(404).json({ message: 'パートナーが見つかりません' });
    res.json(partner);
  } catch (error) {
    console.error('Error fetching B2B partner:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/b2b/partners
router.post('/partners', requireRole('admin', 'account'), async (req, res) => {
  try {
    const {
      partner_name, industry, priority, contract_start_date, contract_end_date,
      status, monthly_revenue, contact_name, contact_email, contact_phone, website, notes,
      workplaceCategories,
    } = req.body;

    if (!partner_name?.trim() || !industry?.trim() || !status) {
      return res.status(400).json({ message: 'パートナー名、業種、ステータスは必須項目です。' });
    }

    const partner = new B2BPartner({
      partner_name: partner_name.trim(),
      industry: industry.trim(),
      priority: priority || 'Medium',
      contract_start_date: contract_start_date || null,
      contract_end_date: contract_end_date || null,
      status,
      monthly_revenue: Number(monthly_revenue) || 0,
      contact_name: contact_name?.trim() || '',
      contact_email: contact_email?.trim() || '',
      contact_phone: contact_phone?.trim() || '',
      website: website?.trim() || '',
      notes: notes?.trim() || '',
      workplaceCategories: Array.isArray(workplaceCategories) ? workplaceCategories : [],
    });

    await partner.save();
    res.status(201).json(partner);
  } catch (error) {
    console.error('Error creating B2B partner:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/b2b/partners/:id
router.put('/partners/:id', requireRole('admin', 'account'), async (req, res) => {
  try {
    const {
      partner_name, industry, priority, contract_start_date, contract_end_date,
      status, monthly_revenue, contact_name, contact_email, contact_phone, website, notes,
      workplaceCategories,
    } = req.body;

    if (!partner_name?.trim() || !industry?.trim() || !status) {
      return res.status(400).json({ message: 'パートナー名、業種、ステータスは必須項目です。' });
    }

    const partner = await B2BPartner.findByIdAndUpdate(
      req.params.id,
      {
        partner_name: partner_name.trim(),
        industry: industry.trim(),
        priority: priority || 'Medium',
        contract_start_date: contract_start_date || null,
        contract_end_date: contract_end_date || null,
        status,
        monthly_revenue: Number(monthly_revenue) || 0,
        contact_name: contact_name?.trim() || '',
        contact_email: contact_email?.trim() || '',
        contact_phone: contact_phone?.trim() || '',
        website: website?.trim() || '',
        notes: notes?.trim() || '',
        workplaceCategories: Array.isArray(workplaceCategories) ? workplaceCategories : [],
      },
      { new: true, runValidators: true }
    );

    if (!partner) return res.status(404).json({ message: 'パートナーが見つかりません' });
    res.json(partner);
  } catch (error) {
    console.error('Error updating B2B partner:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/b2b/partners/:id
router.delete('/partners/:id', requireRole('admin', 'account'), async (req, res) => {
  try {
    const partner = await B2BPartner.findByIdAndDelete(req.params.id);
    if (!partner) return res.status(404).json({ message: 'パートナーが見つかりません' });
    res.json({ message: '削除しました' });
  } catch (error) {
    console.error('Error deleting B2B partner:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
