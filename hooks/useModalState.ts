import { useState, useCallback } from 'react';

export interface ModalState<T> {
  isOpen: boolean;
  editingItem: T | null;
  openModal: (item?: T | null) => void;
  closeModal: () => void;
}

export const useModalState = <T extends object>(): ModalState<T> => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);

  const openModal = useCallback((item?: T | null) => {
    setEditingItem(item || null);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    // Delay clearing item to prevent content flicker during closing animation
    setTimeout(() => setEditingItem(null), 300);
  }, []);

  return { isOpen, editingItem, openModal, closeModal };
};
