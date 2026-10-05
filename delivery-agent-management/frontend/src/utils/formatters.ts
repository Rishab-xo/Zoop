/**
 * Utility functions for formatting values across the UI
 */

/**
 * Formats a raw phone number into a clean, human-readable format.
 * Examples:
 *   "+911234567899" -> "+91 12345 67899"
 *   "7989087190"    -> "+91 79890 87190"
 *   "+11234567890"  -> "+1 (123) 456-7890"
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return ''
  const trimmed = phone.trim()

  // Standard Indian with country code: +91XXXXXXXXXX
  if (/^\+91\d{10}$/.test(trimmed)) {
    return `+91 ${trimmed.slice(3, 8)} ${trimmed.slice(8)}`
  }

  // 10-digit Indian number without country code
  if (/^\d{10}$/.test(trimmed)) {
    return `+91 ${trimmed.slice(0, 5)} ${trimmed.slice(5)}`
  }

  // 11-digit starting with 0
  if (/^0\d{10}$/.test(trimmed)) {
    return `+91 ${trimmed.slice(1, 6)} ${trimmed.slice(6)}`
  }

  // North America: +1XXXXXXXXXX
  if (/^\+1\d{10}$/.test(trimmed)) {
    return `+1 (${trimmed.slice(2, 5)}) ${trimmed.slice(5, 8)}-${trimmed.slice(8)}`
  }

  // Generic international with 10-12 digits
  const genericMatch = trimmed.match(/^(\+\d{1,3})(\d{3,5})(\d{4,5})$/)
  if (genericMatch) {
    return `${genericMatch[1]} ${genericMatch[2]} ${genericMatch[3]}`
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
