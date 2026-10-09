export const PAYMENT_METHODS = [
  { value: '銀行振込', label: '銀行振込 (Bank Transfer)' },
  { value: '給与振込', label: '給与振込 (Payroll Transfer)' },
  { value: '小口現金', label: '小口現金 (Petty Cash)' },
  { value: '小切手', label: '小切手 (Check)' },
  { value: '給与に加算', label: '給与に加算 (Addition to salary)' },
  { value: '給与控除', label: '給与控除 (Deduction from salary)' },
  { value: '法人カード', label: '法人カード (Corporate Card)' },
  { value: 'Cash', label: '現金 (Cash)' },
];

export const getPaymentMethodLabel = (val) => {
  const method = PAYMENT_METHODS.find(m => m.value === val);
  return method ? method.label : val;
};
