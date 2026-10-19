import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const expect = (actual) => ({
  toBe: (expected) => assert.strictEqual(actual, expected),
  not: {
    toBeNull: () => assert.notStrictEqual(actual, null)
  }
});
import { 
  toJP, 
  normalizeOptionValue, 
  getAutoFill, 
  getPaymentMethod, 
  calculateSuggestedExpenseCost,
  getAvailableCollectionMethods,
  isHostCompanyPairing
} from './expenseRules.js';

describe('expenseRules utils', () => {
  describe('toJP translation helper', () => {
    it('translates known expense types to Japanese', () => {
      expect(toJP('Postage')).toBe('郵便料金');
      expect(toJP('Transportation Expenses / Flight Fare')).toBe('交通費 / 航空運賃');
      expect(toJP('Waiting Dormitory Fee')).toBe('待機寮費');
      expect(toJP('Hospital/ Drugs Expenses')).toBe('病院費/薬代');
      expect(toJP('Equipment / Consumable Items')).toBe('備品・消耗品');
      expect(toJP('Visa Application Fee')).toBe('ビザ申請料');
    });

    it('translates known advancer / bearing parties to Japanese', () => {
      expect(toJP('Service Staff')).toBe('サービススタッフ');
      expect(toJP('Support Staff')).toBe('サポートスタッフ');
      expect(toJP('Farm')).toBe('ファーム');
      expect(toJP('Dispatch destination: Farm')).toBe('派遣先: ファーム');
      expect(toJP('Select for each project')).toBe('プロジェクト毎に選択');
    });

    it('falls back to raw label if not in map or returns empty string for nullish', () => {
      expect(toJP('UnknownCustomLabel')).toBe('UnknownCustomLabel');
      expect(toJP('')).toBe('');
      expect(toJP(null)).toBe('');
    });
  });

  describe('normalizeOptionValue helper', () => {
    const mockOptions = [
      { label: 'サービススタッフ', value: 'Service Staff' },
      { label: 'VC', value: 'VC' },
      { label: 'ファーム', value: 'Farm' },
      { label: 'サポートスタッフ', value: 'Support Staff' }
    ];

    it('finds exact value match', () => {
      expect(normalizeOptionValue(mockOptions, 'VC')).toBe('VC');
      expect(normalizeOptionValue(mockOptions, 'Farm')).toBe('Farm');
    });

    it('finds case-insensitive value match', () => {
      expect(normalizeOptionValue(mockOptions, 'service staff')).toBe('Service Staff');
      expect(normalizeOptionValue(mockOptions, 'support staff')).toBe('Support Staff');
    });

    it('matches label to value', () => {
      expect(normalizeOptionValue(mockOptions, 'サービススタッフ')).toBe('Service Staff');
      expect(normalizeOptionValue(mockOptions, 'ファーム')).toBe('Farm');
    });

    it('matches fallback keyword', () => {
      expect(normalizeOptionValue(mockOptions, 'Staff', 'staff')).toBe('Service Staff');
      expect(normalizeOptionValue(mockOptions, 'Dispatch destination: Farm', 'farm')).toBe('Farm');
    });

    it('handles empty or unlisted values safely', () => {
      expect(normalizeOptionValue(mockOptions, '')).toBe('');
      expect(normalizeOptionValue([], 'Service Staff')).toBe('Service Staff');
      expect(normalizeOptionValue(mockOptions, 'NonExistent')).toBe('NonExistent');
    });
  });

  describe('getPaymentMethod helper', () => {
    it('returns direct_transfer for VC to Farm', () => {
      expect(getPaymentMethod('VC', 'Farm')).toBe('direct_transfer');
      expect(getPaymentMethod('VC', 'ファーム')).toBe('direct_transfer');
    });

    it('returns salary_deduction when bearer is staff', () => {
      expect(getPaymentMethod('VC', 'Service Staff')).toBe('salary_deduction');
      expect(getPaymentMethod('Farm', 'サービススタッフ')).toBe('salary_deduction');
    });

    it('returns salary_addition when payer is staff', () => {
      expect(getPaymentMethod('Service Staff', 'VC')).toBe('salary_addition');
      expect(getPaymentMethod('サービススタッフ', 'VC')).toBe('salary_addition');
    });

    it('returns client_invoice as default', () => {
      expect(getPaymentMethod('VC', 'Host Company')).toBe('client_invoice');
    });
  });

  describe('getAutoFill helper', () => {
    it('returns default rules for Postage', () => {
      const fill = getAutoFill('Postage');
      expect(fill).not.toBeNull();
      expect(fill.bearingParty).toBe('VC');
      expect(fill.advancerName).toBe('salary_addition');
    });

    it('aligns with available DB options', () => {
      const dbAdvancers = [{ label: 'サービススタッフ', value: 'Service Staff' }];
      const dbBearers = [{ label: 'VC', value: 'VC' }];
      const fill = getAutoFill('Postage', dbAdvancers, dbBearers);
      expect(fill.advancerCategory).toBe('Service Staff');
      expect(fill.bearingParty).toBe('VC');
    });
  });

  describe('calculateSuggestedExpenseCost helper', () => {
    const mockRegions = [
      { _id: 'reg1', name1: 'Tokyo', name2: 'Tokyo' },
      { _id: 'reg2', name1: 'Osaka', name2: 'Osaka' }
    ];

    it('calculates postal cost from postalMatrix with name1 / name2 match', () => {
      const postalMatrix = {
        'reg1': { 'reg2': '500' }
      };
      const cost = calculateSuggestedExpenseCost({
        expenseType: 'Postage',
        sender: 'Tokyo',
        recipient: 'Osaka',
        regions: mockRegions,
        postalMatrix
      });
      expect(cost).toBe(500);
    });

    it('handles なし in postalMatrix as 0', () => {
      const postalMatrix = {
        'reg1': { 'reg2': 'なし' }
      };
      const cost = calculateSuggestedExpenseCost({
        expenseType: 'Postage',
        sender: 'Tokyo',
        recipient: 'Osaka',
        regions: mockRegions,
        postalMatrix
      });
      expect(cost).toBe(0);
    });

    it('calculates travel cost with bus method', () => {
      const travelMatrix = {
        'reg1': { 'reg2': { bus: '3,000', flight: '10,000' } }
      };
      const cost = calculateSuggestedExpenseCost({
        expenseType: 'Transportation Expenses / Flight Fare',
        departure: 'Tokyo',
        destination: 'Osaka',
        transportMethod: 'バス',
        regions: mockRegions,
        travelMatrix
      });
      expect(cost).toBe(3000);
    });

    it('calculates travel cost with flight method', () => {
      const travelMatrix = {
        'reg1': { 'reg2': { bus: '3,000', flight: '10,000' } }
      };
      const cost = calculateSuggestedExpenseCost({
        expenseType: 'Transportation Expenses / Flight Fare',
        departure: 'Tokyo',
        destination: 'Osaka',
        transportMethod: '飛行機',
        regions: mockRegions,
        travelMatrix
      });
      expect(cost).toBe(10000);
    });

    it('returns 0 for unselected or missing endpoints', () => {
      expect(calculateSuggestedExpenseCost({
        expenseType: 'Postage',
        sender: '',
        recipient: ''
      })).toBe(0);
      expect(calculateSuggestedExpenseCost({
        expenseType: 'other',
        sender: 'Tokyo',
        recipient: 'Osaka'
      })).toBe(0);
    });
  });

  describe('getAvailableCollectionMethods helper', () => {
    it('returns salary deduction options when payment type is salary_deduction', () => {
      const methods = getAvailableCollectionMethods('salary_deduction');
      assert.ok(methods.some(m => m.value === '給与控除'));
      assert.ok(methods.some(m => m.value === '自動引落'));
      assert.ok(!methods.some(m => m.value === '直接集金'));
    });

    it('returns invoice options when payment type is client_invoice', () => {
      const methods = getAvailableCollectionMethods('client_invoice');
      assert.ok(methods.some(m => m.value === '請求書発行'));
      assert.ok(methods.some(m => m.value === '相殺処理'));
    });

    it('returns direct transfer options when payment type is direct_transfer', () => {
      const methods = getAvailableCollectionMethods('direct_transfer');
      assert.ok(methods.some(m => m.value === '直接集金'));
      assert.ok(methods.some(m => m.value === '銀行振込'));
    });

    it('restricts options directly to 銀行振込 and 農場への直接回収 when pairing is VC <-> Farm', () => {
      const vcToFarm = getAvailableCollectionMethods('salary_deduction', 'VC', 'Farm');
      assert.strictEqual(vcToFarm.length, 2);
      assert.strictEqual(vcToFarm[0].value, '銀行振込');
      assert.strictEqual(vcToFarm[1].value, '農場への直接回収');

      const farmToVc = getAvailableCollectionMethods('client_invoice', 'Farm', 'VC');
      assert.strictEqual(farmToVc.length, 2);
      assert.strictEqual(farmToVc[0].value, '銀行振込');
      assert.strictEqual(farmToVc[1].value, '農場への直接回収');
      assert.ok(!farmToVc.some(m => m.value === '給与控除'));
      assert.ok(!farmToVc.some(m => m.value === '請求書発行'));
    });

    it('returns empty array when payment type is empty and not host company pairing', () => {
      assert.deepStrictEqual(getAvailableCollectionMethods(''), []);
    });
  });

  describe('isHostCompanyPairing helper', () => {
    it('returns true for VC -> Farm', () => {
      assert.strictEqual(isHostCompanyPairing('VC', 'Farm'), true);
      assert.strictEqual(isHostCompanyPairing('VC', 'ファーム'), true);
      assert.strictEqual(isHostCompanyPairing('VC', 'Dispatch destination: Farm'), true);
    });

    it('returns true for Farm -> VC', () => {
      assert.strictEqual(isHostCompanyPairing('Farm', 'VC'), true);
      assert.strictEqual(isHostCompanyPairing('ファーム', 'VC'), true);
      assert.strictEqual(isHostCompanyPairing('Dispatch destination: Farm', 'VC'), true);
    });

    it('returns false for other combinations', () => {
      assert.strictEqual(isHostCompanyPairing('Service Staff', 'VC'), false);
      assert.strictEqual(isHostCompanyPairing('VC', 'Service Staff'), false);
      assert.strictEqual(isHostCompanyPairing('Support Staff', 'Farm'), false);
    });
  });
});
