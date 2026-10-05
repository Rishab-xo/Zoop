interface Props {
  agentName: string
  onConfirm: () => Promise<void>
  onClose: () => void
  loading?: boolean
}

export function DeleteConfirmModal({ agentName, onConfirm, onClose, loading }: Props) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 420 }} role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
        <div className="modal-body" style={{ textAlign: 'center', paddingTop: 32 }}>
          <div className="confirm-icon" style={{ margin: '0 auto 16px' }}>⚠</div>
          <h2 id="delete-modal-title" className="modal-title" style={{ marginBottom: 12 }}>Delete Agent?</h2>
          <p className="confirm-message">
            You are about to permanently delete <strong>{agentName}</strong>.
            This action cannot be undone.
          </p>
        </div>
        <div className="modal-footer" style={{ justifyContent: 'center' }}>
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            id="delete-confirm-btn"
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? '…' : 'Delete Agent'}
          </button>
        </div>
      </div>
    </div>
  )
}
