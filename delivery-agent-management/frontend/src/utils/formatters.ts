/**
 * Utility functions for formatting values across the UI
 */

/**
 * Formats a raw phone number into a clean 10-digit format without +91 / 91 prefix.
 * Examples:
 *   "+911234567899" -> "12345 67899"
 *   "7989087190"    -> "79890 87190"
 *   "919876543210"  -> "98765 43210"
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return ''
  let trimmed = phone.trim()

  // Strip leading +91 or 91 if followed by 10 digits
  if (/^\+91\d{10}$/.test(trimmed)) {
    trimmed = trimmed.slice(3)
  } else if (/^91\d{10}$/.test(trimmed)) {
    trimmed = trimmed.slice(2)
  } else if (/^0\d{10}$/.test(trimmed)) {
    trimmed = trimmed.slice(1)
  }

  // 10 digits: format as clean 5-5 split (e.g. 79890 87190)
  if (/^\d{10}$/.test(trimmed)) {
    return `${trimmed.slice(0, 5)} ${trimmed.slice(5)}`
  }

  return trimmed
}

/**
 * Formats dates into a clean readable string
 */
export function formatDate(dateString: string): string {
  if (!dateString) return ''
  try {
    const d = new Date(dateString)
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateString
  }
}

/**
 * Formats datetime with time
 */
export function formatDateTime(dateString: string): string {
  if (!dateString) return ''
  try {
    const d = new Date(dateString)
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateString
  }
}
