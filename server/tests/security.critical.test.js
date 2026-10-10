import '../config/env.js';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import caseRoutes from '../routes/cases.js';
import resignationRoutes from '../routes/resignations.js';
import employeeRoutes from '../routes/employees.js';
import User from '../models/User.js';
import SettlementLedger from '../models/SettlementLedger.js';

vi.mock('../models/SettlementLedger.js', () => ({
  default: {
    findOne: vi.fn().mockResolvedValue(null)
  }
}));

describe('Security Critical Fixes (SEC-CRIT-01, 02, 03)', () => {
  let app;
  let currentRole = 'employee';
  let currentUserId = 'user-123';

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());

    // Inject mock user according to test
    app.use((req, res, next) => {
      req.user = { id: currentUserId, role: currentRole, username: 'testuser' };
      next();
    });

    app.use('/api/cases', caseRoutes);
    app.use('/api/resignations', resignationRoutes);
    app.use('/api/employees', employeeRoutes);
  });

  describe('SEC-CRIT-01: Financial Ledger Role Enforcement', () => {
    it('should reject non-accounting/non-admin users with 403 on ledger access and payments', async () => {
      currentRole = 'support';

      const resLedger = await request(app).get('/api/cases/case-123/ledger');
      expect(resLedger.status).toBe(403);
      expect(resLedger.body.error).toContain('insufficient permissions');

      const resPay = await request(app).put('/api/cases/case-123/terms/1/pay').send({});
      expect(resPay.status).toBe(403);

      const resAmount = await request(app).put('/api/cases/case-123/terms/1/amount').send({});
      expect(resAmount.status).toBe(403);
    });

    it('should allow account or admin users past the role middleware', async () => {
      currentRole = 'account';
      // It should not be 403 (will be 404 or validation error because mock DB is not populated, but NOT 403)
      const resLedger = await request(app).get('/api/cases/case-123/ledger');
      expect(resLedger.status).not.toBe(403);
    });
  });

  describe('SEC-CRIT-02: Employee PII & Resignation Access Control', () => {
    it('should reject employee listing for unauthorized roles with 403', async () => {
      currentRole = 'unauthorized_guest';
      const res = await request(app).get('/api/employees');
      expect(res.status).toBe(403);
    });

    it('should reject resignation view and creation for non-HR/non-admin with 403', async () => {
      currentRole = 'support';
      const resGet = await request(app).get('/api/resignations');
      expect(resGet.status).toBe(403);

      const resPost = await request(app).post('/api/resignations').send({
        employeeId: '507f1f77bcf86cd799439011',
        reasonType: 'personal'
      });
      expect(resPost.status).toBe(403);
    });
  });

  describe('SEC-CRIT-03: Default User Role Safety', () => {
    it('should default User role to employee instead of admin', () => {
      const user = new User({ username: 'newuser', password: 'hashedpassword' });
      expect(user.role).toBe('employee');
      expect(user.role).not.toBe('admin');
    });
  });
});
