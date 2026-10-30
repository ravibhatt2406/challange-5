export type ToastType = 'success' | 'error' | 'info';

export interface ToastPayload {
  id: number;
  message: string;
  type: ToastType;
}

let toastIdCounter = 0;
export const toastListeners: Set<(toast: ToastPayload) => void> = new Set();

export function showToast(message: string, type: ToastType = 'info'): void {
  const toast: ToastPayload = { id: ++toastIdCounter, message, type };
  toastListeners.forEach((listener) => listener(toast));
}
