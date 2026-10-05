import { useState, useEffect } from 'react'
import type { Agent, CreateAgentInput } from '../api/agents'

interface FormValues {
  fullName: string
  phone: string
  email: string
  serviceArea: string
  status: 'ACTIVE' | 'INACTIVE'
}

interface FormErrors {
  fullName?: string
  phone?: string
  email?: string
  serviceArea?: string
}

interface Props {
  agent: Agent | null  // null = create mode
  onSave: (data: CreateAgentInput) => Promise<void>
  onClose: () => void
  loading?: boolean
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^\+?[1-9]\d{7,14}$/

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {}
  if (!values.fullName.trim() || values.fullName.trim().length < 2)
    errors.fullName = 'Full name must be at least 2 characters'
  if (!PHONE_RE.test(values.phone))
    errors.phone = 'Phone must be a valid international number (e.g. +911234567890)'
  if (!EMAIL_RE.test(values.email))
    errors.email = 'Email is invalid'
  if (!values.serviceArea.trim() || values.serviceArea.trim().length < 2)
    errors.serviceArea = 'Service area must be at least 2 characters'
  return errors
}

export function AgentFormModal({ agent, onSave, onClose, loading }: Props) {
  const isEdit = !!agent

  const [values, setValues] = useState<FormValues>({
    fullName: agent?.fullName ?? '',
    phone: agent?.phone ?? '',
    email: agent?.email ?? '',
    serviceArea: agent?.serviceArea ?? '',
    status: agent?.status ?? 'ACTIVE',
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (agent) {
      setValues({
        fullName: agent.fullName,
        phone: agent.phone,
        email: agent.email,
        serviceArea: agent.serviceArea,
        status: agent.status,
      })
    }
  }, [agent])

  function set(field: keyof FormValues, value: string) {
    setValues(prev => ({ ...prev, [field]: value }))
    if (touched[field]) {
      const errs = validate({ ...values, [field]: value })
      setErrors(prev => ({ ...prev, [field]: errs[field as keyof FormErrors] }))
    }
  }

  function blur(field: string) {
    setTouched(prev => ({ ...prev, [field]: true }))
    const errs = validate(values)
    setErrors(prev => ({ ...prev, [field]: errs[field as keyof FormErrors] }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const allTouched = Object.fromEntries(
      Object.keys(values).map(k => [k, true])
    )
    setTouched(allTouched)
    const errs = validate(values)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    await onSave(values)
  }

  const title = isEdit ? 'Edit Agent' : 'New Agent'

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="form-modal-title">
        <div className="modal-header">
          <h2 id="form-modal-title" className="modal-title">{title}</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body">
            <div className="form-grid">
              {/* Full Name */}
              <div className="form-group full">
                <label className="form-label" htmlFor="agent-fullName">Full Name *</label>
                <input
                  id="agent-fullName"
                  className={`form-input ${errors.fullName && touched.fullName ? 'input-error' : ''}`}
                  type="text"
                  placeholder="e.g. Arjun Sharma"
                  value={values.fullName}
                  onChange={e => set('fullName', e.target.value)}
                  onBlur={() => blur('fullName')}
                  autoFocus
                />
                {errors.fullName && touched.fullName && (
                  <span className="form-error">{errors.fullName}</span>
                )}
              </div>

              {/* Phone */}
              <div className="form-group">
                <label className="form-label" htmlFor="agent-phone">Phone *</label>
                <input
                  id="agent-phone"
                  className={`form-input ${errors.phone && touched.phone ? 'input-error' : ''}`}
                  type="tel"
                  placeholder="+911234567890"
                  value={values.phone}
                  onChange={e => set('phone', e.target.value)}
                  onBlur={() => blur('phone')}
                />
                {errors.phone && touched.phone && (
                  <span className="form-error">{errors.phone}</span>
                )}
              </div>

              {/* Email */}
              <div className="form-group">
                <label className="form-label" htmlFor="agent-email">Email *</label>
                <input
                  id="agent-email"
                  className={`form-input ${errors.email && touched.email ? 'input-error' : ''}`}
                  type="email"
                  placeholder="agent@example.com"
                  value={values.email}
                  onChange={e => set('email', e.target.value)}
                  onBlur={() => blur('email')}
                />
                {errors.email && touched.email && (
                  <span className="form-error">{errors.email}</span>
                )}
              </div>

              {/* Service Area */}
              <div className="form-group">
                <label className="form-label" htmlFor="agent-serviceArea">Service Area *</label>
                <input
                  id="agent-serviceArea"
                  className={`form-input ${errors.serviceArea && touched.serviceArea ? 'input-error' : ''}`}
                  type="text"
                  placeholder="e.g. Bengaluru North"
                  value={values.serviceArea}
                  onChange={e => set('serviceArea', e.target.value)}
                  onBlur={() => blur('serviceArea')}
                />
                {errors.serviceArea && touched.serviceArea && (
                  <span className="form-error">{errors.serviceArea}</span>
                )}
              </div>

              {/* Status */}
              <div className="form-group">
                <label className="form-label" htmlFor="agent-status">Status</label>
                <select
                  id="agent-status"
                  className="form-input form-select"
                  value={values.status}
                  onChange={e => set('status', e.target.value)}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" id="agent-form-submit" disabled={loading}>
              {loading ? '…' : isEdit ? '✓ Save Changes' : '+ Create Agent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
