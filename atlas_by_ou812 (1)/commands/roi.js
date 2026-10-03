export function calculateRoi(argument) {
  const values = {};
  const tokens = argument.match(/(?:^|\s)(investment|monthly_benefit|monthly_cost|months)=([^\s]+)/gi) || [];
  for (const token of tokens) {
    const [rawKey, rawValue] = token.trim().split('=');
    const key = rawKey.toLowerCase();
    const value = Number(rawValue);
    if (Object.hasOwn(values, key)) {
      return `Provide each ROI input only once: \`${key}=...\`.`;
    }
    if (!Number.isFinite(value) || value < 0) {
      return 'ROI inputs must be non-negative numbers. Use `/roi investment=12000 monthly_benefit=3500 months=12`.';
    }
    values[key] = value;
  }

  if (tokens.length !== argument.trim().split(/\s+/).length || !Number.isFinite(values.investment) || values.investment <= 0 || !Number.isFinite(values.monthly_benefit) || !Number.isInteger(values.months) || values.months < 1 || values.months > 1200) {
    return 'Use `/roi investment=<amount> monthly_benefit=<amount> months=<1-1200> [monthly_cost=<amount>]`. Example: `/roi investment=12000 monthly_benefit=3500 monthly_cost=500 months=12`.';
  }

  const monthlyCost = values.monthly_cost || 0;
  const monthlyNet = values.monthly_benefit - monthlyCost;
  const totalNet = monthlyNet * values.months - values.investment;
  const roi = (totalNet / values.investment) * 100;
  const format = (number) => number.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const payback = monthlyNet > 0
    ? `Payback: ${format(values.investment / monthlyNet)} months`
    : 'Payback: not reached (monthly net benefit is zero or negative)';

  return `**Simple business case**\nInitial investment: ${format(values.investment)}\nMonthly net benefit: ${format(monthlyNet)} (${format(values.monthly_benefit)} benefit - ${format(monthlyCost)} cost)\nNet benefit over ${values.months} months, after investment: ${format(totalNet)}\nROI over ${values.months} months: ${format(roi)}%\n${payback}\n\nEstimate only; excludes discounting, taxes, and uncertainty.`;
}
