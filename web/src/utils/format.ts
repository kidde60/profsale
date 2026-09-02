const ugxFormatter = new Intl.NumberFormat('en-UG', {
  style: 'currency',
  currency: 'UGX',
  maximumFractionDigits: 0,
});

export const formatCurrency = (value: number | string | null | undefined): string => {
  const amount = typeof value === 'string' ? Number(value) : value ?? 0;
  if (!Number.isFinite(amount)) {
    return 'UGX 0';
  }

  return ugxFormatter.format(amount).replace('UGX', 'UGX');
};

export const formatCompactNumber = (value: number): string => {
  return new Intl.NumberFormat('en-UG').format(value);
};
