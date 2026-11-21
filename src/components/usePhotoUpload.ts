'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { preparePhoto } from '@/lib/client-image';

export function usePhotoUpload(onPhoto: (photo: string) => void, onError: (message: string) => void) {
  const selection = useRef(0);
  const [preparing, setPreparing] = useState(false);

  function cancelPreparation() {
    selection.current++;
    setPreparing(false);
  }

  function choosePhoto(photo: string) {
    cancelPreparation();
    onPhoto(photo);
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    const current = ++selection.current;
    setPreparing(true);
    try {
      const photo = await preparePhoto(file);
      if (current === selection.current) onPhoto(photo);
    } catch (error) {
      if (current === selection.current) {
        onError(error instanceof Error ? error.message : 'That photo could not be opened.');
      }
    } finally {
      if (current === selection.current) setPreparing(false);
    }
  }

  return { preparing, choosePhoto, handleFileChange, cancelPreparation };
}
