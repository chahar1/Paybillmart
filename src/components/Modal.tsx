import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    subtitle?: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    maxWidth?: string;
}

export default function Modal({
    isOpen,
    onClose,
    title,
    subtitle,
    icon,
    children,
    maxWidth = 'max-w-xl'
}: ModalProps) {
    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-slate-900/90 animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div
                className={`bg-white rounded-[20px] shadow-[0_0_1px_rgba(0,0,0,0.1),0_20px_40px_rgba(0,0,0,0.1)] w-full ${maxWidth} max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300`}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between px-10 pt-10 pb-8 border-b border-slate-100">
                    <div className="flex items-center gap-5">
                        {icon && (
                            <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                                {React.cloneElement(icon as any, { size: 24, strokeWidth: 1.5 })}
                            </div>
                        )}
                        <div>
                            {subtitle && (
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1.5">
                                    {subtitle}
                                </p>
                            )}
                            {title && (
                                <h2 className="text-3xl font-bold text-slate-950 tracking-tight leading-none">
                                    {title}
                                </h2>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-all text-slate-400 hover:text-slate-950 active:scale-95 shrink-0 ml-6"
                    >
                        <X size={24} strokeWidth={1} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-10 py-10 overflow-y-auto scrollbar-none">
                    {children}
                </div>
            </div>
        </div>
    );
}
