import Modal from "./Modal";

export default function ConfirmDialog({
  title = "Confirm",
  message,
  onConfirm,
  onCancel,
  confirmLabel = "Delete",
  confirmClass = "btn-danger",
}) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className={`btn ${confirmClass}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </>
      }>
      <p>{message}</p>
    </Modal>
  );
}
