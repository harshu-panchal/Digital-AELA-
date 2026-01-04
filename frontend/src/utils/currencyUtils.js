/**
 * Formats a numeric value as a currency string in Indian Rupees (INR).
 * 
 * @param {number} amount - The numeric value to format.
 * @param {Object} options - Additional formatting options.
 * @param {boolean} options.showSymbol - Whether to show the currency symbol (default: true).
 * @param {number} options.minimumFractionDigits - Minimum number of fraction digits (default: 2).
 * @param {number} options.maximumFractionDigits - Maximum number of fraction digits (default: 2).
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

  return new Intl.NumberFormat('en-IN', {
    style: showSymbol ? 'currency' : 'decimal',
    currency: 'INR',
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(numericAmount);
};

/**
 * Returns the currency symbol for INR.
 * @returns {string} The INR symbol (₹).
 */
export const getCurrencySymbol = () => '₹';

/**
 * Returns the currency code.
 * @returns {string} The currency code (INR).
 */
export const getCurrencyCode = () => 'INR';
