import { AlertTriangle, X } from 'lucide-react';

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Delete", 
  cancelText = "Cancel",
  type = "danger" 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
      <div className="bg-zinc-900 rounded-3xl border border-zinc-700 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-500/10 rounded-2xl flex items-center justify-center">
              <AlertTriangle className="text-red-500" size={22} />
            </div>
            <h3 className="text-xl font-semibold text-white">{title}</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-zinc-400 text-[15px] leading-relaxed">
            {message}
          </p>
          <p className="text-red-400 text-sm mt-4 font-medium">
            This action cannot be undone.
          </p>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-5 border-t border-zinc-800 bg-zinc-950">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 bg-zinc-800 hover:bg-zinc-700 rounded-2xl font-medium transition"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3.5 bg-red-600 hover:bg-red-500 rounded-2xl font-semibold transition"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;