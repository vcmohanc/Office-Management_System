import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import Employee from '../models/Employee.js';

const router = express.Router();

// Get dashboard stats & employees (Protected)
router.get('/', verifyToken, async (req, res) => {
  try {
    const employees = await Employee.find();
    
    // Mock some extra stats
    const stats = {
      totalEmployees: employees.length,
      activeProjects: 12,
      pendingRequests: 5,
    };

    res.json({ stats, employees });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
