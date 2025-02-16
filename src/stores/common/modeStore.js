import { writable } from 'svelte/store';

// Create writable store for current mode
export const currentMode = writable(null);

// Function to set current mode
export const setMode = (mode) => {
    currentMode.set(mode);
};
