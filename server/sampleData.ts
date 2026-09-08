// Realistic synthetic dataset generator for Statistical Analytics Studio
// Generates 1,000 realistic observations for Sales Performance Analysis

export interface SampleDataRow {
  sales: number;             // in $1,000s
  advertising: number;       // marketing spend in $1,000s
  price: number;             // unit retail price ($)
  discount: number;          // promotional discount percentage (0 - 35%)
  customers: number;         // customer store visits / footfall
  profit: number;            // net profit in $1,000s
  store_type: string;        // 'Urban Flagship', 'Suburban Mall', 'Express Outlet', 'Online Direct'
  region: string;            // 'North', 'South', 'East', 'West'
  satisfaction_score: number;// customer rating 1.0 - 10.0
  is_weekend: number;        // 0 = Weekday, 1 = Weekend
}

function randNormal(mean: number, std: number): number {
  const u1 = Math.max(1e-7, Math.random());
  const u2 = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + z * std;
}

export function generateSampleDataset(count: number = 1000): SampleDataRow[] {
  const storeTypes = ['Urban Flagship', 'Suburban Mall', 'Express Outlet', 'Online Direct'];
  const regions = ['North', 'South', 'East', 'West'];

  const rows: SampleDataRow[] = [];

  for (let i = 0; i < count; i++) {
    // Predictors
    const advertising = Math.max(2.0, randNormal(45.0, 18.0)); // $2k to ~$90k
    const price = Math.max(15.0, randNormal(65.0, 12.0));      // $15 to $110
    const discount = Math.max(0, Math.min(35, randNormal(12.0, 7.0))); // 0% to 35%
    const is_weekend = Math.random() < 0.28 ? 1 : 0;
    const store_type = storeTypes[Math.floor(Math.random() * storeTypes.length)];
    const region = regions[Math.floor(Math.random() * regions.length)];

    // Store type modifier
    let storeBonus = 0;
    if (store_type === 'Urban Flagship') storeBonus = 25;
    else if (store_type === 'Online Direct') storeBonus = 15;
    else if (store_type === 'Suburban Mall') storeBonus = 5;

    // Base customers footfall
    const customers = Math.round(
      Math.max(120, 450 + 6.2 * advertising - 1.8 * price + 4.5 * discount + (is_weekend ? 140 : 0) + storeBonus * 4 + randNormal(0, 45))
    );

    // Sales formula: realistic regression relationship
    // Sales = 120 + 2.85 * advertising - 1.45 * price + 1.20 * discount + 0.15 * customers + noise
    const noiseSales = randNormal(0, 14.5);
    const rawSales = 85.0 + (2.75 * advertising) - (1.15 * price) + (0.95 * discount) + (0.12 * customers) + (is_weekend ? 18.0 : 0) + storeBonus + noiseSales;
    const sales = Math.max(10.0, Number(rawSales.toFixed(2)));

    // Satisfaction score
    const satNoise = randNormal(0, 0.6);
    const rawSat = 7.2 - (0.015 * price) + (0.04 * discount) + satNoise;
    const satisfaction_score = Math.max(1.0, Math.min(10.0, Number(rawSat.toFixed(1))));

    // Profit formula:
    // Net profit margins taking discount, unit price, and advertising into account
    const margin = Math.max(0.12, 0.42 - (discount / 100) * 0.35);
    const grossProfit = sales * margin;
    const rawProfit = grossProfit - (advertising * 0.28) + randNormal(0, 3.8);
    const profit = Number(rawProfit.toFixed(2));

    rows.push({
      sales,
      advertising: Number(advertising.toFixed(2)),
      price: Number(price.toFixed(2)),
      discount: Number(discount.toFixed(1)),
      customers,
      profit,
      store_type,
      region,
      satisfaction_score,
      is_weekend
    });
  }

  return rows;
}
