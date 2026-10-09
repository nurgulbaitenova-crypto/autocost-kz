export type CarCosts = {
  make: string; year: number; price: number; mileage: number; consumption: number; fuelPrice: number; monthlyKm: number
  loan: number; insurance: number; service: number; tires: number; tax: number; parking: number; other: number
  period: 1 | 3 | 5; includeDepreciation: boolean; residual: number
}

export const defaultCar: CarCosts = {
  make: '', year: 2022, price: 12_500_000, mileage: 45_000, consumption: 8.5, fuelPrice: 265, monthlyKm: 1_500,
  loan: 0, insurance: 90_000, service: 180_000, tires: 70_000, tax: 35_000, parking: 18_000, other: 10_000,
  period: 3, includeDepreciation: false, residual: 7_500_000,
}

export type Expense = { name: string; value: number; color: string }
export type Calculation = {
  months: number; distance: number; fuel: number; loan: number; insurance: number; service: number; tires: number; tax: number
  parking: number; other: number; depreciation: number; cashTotal: number; economicTotal: number; monthly: number; annual: number
  perKm: number | null; categories: Expense[]
}

export function calculateCar(car: CarCosts): Calculation {
  const months = car.period * 12
  const fuelMonthly = car.monthlyKm * car.consumption / 100 * car.fuelPrice
  const annual = (value: number) => value * months / 12
  const fuel = fuelMonthly * months
  const loan = car.loan * months
  const insurance = annual(car.insurance)
  const service = annual(car.service)
  const tires = annual(car.tires)
  const tax = annual(car.tax)
  const parking = car.parking * months
  const other = car.other * months
  const depreciation = car.includeDepreciation ? Math.max(0, car.price - car.residual) : 0
  const cashTotal = fuel + loan + insurance + service + tires + tax + parking + other
  const economicTotal = cashTotal + depreciation
  const distance = car.monthlyKm * months
  const categories = [
    { name: 'Топливо', value: fuel, color: '#66d8ff' }, { name: 'Кредит', value: loan, color: '#a88bff' },
    { name: 'Обслуживание', value: service, color: '#6ee7b7' }, { name: 'Страховка', value: insurance, color: '#ffbf69' },
    { name: 'Шины', value: tires, color: '#ff7b8b' }, { name: 'Налог', value: tax, color: '#e4d56b' },
    { name: 'Парковка', value: parking, color: '#8a9bff' }, { name: 'Прочее', value: other, color: '#aab2c3' },
    ...(depreciation > 0 ? [{ name: 'Амортизация', value: depreciation, color: '#d38bff' }] : []),
  ]
  return { months, distance, fuel, loan, insurance, service, tires, tax, parking, other, depreciation, cashTotal, economicTotal, monthly: economicTotal / months, annual: economicTotal / car.period, perKm: distance > 0 ? economicTotal / distance : null, categories }
}

export type CompareCar = { name: string; consumption: number; fuelPrice: number; monthlyKm: number; loan: number; insurance: number; service: number; tires: number; tax: number; parking: number; other: number }
export const defaultCompareA: CompareCar = { name: 'Toyota Camry', consumption: 9.2, fuelPrice: 265, monthlyKm: 1500, loan: 0, insurance: 90000, service: 180000, tires: 70000, tax: 35000, parking: 18000, other: 10000 }
export const defaultCompareB: CompareCar = { name: 'Hyundai Tucson', consumption: 10.1, fuelPrice: 265, monthlyKm: 1500, loan: 0, insurance: 95000, service: 210000, tires: 80000, tax: 40000, parking: 18000, other: 10000 }

export function compareCar(car: CompareCar) {
  const fuel = car.monthlyKm * car.consumption / 100 * car.fuelPrice
  const annual = fuel * 12 + car.loan * 12 + car.insurance + car.service + car.tires + car.tax + (car.parking + car.other) * 12
  return { annual, threeYears: annual * 3, perKm: car.monthlyKm > 0 ? annual / (car.monthlyKm * 12) : null, fuelAnnual: fuel * 12, service: car.service + car.tires, loanAnnual: car.loan * 12 }
}

export function formatMoney(value: number, decimals = 0) {
  return `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: decimals, minimumFractionDigits: decimals }).format(value)} ₸`
}

