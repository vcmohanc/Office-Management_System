import Region from '../models/Region.js';
import PostalCharge from '../models/PostalCharge.js';
import TravelCharge from '../models/TravelCharge.js';

export const validateBackendExpenseAmount = async (expenseType, expenseAmount, locations) => {
  if (expenseAmount <= 0) return true;

  if (expenseType === 'Postage' && locations.sender && locations.recipient) {
    const sender = await Region.findOne({ name1: locations.sender });
    const recipient = await Region.findOne({ name2: locations.recipient });
    if (sender && recipient) {
      const charge = await PostalCharge.findOne({ departure: sender._id });
      if (charge && charge.charges && charge.charges.has(recipient._id.toString())) {
        const rawCost = charge.charges.get(recipient._id.toString());
        const suggestedAmount = typeof rawCost === 'string' ? Number(rawCost.replace(/,/g, '')) : Number(rawCost);
        if (suggestedAmount > 0 && expenseAmount > suggestedAmount) {
          return { isValid: false, expected: suggestedAmount };
        }
      }
    }
  }

  if (expenseType === 'Transportation' && locations.departure && locations.destination) {
    const departure = await Region.findOne({ name1: locations.departure });
    const destination = await Region.findOne({ name2: locations.destination });
    if (departure && destination) {
      const charge = await TravelCharge.findOne({ departure: departure._id });
      if (charge && charge.charges && charge.charges.has(destination._id.toString())) {
        const rawCost = charge.charges.get(destination._id.toString());
        const suggestedAmount = typeof rawCost === 'string' ? Number(rawCost.replace(/,/g, '')) : Number(rawCost);
        if (suggestedAmount > 0 && expenseAmount > suggestedAmount) {
          return { isValid: false, expected: suggestedAmount };
        }
      }
    }
  }

  return { isValid: true };
};
