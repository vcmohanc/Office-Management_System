import { calculateSettlementMetrics } from './settlementPatterns.js';

describe('calculateSettlementMetrics', () => {
  it('handles zero advanced', () => {
    const records = [];
    const metrics = calculateSettlementMetrics(records);
    expect(metrics.totalAdvanced).toBe(0);
    expect(metrics.totalRecovered).toBe(0);
    expect(metrics.netExposure).toBe(0);
    expect(metrics.progress).toBe(0);
    expect(metrics.active).toBe(0);
  });

  it('handles partial recovery', () => {
    const records = [
      {
        finalTotal: 1000,
        installment_count: 2,
        paidTerms: 1
      },
      {
        finalTotal: 500,
        installment_count: 1,
        paidTerms: 0
      }
    ];
    // Record 1: 1000 total, 2 terms, 1 paid -> 500 remaining -> 500 recovered
    // Record 2: 500 total, 1 term, 0 paid -> 500 remaining -> 0 recovered
    // Total advanced: 1500, recovered: 500, remaining: 1000, active: 2
    const metrics = calculateSettlementMetrics(records);
    expect(metrics.totalAdvanced).toBe(1500);
    expect(metrics.totalRecovered).toBe(500);
    expect(metrics.netExposure).toBe(1000);
    expect(metrics.progress).toBe((500 / 1500) * 100);
    expect(metrics.active).toBe(2);
  });

  it('handles full recovery', () => {
    const records = [
      {
        finalTotal: 1000,
        installment_count: 2,
        paidTerms: 2
      }
    ];
    // Record 1: 1000 total, 2 terms, 2 paid -> 0 remaining -> 1000 recovered
    const metrics = calculateSettlementMetrics(records);
    expect(metrics.totalAdvanced).toBe(1000);
    expect(metrics.totalRecovered).toBe(1000);
    expect(metrics.netExposure).toBe(0);
    expect(metrics.progress).toBe(100);
    expect(metrics.active).toBe(0);
  });

  it('handles over-recovery', () => {
    const records = [
      {
        finalTotal: 1000,
        installment_count: 1,
        paidTerms: 2 // Over-recovered (e.g. 2 * 1000 = 2000)
      }
    ];
    // Record 1: amt 1000, paidTerms 2. nextPayment = 1000.
    // remaining = Math.max(0, 1000 - 2000) = 0.
    // recovered = 1000 - 0 = 1000.
    // Wait, the calculation in `calculateSettlementMetrics` clamps remaining to 0, so recovered is exactly 1000.
    const metrics = calculateSettlementMetrics(records);
    expect(metrics.totalAdvanced).toBe(1000);
    expect(metrics.totalRecovered).toBe(1000); // Because remaining is clamped to >= 0
    expect(metrics.netExposure).toBe(0);
    expect(metrics.progress).toBe(100);
    expect(metrics.active).toBe(0);
  });
});
