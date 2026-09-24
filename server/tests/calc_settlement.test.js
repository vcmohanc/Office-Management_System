import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateLedgerForCase } from '../utils/calc_settlement.js';
import SettlementLedger from '../models/SettlementLedger.js';
import SettlementClaimItem from '../models/SettlementClaimItem.js';
import SettlementPayment from '../models/SettlementPayment.js';

vi.mock('../models/SettlementLedger.js', () => {
  const mockLedger = {
    save: vi.fn().mockResolvedValue(true)
  };
  class MockLedgerModel {
    constructor(data) {
      Object.assign(this, mockLedger, data);
    }
  }
  MockLedgerModel.findOne = vi.fn().mockResolvedValue(null);
  return { default: MockLedgerModel };
});

vi.mock('../models/SettlementClaimItem.js', () => {
  const mockClaim = {
    save: vi.fn().mockResolvedValue(true)
  };
  class MockClaimModel {
    constructor(data) {
      Object.assign(this, mockClaim, data);
    }
  }
  return { default: MockClaimModel };
});

vi.mock('../models/SettlementPayment.js', () => {
  const mockPayment = {
    save: vi.fn().mockResolvedValue(true)
  };
  class MockPaymentModel {
    constructor(data) {
      Object.assign(this, mockPayment, data);
    }
  }
  MockPaymentModel.insertMany = vi.fn().mockResolvedValue(true);
  return { default: MockPaymentModel };
});

describe('calc_settlement.js - generateLedgerForCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate installments with correct rounding and remainder in last term', async () => {
    const caseDoc = {
      _id: 'test-case-id-1',
      staff_id: 'S001',
      staff_name: 'John Doe',
      final_total_amount: 10000,
      installment_count: 3,
      settlement_method: 'Bank Transfer'
    };

    const ledger = await generateLedgerForCase(caseDoc);
    
    // Check ledger creation
    expect(SettlementLedger.findOne).toHaveBeenCalledWith({ caseId: 'test-case-id-1' });

    // Check insertMany for payments
    expect(SettlementPayment.insertMany).toHaveBeenCalled();
    const paymentsArg = SettlementPayment.insertMany.mock.calls[0][0];
    
    expect(paymentsArg.length).toBe(3);
    
    // 10000 / 3 = 3333, remainder 1.
    // Term 1: 3333
    // Term 2: 3333
    // Term 3: 3334
    expect(paymentsArg[0].scheduledAmount).toBe(3333);
    expect(paymentsArg[1].scheduledAmount).toBe(3333);
    expect(paymentsArg[2].scheduledAmount).toBe(3334);
    
    const sum = paymentsArg.reduce((acc, p) => acc + p.scheduledAmount, 0);
    expect(sum).toBe(10000);
  });

  it('should handle zero total accurately without crashing', async () => {
    const caseDoc = {
      _id: 'test-case-id-2',
      final_total_amount: 0,
      installment_count: 4
    };

    await generateLedgerForCase(caseDoc);
    
    const paymentsArg = SettlementPayment.insertMany.mock.calls[0][0];
    expect(paymentsArg.length).toBe(4);
    expect(paymentsArg[0].scheduledAmount).toBe(0);
    expect(paymentsArg[3].scheduledAmount).toBe(0);
    
    const sum = paymentsArg.reduce((acc, p) => acc + p.scheduledAmount, 0);
    expect(sum).toBe(0);
  });
  
  it('should abort and return existing ledger if one exists', async () => {
    // Mock findOne to return an existing ledger
    const mockExistingLedger = { _id: 'existing-ledger' };
    SettlementLedger.findOne.mockResolvedValueOnce(mockExistingLedger);
    
    const caseDoc = { _id: 'test-case-id-3', final_total_amount: 5000, installment_count: 2 };
    const result = await generateLedgerForCase(caseDoc);
    
    expect(result).toBe(mockExistingLedger);
    expect(SettlementPayment.insertMany).not.toHaveBeenCalled();
  });
});
