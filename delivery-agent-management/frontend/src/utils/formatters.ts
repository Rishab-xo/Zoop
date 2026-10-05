/**
 * Utility functions for formatting values across the UI
 */

/**
 * Formats a phone number with country code: "+91 73783 03302".
 * Strips any redundant leading prefixes and splits into a clean 5-5 digit format.
 * Examples:
 *   "7378303302"    -> "+91 73783 03302"
 *   "+911234567899" -> "+91 12345 67899"
 *   "919876543210"  -> "+91 98765 43210"
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return ''
  let cleaned = phone.trim().replace(/[^\d+]/g, '')

  // Normalize leading country prefixes
  if (cleaned.startsWith('+91') && cleaned.length === 13) {
    cleaned = cleaned.slice(3)
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.slice(2)
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.slice(1)
  } else if (cleaned.startsWith('+') && cleaned.length > 10) {
    cleaned = cleaned.slice(1)
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      cleaned = cleaned.slice(2)
    }
  }

  // 10 digits: format as "+91 73783 03302"
  if (/^\d{10}$/.test(cleaned)) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`
  }

  return phone.trim()
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
