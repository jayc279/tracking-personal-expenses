function ModalActions({ visible, message, onConfirm, onCancel, children }) {
  if (!visible) return null
  return (
    <div className="modal-overlay">
      <div className="modal">
        <p>{message}</p>
        {children}
        <div className="modal-actions">
          <button className="modal-confirm" onClick={onConfirm}>Confirm</button>
          <button className="modal-cancel" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

export default ModalActions
