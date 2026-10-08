import { getAutoFill, getPaymentMethod } from './expenseRules.js';

describe('expenseRules utils', () => {
  describe('getPaymentMethod', () => {
    it('returns 給与から控除 if bearer is Service staff', () => {
      expect(getPaymentMethod('VC', 'サポートスタッフ')).toBe('給与から控除');
      expect(getPaymentMethod('ファーム', 'サポートスタッフ')).toBe('給与から控除');
    });

    it('returns 給与に加算 if payer is Service staff (and bearer is not)', () => {
      expect(getPaymentMethod('サポートスタッフ', 'VC')).toBe('給与に加算');
      expect(getPaymentMethod('サポートスタッフ', 'ファーム')).toBe('給与に加算');
    });

    it('returns 銀行振込 for other cases (between VC and Farm)', () => {
      expect(getPaymentMethod('VC', 'ファーム')).toBe('銀行振込');
      expect(getPaymentMethod('ファーム', 'VC')).toBe('銀行振込');
    });
  });

  describe('getAutoFill', () => {
    it('handles Postage (郵便料金)', () => {
      const result = getAutoFill('Postage');
      expect(result).toEqual({
        advancerCategory: 'サポートスタッフ',
        bearingParty: 'VC',
        advancerName: '給与に加算',
        sender: 'VC',
        recipient: 'サポートスタッフ',
        editable: false
      });
    });

    it('handles Transportation Expenses / Flight Fare (交通費・航空券)', () => {
      const result = getAutoFill('Transportation Expenses / Flight Fare');
      expect(result).toEqual({
        advancerCategory: 'サポートスタッフ',
        bearingParty: 'VC',
        advancerName: '給与に加算',
        sender: 'VC',
        recipient: 'サポートスタッフ',
        editable: false
      });
    });

    it('handles Visa application fee (ビザ申請費用)', () => {
      const result = getAutoFill('Visa application fee');
      expect(result).toEqual({
        advancerCategory: 'VC',
        bearingParty: 'サポートスタッフ',
        advancerName: '給与から控除',
        sender: 'サポートスタッフ',
        recipient: 'VC',
        editable: false
      });
    });

    it('handles Waiting Dormitory Fee (待機寮費)', () => {
      const result = getAutoFill('Waiting Dormitory Fee');
      expect(result).toEqual({
        advancerCategory: 'サポートスタッフ',
        bearingParty: 'VC',
        advancerName: '給与に加算',
        sender: 'VC',
        recipient: 'サポートスタッフ',
        editable: false
      });
    });

    it('handles Hostel Fee (ホステル費用)', () => {
      const result = getAutoFill('Hostel Fee');
      expect(result).toEqual({
        advancerCategory: 'VC',
        bearingParty: 'サポートスタッフ',
        advancerName: '給与から控除',
        sender: 'サポートスタッフ',
        recipient: 'VC',
        editable: false
      });
    });

    it('handles Equipment/Supplies (備品・消耗品)', () => {
      const result = getAutoFill('Equipment/Supplies');
      expect(result).toEqual({
        advancerCategory: 'VC',
        bearingParty: 'ファーム',
        advancerName: '銀行振込',
        sender: 'ファーム',
        recipient: 'VC',
        editable: false
      });
    });

    it('handles Hospital/ Drugs Expenses (病院費/薬代)', () => {
      const result = getAutoFill('Hospital/ Drugs Expenses');
      expect(result).toEqual({
        advancerCategory: 'ファーム',
        bearingParty: 'サポートスタッフ',
        advancerName: '給与から控除',
        sender: 'サポートスタッフ',
        recipient: 'ファーム',
        editable: false
      });
    });

    it('handles Drugs (薬代)', () => {
      const result = getAutoFill('Drugs');
      expect(result).toEqual({
        advancerCategory: 'ファーム',
        bearingParty: 'サポートスタッフ',
        advancerName: '給与から控除',
        sender: 'サポートスタッフ',
        recipient: 'ファーム',
        editable: false
      });
    });

    it('handles WIFI (Wi-Fi)', () => {
      const result = getAutoFill('WIFI');
      expect(result).toEqual({
        advancerCategory: 'VC',
        bearingParty: 'ファーム',
        advancerName: '銀行振込',
        sender: 'ファーム',
        recipient: 'VC',
        editable: false
      });
    });

    it('handles others (その他)', () => {
      const result = getAutoFill('others');
      expect(result.editable).toBe(true);
      expect(result.advancerCategory).toBe('');
      expect(result.bearingParty).toBe('');
      expect(result.sender).toBe('');
      expect(result.recipient).toBe('');
    });
  });
});
