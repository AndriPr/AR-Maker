import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface RenameDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  initialValue: string;
  onConfirm: (newName: string) => void;
}

export function RenameDialog({ isOpen, onOpenChange, title, initialValue, onConfirm }: RenameDialogProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (isOpen) {
      setValue(initialValue);
    }
  }, [isOpen, initialValue]);

  const handleConfirm = () => {
    if (value.trim()) {
      onConfirm(value.trim());
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <input
            autoFocus
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleConfirm();
            }}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pln-blue/20"
            placeholder="Masukkan nama..."
          />
        </div>
        <DialogFooter className="mt-2 gap-2 sm:gap-0">
          <button 
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
          >
            Batal
          </button>
          <button 
            onClick={handleConfirm}
            disabled={!value.trim() || value.trim() === initialValue}
            className="px-4 py-2 bg-pln-blue text-white rounded-lg hover:bg-pln-blue-dark transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Simpan
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
