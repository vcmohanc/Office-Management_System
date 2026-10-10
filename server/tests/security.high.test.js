import '../config/env.js';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import b2bRoutes from '../routes/b2b.js';
import B2BPartner from '../models/B2BPartner.js';

vi.mock('../models/B2BPartner.js', () => ({
  default: {
    find: vi.fn().mockReturnValue({
      skip: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          sort: vi.fn().mockResolvedValue([])
        })
      })
    }),
    countDocuments: vi.fn().mockResolvedValue(0)
  }
}));

describe('Security High Severity Tests (SEC-HIGH)', () => {
  let app;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/b2b', b2bRoutes);
  });

  describe('SEC-HIGH-04: ReDoS & Parameter DoS Prevention', () => {
    it('should safely escape regex special characters in search query', async () => {
      const maliciousRegex = '(a+)+$';
      const res = await request(app).get(`/api/b2b/engagements?search=${encodeURIComponent(maliciousRegex)}`);
      expect(res.status).toBe(200);

      // Verify that Mongoose find was called with escaped regex
      const findCallArg = B2BPartner.find.mock.calls[0][0];
      const regexPattern = findCallArg.$or[0].partner_name.$regex;
      expect(regexPattern).toBe('\\(a\\+\\)\\+\\$');
    });

    it('should clamp limit parameter to a safe maximum of 100', async () => {
      const hugeLimit = 1000000;
      const res = await request(app).get(`/api/b2b/engagements?limit=${hugeLimit}`);
      expect(res.status).toBe(200);

      // Verify skip/limit call received clamped limit
      const findResult = B2BPartner.find();
      const skipResult = findResult.skip();
      expect(skipResult.limit).toHaveBeenCalledWith(100);
    });
  });
});
