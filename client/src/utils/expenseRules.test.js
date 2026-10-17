import { describe, it, expect } from 'vitest';
import { getAutoFill, getPaymentMethod, EXPENSE_RULES_MAPPING } from './expenseRules.js';

describe('expenseRules utils', () => {
  describe('getPaymentMethod', () => {
    it('returns salary_deduction if bearer is Service staff', () => {
      expect(getPaymentMethod('VC', 'Service staff')).toBe('salary_deduction');
      expect(getPaymentMethod('VC', 'Service Staff')).toBe('salary_deduction');
      expect(getPaymentMethod('Dispatch destination: Farm', 'Service staff')).toBe('salary_deduction');
      expect(getPaymentMethod('VC', 'サポートスタッフ')).toBe('salary_deduction');
    });

    it('returns salary_addition if payer is Service staff (and bearer is not)', () => {
      expect(getPaymentMethod('Service staff', 'VC')).toBe('salary_addition');
      expect(getPaymentMethod('Service Staff', 'VC')).toBe('salary_addition');
      expect(getPaymentMethod('サポートスタッフ', 'VC')).toBe('salary_addition');
    });

    it('returns direct_transfer for VC advancing to Farm', () => {
      expect(getPaymentMethod('VC', 'Dispatch destination: Farm')).toBe('direct_transfer');
      expect(getPaymentMethod('VC', 'Farm')).toBe('direct_transfer');
      expect(getPaymentMethod('VC', 'ファーム')).toBe('direct_transfer');
    });

    it('returns client_invoice for other combinations', () => {
      expect(getPaymentMethod('Office', 'VC')).toBe('client_invoice');
    });
  });

  describe('getAutoFill', () => {
    it('handles Postage', () => {
      const result = getAutoFill('Postage');
      expect(result).toEqual({
        advancerCategory: 'Service staff',
        bearingParty: 'VC',
        advancerName: 'salary_addition'
      });
    });

    it('handles Transportation Expenses / Flight Fare', () => {
      const result = getAutoFill('Transportation Expenses / Flight Fare');
      expect(result).toEqual({
        advancerCategory: 'Service staff',
        bearingParty: 'VC',
        advancerName: 'salary_addition'
      });
    });

    it('handles Visa application fee', () => {
      const result = getAutoFill('Visa application fee');
      expect(result).toEqual({
        advancerCategory: 'VC',
        bearingParty: 'Service staff',
        advancerName: 'salary_deduction'
      });
    });

    it('handles Equipment/Supplies', () => {
      const result = getAutoFill('Equipment/Supplies');
      expect(result).toEqual({
        advancerCategory: 'VC',
        bearingParty: 'Dispatch destination: Farm',
        advancerName: 'direct_transfer'
      });
    });

    it('handles dynamic matching against DB options', () => {
      const mockAdvancers = [
        { value: 'Service staff', label: 'Service staff' },
        { value: 'VC', label: 'VC' }
      ];
      const mockBearers = [
        { value: 'Dispatch destination: Farm', label: 'Farm' },
        { value: 'VC', label: 'VC' }
      ];
      const result = getAutoFill('Postage', mockAdvancers, mockBearers);
      expect(result.advancerCategory).toBe('Service staff');
      expect(result.bearingParty).toBe('VC');
    });

    it('returns null for unknown expense type', () => {
      expect(getAutoFill('NonExistentType')).toBeNull();
    });
  });
});
