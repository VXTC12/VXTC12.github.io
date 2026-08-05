const ONE_DAY = 24 * 60 * 60 * 1000

export function parseDate(value) {
  if (!value) return null
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

export function startOfToday() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

export function formatDate(value) {
  const date = parseDate(value)
  if (!date) return '日期待补充'
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

export function daysTogether(startDate) {
  const start = parseDate(startDate)
  if (!start) return 0
  return Math.max(0, Math.floor((startOfToday() - start) / ONE_DAY) + 1)
}

export function nextOccurrence(dateValue, repeatYearly = false) {
  const original = parseDate(dateValue)
  if (!original) return null
  const today = startOfToday()

  if (!repeatYearly) return original

  let next = new Date(today.getFullYear(), original.getMonth(), original.getDate())
  if (next < today) {
    next = new Date(today.getFullYear() + 1, original.getMonth(), original.getDate())
  }
  return next
}

export function daysUntil(dateValue, repeatYearly = false) {
  const target = nextOccurrence(dateValue, repeatYearly)
  if (!target) return null
  return Math.ceil((target - startOfToday()) / ONE_DAY)
}

export function getNextAnniversary(items) {
  return items
    .map((item) => ({ ...item, days: daysUntil(item.date, item.repeatYearly) }))
    .filter((item) => item.days !== null && item.days >= 0)
    .sort((a, b) => a.days - b.days)[0]
}

export function countdownLabel(days) {
  if (days === null) return '日期待补充'
  if (days < 0) return '已经到来'
  if (days === 0) return '就是今天'
  return `还有 ${days} 天`
}

export function todayInputValue() {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60 * 1000
  return new Date(now - offset).toISOString().slice(0, 10)
}
