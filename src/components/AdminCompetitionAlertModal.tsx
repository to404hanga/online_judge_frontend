type AdminCompetitionAlertModalProps = {
  open: boolean
  title: string
  message: string
  onClose: () => void
}

export default function AdminCompetitionAlertModal(
  props: AdminCompetitionAlertModalProps,
) {
  const { open, title, message, onClose } = props

  if (!open) return null

  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal">
        <div className="admin-modal-title">{title || '提示'}</div>
        <div className="admin-modal-message">{message}</div>
        <div className="admin-modal-actions">
          <button
            type="button"
            className="admin-modal-primary-btn"
            onClick={onClose}
          >
            知道了
          </button>
        </div>
      </div>
    </div>
  )
}
