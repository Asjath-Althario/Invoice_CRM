import React from 'react';

// A simple event bus using the browser's CustomEvent API
const eventBus = {
  on(event: string, callback: (data: any) => void) {
    const handler = (e: Event) => callback((e as CustomEvent).detail);
    document.addEventListener(event, handler);
    // Return a function to remove the listener
    return () => document.removeEventListener(event, handler);
  },
  emit(event: string, data?: any) {
    document.dispatchEvent(new CustomEvent(event, { detail: data }));
  },
};

export default eventBus;
