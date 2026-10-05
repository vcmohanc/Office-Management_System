export const COMPANY_BEARERS = ['VC', 'Office', 'Host Company', 'Dispatch destination: Farm'];

/**
 * Determine the payment direction based on the cost bearer (負担先).
 * @param {string} burdenParty - The selected cost bearer.
 * @returns {'ADD' | 'DEDUCT'}
 */
export const getDirection = (burdenParty) => {
  return COMPANY_BEARERS.includes(burdenParty) ? 'ADD' : 'DEDUCT';
};

/**
 * Calculates installment schedule.
 * Any remainder goes to the first installment.
 * @param {number} totalAmount 
 * @param {number} count - number of installments
 * @param {string} startMonth - 'YYYY-MM'
 * @returns {Array} Array of installment objects
 */
export const calculateInstallments = (totalAmount, count, startMonth) => {
  if (!totalAmount || count <= 0) return [];
  if (count === 1) {
    return [{
      no: 1,
      month: startMonth,
      amount: totalAmount,
      remaining: 0,
      status: 'SCHEDULED'
    }];
  }

  const baseAmount = Math.floor(totalAmount / count);
  const remainder = totalAmount % count;
  
  const schedule = [];
  let remaining = totalAmount;
  
  const [yearStr, monthStr] = startMonth.split('-');
  let currentYear = parseInt(yearStr, 10);
  let currentMonth = parseInt(monthStr, 10);

  for (let i = 1; i <= count; i++) {
    const amount = (i === 1) ? baseAmount + remainder : baseAmount;
    remaining -= amount;
    
    const formattedMonth = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
    
    schedule.push({
      no: i,
      month: formattedMonth,
      amount: amount,
      remaining: remaining,
      status: 'SCHEDULED'
    });

    currentMonth++;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear++;
    }
  }

  return schedule;
};
