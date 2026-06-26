interface FeeResult {
  serviceFee: number;
  paymentFee: number;
  totalFees: number;
}

export function calculateFees(amount: number): FeeResult {
  const serviceFee = Math.round(amount * 0.037 + 179) / 100;
  const paymentFee = Math.round(amount * 0.029 * 100) / 100;
  const totalFees = Math.round((serviceFee + paymentFee) * 100) / 100;
  return { serviceFee, paymentFee, totalFees };
}
