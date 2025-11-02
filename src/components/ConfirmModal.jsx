export default function ConfirmModal({
  open,
  title = "Підтвердження",
  message = "",
  confirmText = "Підтвердити",
  cancelText = "Скасувати",
  onCancel,
  onConfirm,
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-sm mx-4 bg-gray-900 border border-gray-700 rounded-xl p-6 shadow-2xl">
        <h3 className="text-lg font-semibold text-green-400 mb-2">{title}</h3>
        <p className="text-gray-300 mb-5">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 rounded bg-gray-700 text-gray-200 hover:bg-gray-600"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

