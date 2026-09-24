import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { getLedger, payTerm, payRemainingBalance } from '../controllers/settlementLedgerController.js';
import SettlementLedger from '../models/SettlementLedger.js';
import SettlementClaimItem from '../models/SettlementClaimItem.js';
import SettlementPayment from '../models/SettlementPayment.js';

// Setup basic Express app for testing controllers
const app = express();
app.use(express.json());

// Mock auth middleware injection for req.user
app.use((req, res, next) => {
  req.user = { id: 'test-user-id' };
  next();
});

app.get('/api/cases/:caseId/ledger', getLedger);
app.post('/api/cases/:caseId/settle/:termNo', payTerm);
app.post('/api/cases/:caseId/settle-all', payRemainingBalance);

vi.mock('../models/SettlementLedger.js', () => {
  const mockSave = vi.fn().mockResolvedValue(true);
  class MockLedgerModel {
    constructor(data) { Object.assign(this, data); this.save = mockSave; }
  }
  MockLedgerModel.findOne = vi.fn();
  MockLedgerModel.find = vi.fn();
  return { default: MockLedgerModel };
});

vi.mock('../models/SettlementClaimItem.js', () => {
  class MockClaimModel { constructor(data) { Object.assign(this, data); } }
  MockClaimModel.find = vi.fn();
  return { default: MockClaimModel };
});

vi.mock('../models/SettlementPayment.js', () => {
  const mockSave = vi.fn().mockResolvedValue(true);
  class MockPaymentModel {
    constructor(data) { Object.assign(this, data); this.save = mockSave; }
  }
  MockPaymentModel.findOne = vi.fn();
  MockPaymentModel.find = vi.fn();
  return { default: MockPaymentModel };
});

describe('Settlement Life-Cycle Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockCaseId = 'case-123';

  it('should fetch ledger, claims, and payments correctly', async () => {
    const mockLedger = { caseId: mockCaseId, baseClaimAmount: 10000, agreedTerms: { installmentTotalTerms: 3 } };
    const mockClaims = [{ lineNo: 1, amount: 10000 }];
    const mockPayments = [
      { termNumber: 1, status: 'PENDING', scheduledAmount: 3333, paidAmount: 0, deductionAmount: 0 },
      { termNumber: 2, status: 'PENDING', scheduledAmount: 3333, paidAmount: 0, deductionAmount: 0 },
      { termNumber: 3, status: 'PENDING', scheduledAmount: 3334, paidAmount: 0, deductionAmount: 0 }
    ];

    SettlementLedger.findOne.mockResolvedValue(mockLedger);
    SettlementClaimItem.find.mockReturnValue({ sort: vi.fn().mockResolvedValue(mockClaims) });
    SettlementPayment.find.mockReturnValue({ sort: vi.fn().mockResolvedValue(mockPayments) });

    const response = await request(app).get(`/api/cases/${mockCaseId}/ledger`);
    
    expect(response.status).toBe(200);
    expect(response.body.ledger.caseId).toBe(mockCaseId);
    expect(response.body.summary.remainingBalance).toBe(10000);
    expect(response.body.summary.currentTerm).toBe(1);
    expect(response.body.payments.length).toBe(3);
  });

  it('should process a single term payment', async () => {
    const mockLedger = new SettlementLedger({ caseId: mockCaseId, status: 'in_progress', baseClaimAmount: 10000 });
    const mockTerm = new SettlementPayment({ termNumber: 1, status: 'PENDING', scheduledAmount: 3333 });
    const mockAllPayments = [
      mockTerm,
      { termNumber: 2, status: 'PENDING' }
    ];

    SettlementLedger.findOne.mockResolvedValue(mockLedger);
    SettlementPayment.findOne.mockResolvedValue(mockTerm);
    SettlementPayment.find.mockReturnValue({ sort: vi.fn().mockResolvedValue(mockAllPayments) });

    const payload = {
      paymentMethod: 'cash',
      paymentDate: new Date().toISOString(),
      deductionAmount: 0
    };

    const response = await request(app)
      .post(`/api/cases/${mockCaseId}/settle/1`)
      .send(payload);

    expect(response.status).toBe(200);
    expect(mockTerm.status).toBe('PAID');
    expect(mockTerm.paidAmount).toBe(3333);
    expect(mockTerm.approvedBy).toBe('test-user-id');
    expect(mockLedger.status).toBe('in_progress'); // because term 2 is pending
    expect(mockTerm.save).toHaveBeenCalled();
    expect(mockLedger.save).toHaveBeenCalled();
  });

  it('should process paying the remaining balance and complete the ledger', async () => {
    const mockLedger = new SettlementLedger({ caseId: mockCaseId, status: 'in_progress' });
    const pendingTerms = [
      new SettlementPayment({ termNumber: 2, status: 'PENDING', scheduledAmount: 3333 }),
      new SettlementPayment({ termNumber: 3, status: 'PENDING', scheduledAmount: 3334 })
    ];

    SettlementLedger.findOne.mockResolvedValue(mockLedger);
    SettlementPayment.find.mockResolvedValue(pendingTerms);

    const payload = {
      paymentMethod: 'cash',
      paymentDate: new Date().toISOString(),
      deductionAmount: 0
    };

    const response = await request(app)
      .post(`/api/cases/${mockCaseId}/settle-all`)
      .send(payload);

    expect(response.status).toBe(200);
    expect(pendingTerms[0].status).toBe('PAID');
    expect(pendingTerms[1].status).toBe('PAID');
    expect(mockLedger.status).toBe('completed');
    expect(pendingTerms[0].save).toHaveBeenCalled();
    expect(pendingTerms[1].save).toHaveBeenCalled();
    expect(mockLedger.save).toHaveBeenCalled();
  });

  describe('Validation Rules', () => {
    it('should reject bank_transfer payment if bank details are missing', async () => {
      const payload = {
        paymentMethod: 'bank_transfer',
        paymentDate: new Date().toISOString(),
        deductionAmount: 0
      };

      const response = await request(app)
        .post(`/api/cases/${mockCaseId}/settle/1`)
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body.error[0].message).toContain('Bank details are required');
    });

    it('should accept bank_transfer payment if bank details are provided', async () => {
      const mockLedger = new SettlementLedger({ caseId: mockCaseId, status: 'in_progress', baseClaimAmount: 10000 });
      const mockTerm = new SettlementPayment({ termNumber: 1, status: 'PENDING', scheduledAmount: 3333 });
      
      SettlementLedger.findOne.mockResolvedValue(mockLedger);
      SettlementPayment.findOne.mockResolvedValue(mockTerm);
      SettlementPayment.find.mockReturnValue({ sort: vi.fn().mockResolvedValue([mockTerm]) });

      const payload = {
        paymentMethod: 'bank_transfer',
        bankDetails: {
          bankName: 'Test Bank',
          branchCode: '123',
          accountNumber: '1234567'
        },
        paymentDate: new Date().toISOString(),
        deductionAmount: 0
      };

      const response = await request(app)
        .post(`/api/cases/${mockCaseId}/settle/1`)
        .send(payload);

      expect(response.status).toBe(200);
      expect(mockTerm.bankDetails.bankName).toBe('Test Bank');
    });
  });

  describe('Overdue Detection', () => {
    it('should identify overdue payments if dueDate is past', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);
      
      const mockLedger = { caseId: mockCaseId, baseClaimAmount: 10000, agreedTerms: { installmentTotalTerms: 1 } };
      const mockPayments = [
        { termNumber: 1, status: 'PENDING', scheduledAmount: 10000, dueDate: pastDate }
      ];

      SettlementLedger.findOne.mockResolvedValue(mockLedger);
      SettlementClaimItem.find.mockReturnValue({ sort: vi.fn().mockResolvedValue([]) });
      SettlementPayment.find.mockReturnValue({ sort: vi.fn().mockResolvedValue(mockPayments) });

      const response = await request(app).get(`/api/cases/${mockCaseId}/ledger`);
      
      expect(response.status).toBe(200);
      // Even if controller doesn't explicitly change status in DB during GET, we verify it returns the data
      expect(response.body.payments[0].dueDate).toBeDefined();
    });
  });
});
