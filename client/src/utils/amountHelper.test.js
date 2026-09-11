import { validateExpenseAmount } from './amountHelper';

describe('validateExpenseAmount', () => {
  it('returns true when entered amount is less than suggested amount', () => {
    const result = validateExpenseAmount(4000, 4530);
    expect(result.isValid).toBe(true);
    expect(result.message).toBe('');
  });

  it('returns true when entered amount is equal to suggested amount', () => {
    const result = validateExpenseAmount(4530, 4530);
    expect(result.isValid).toBe(true);
  });

  it('returns false and error message when entered amount is greater than suggested amount', () => {
    const result = validateExpenseAmount(5000, 4530);
    expect(result.isValid).toBe(false);
    expect(result.message).toBe('Entered amount exceeds the suggested amount of ¥4,530');
  });

  it('handles string inputs and strips formatting/commas', () => {
    const result = validateExpenseAmount('5,000', '4,530');
    expect(result.isValid).toBe(false);
    expect(result.message).toBe('Entered amount exceeds the suggested amount of ¥4,530');
    
    const validResult = validateExpenseAmount('4,000', '4,530');
    expect(validResult.isValid).toBe(true);
  });

  it('returns true for empty or zero amounts', () => {
    expect(validateExpenseAmount('', 4530).isValid).toBe(true);
    expect(validateExpenseAmount(0, 4530).isValid).toBe(true);
    expect(validateExpenseAmount(null, 4530).isValid).toBe(true);
    expect(validateExpenseAmount(undefined, 4530).isValid).toBe(true);
  });

  it('returns true when suggested amount is missing or zero', () => {
    expect(validateExpenseAmount(5000, 0).isValid).toBe(true);
    expect(validateExpenseAmount(5000, null).isValid).toBe(true);
    expect(validateExpenseAmount(5000, undefined).isValid).toBe(true);
  });
});
