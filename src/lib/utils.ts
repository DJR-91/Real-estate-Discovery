
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const audioContext = (options?: {
  id: string;
  config?: AudioContextOptions;
}) => {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("AudioContext is not available in SSR."));
  }
  const id = options?.id ?? 'default';
  const config = options?.config;
  const AudioContext = window.AudioContext;
  return new Promise<AudioContext>(resolve =>
    setTimeout(() => {
      resolve(new AudioContext(config));
    }, 0),
  );
};

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}
