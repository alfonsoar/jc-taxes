import type { ParcelProperties } from './types'

// "Built since" filter (`bs=21`, lot / unit views): parcels with
// `yr_built >= N` stay lit, the rest dim (a third focus term, with portfolio
// and region). Unknown year built is not a member.
//
// Assessed values (`av` taxable, `av_x` exempt / PILOT) are fixed properties
// from the latest MOD-IV file (`src/jc_taxes/assessed.py`); file-year Y holds
// tax-year Y assessments.
export const ASSESSED_YEAR = 2026
export const BUILT_SINCE_MIN = 2000

export const builtSinceTest = (since: number) =>
  (p: ParcelProperties | null | undefined): boolean => (p?.yr_built ?? 0) >= since

export interface BuiltSinceStats {
  /** Lit parcels: built since N, and in the portfolio / region focus if any. */
  count: number
  /** Their amount (paid, or billed for billed-basis years). */
  amount: number
  /** Taxable / exempt + PILOT net assessed value. */
  av: number
  avExempt: number
  /** Citywide (every feature shown this year), for shares. */
  amountAll: number
  avAll: number
  /** In the other focus terms but with no known year built (excluded). */
  unknown: number
  unknownAv: number
}

export function builtSinceStats(
  features: { properties: ParcelProperties }[],
  since: number,
  amountOf: (p: ParcelProperties) => number,
  /** Portfolio ∧ region test, if any (the other focus terms). */
  otherFocus: ((p: ParcelProperties) => boolean) | null,
): BuiltSinceStats {
  const s: BuiltSinceStats = { count: 0, amount: 0, av: 0, avExempt: 0, amountAll: 0, avAll: 0, unknown: 0, unknownAv: 0 }
  for (const { properties: p } of features) {
    const amount = amountOf(p), av = p.av ?? 0
    s.amountAll += amount
    s.avAll += av
    if (otherFocus && !otherFocus(p)) continue
    if (!p.yr_built) { s.unknown++; s.unknownAv += av; continue }
    if (p.yr_built < since) continue
    s.count++
    s.amount += amount
    s.av += av
    s.avExempt += p.av_x ?? 0
  }
  return s
}

export const pct = (part: number, whole: number) => {
  if (!(whole > 0)) return '–'
  const v = part / whole * 100
  return `${v < 10 ? v.toFixed(1) : v.toFixed(0)}%`
}
