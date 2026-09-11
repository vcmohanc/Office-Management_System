export const validateExpenseAmount = (enteredAmount, suggestedAmount) => {
  // If suggestedAmount is not present or <= 0, no validation needed against it
  const suggestedNum = Number(String(suggestedAmount).replace(/,/g, ''));
  if (isNaN(suggestedNum) || suggestedNum <= 0) {
    return { isValid: true, message: '' };
  }

  // Allow empty or zero amount (handled by other validation logic like "required")
  if (enteredAmount === '' || enteredAmount === null || enteredAmount === undefined) {
    return { isValid: true, message: '' };
  }

  const enteredNum = Number(String(enteredAmount).replace(/,/g, ''));
  
  if (isNaN(enteredNum)) {
    return { isValid: false, message: 'Invalid amount entered.' };
  }

  if (enteredNum > suggestedNum) {
    return { 
      isValid: false, 
      message: `Entered amount exceeds the suggested amount of ¥${suggestedNum.toLocaleString()}` 
    };
  }

  return { isValid: true, message: '' };
};
