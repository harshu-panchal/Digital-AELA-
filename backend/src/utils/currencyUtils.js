/**
 * Formats a numeric value as a currency string in Indian Rupees (INR).
 * 
 * @param {number} amount - The numeric value to format.
 * @param {Object} options - Additional formatting options.
 * @returns {string} The formatted currency string.
 */
export const formatCurrency = (amount, options = {}) => {
  const {
    showSymbol = true,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = options;

  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numericAmount)) {
    return showSymbol ? '₹ 0.00' : '0.00';
  }

  // Node.js support for Intl might vary depending on ICU data, 
  // but most modern versions support en-IN.
  return new Intl.NumberFormat('en-IN', {
    style: showSymbol ? 'currency' : 'decimal',
    currency: 'INR',
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(numericAmount);
};

/**
 * Returns the default currency code.
 * @returns {string}
 */
export const getDefaultCurrency = () => 'INR';

/**
 * Returns the currency symbol.
 * @returns {string}
 */
export const getCurrencySymbol = () => '₹';
