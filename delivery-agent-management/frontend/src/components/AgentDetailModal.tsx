import type { Agent } from '../api/agents'

interface Props {
  agent: Agent | null
  onClose: () => void
  onEdit: () => void
}

export function AgentDetailModal({ agent, onClose, onEdit }: Props) {
  if (!agent) return null

  const created = new Date(agent.createdAt).toLocaleString()
  const updated = new Date(agent.updatedAt).toLocaleString()

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="detail-modal-title">
        <div className="modal-header">
          <h2 id="detail-modal-title" className="modal-title">Agent Details</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="modal-body">
          {/* Avatar section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.3rem', fontWeight: 700, flexShrink: 0,
            }}>
              {agent.fullName[0]}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>{agent.fullName}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{agent.email}</div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <span className={`badge ${agent.status === 'ACTIVE' ? 'badge-active' : 'badge-inactive'}`}>
                {agent.status}
              </span>
            </div>
          </div>

          <div className="detail-grid">
            <div className="detail-item">
              <label>Phone</label>
              <div className="value">{agent.phone}</div>
            </div>
            <div className="detail-item">
              <label>Service Area</label>
              <div className="value">{agent.serviceArea}</div>
            </div>
            <div className="detail-item">
              <label>Created At</label>
              <div className="value" style={{ fontSize: '0.82rem' }}>{created}</div>
            </div>
            <div className="detail-item">
              <label>Last Updated</label>
              <div className="value" style={{ fontSize: '0.82rem' }}>{updated}</div>
            </div>
            <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
              <label>Agent ID</label>
              <div className="value" style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                {agent.id}
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
          <button className="btn btn-primary" onClick={onEdit} id="detail-edit-btn">
            ✎ Edit Agent
          </button>
        </div>
      </div>
    </div>
  )
}
