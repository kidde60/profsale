import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
  maxHeight?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
  maxHeight = 'max-h-[85vh]',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 px-4 py-8">
      <div
        className={`relative my-4 w-full ${maxWidth} ${maxHeight} overflow-y-auto rounded-3xl border border-white/10 bg-white p-6 shadow-2xl shadow-slate-950/30 sm:p-8`}
      >
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-slate-950">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 transition hover:text-slate-600"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;
