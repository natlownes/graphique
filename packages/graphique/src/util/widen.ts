import { isDate } from "./dates"

export const widen = (
  data: unknown[],
  pivot: (d: unknown) => any,
  getGroup: (d: unknown) => any,
  count: (d: unknown) => any
) => {
  const pivots = Array.from(new Set(data.map(d => isDate(pivot(d)) ? pivot(d).valueOf() : pivot(d))))
  const groups = Array.from(new Set(data.map(getGroup)))
  return pivots.map((p, i) => {
    const out: any = { key: isDate(p) ? p.valueOf() : p, i }
    groups.forEach((g) => {
      const pivotGroup = data.find(
        d =>
          (isDate(pivot(d))
            ? pivot(d).valueOf() === p.valueOf() && getGroup(d) === g
            : pivot(d) === p && getGroup(d) === g)
      )
      if (pivotGroup) {
        out[g] = count(pivotGroup) ?? undefined
      }
    })
    return out
  })
}
