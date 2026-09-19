/**
 * Single place to change currency/locale for the whole UI.
 * Change 'en-US' / 'USD' to e.g. 'en-BD' / 'BDT' as needed.
 */
export const formatPrice = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Number(value) || 0);
