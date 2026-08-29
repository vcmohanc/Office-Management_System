import express from 'express';
import B2BPartner from '../models/B2BPartner.js';

const router = express.Router();

// GET /api/b2b/metrics
router.get('/metrics', async (req, res) => {
  try {
    const activePartnersCount = await B2BPartner.countDocuments({ status: 'Active' });
    const ongoingContractsCount = await B2BPartner.countDocuments({ status: { $in: ['Active', 'Expiring Soon'] } });
    const pendingProposalsCount = await B2BPartner.countDocuments({ status: 'Pending' });
    
    const revenueResult = await B2BPartner.aggregate([
      {
        $group: {
          _id: null,
          totalMonthlyRevenue: { $sum: "$monthly_revenue" }
        }
      }
    ]);
    
    const totalMonthlyRevenue = revenueResult.length > 0 ? revenueResult[0].totalMonthlyRevenue : 0;

    res.json({
      activePartnersCount,
      ongoingContractsCount,
      pendingProposalsCount,
      totalMonthlyRevenue
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

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { partner_name: { $regex: search, $options: 'i' } },
        { industry: { $regex: search, $options: 'i' } }
      ];
    }

    const parsedPage = parseInt(page, 10) || 1;
    const parsedLimit = parseInt(limit, 10) || 10;
    const skip = (parsedPage - 1) * parsedLimit;

    const [data, total] = await Promise.all([
      B2BPartner.find(query).skip(skip).limit(parsedLimit).sort({ createdAt: -1 }),
      B2BPartner.countDocuments(query)
    ]);

    res.json({
      data,
      pagination: {
        total,
        page: parsedPage,
        totalPages: Math.ceil(total / parsedLimit)
      }
    });
  } catch (error) {
    console.error('Error fetching B2B engagements:', error);
    res.status(500).json({ message: 'Server error fetching engagements' });
  }
});

export default router;
