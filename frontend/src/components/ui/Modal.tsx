import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "../../lib/utils.ts";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export default function Modal({ open, onClose, title, children, className }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30 z-40 animate-in fade-in" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
            "w-full max-w-md bg-white rounded-lg shadow-xl p-6",
            "focus:outline-none animate-in fade-in zoom-in-95",
            className
          )}
        >
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-base font-semibold text-text-primary">
              {title}
            </Dialog.Title>
            <Dialog.Close
              onClick={onClose}
              className="text-text-tertiary hover:text-text-primary transition-colors"
            >
              ✕
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
