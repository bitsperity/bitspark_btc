import { writable } from 'svelte/store';

// Create writable store for current mode
export const currentJob = writable(null);

// Function to set current mode
export const setJob = (job) => {
    currentJob.set(job);
};

export const clearCurrentJob = () => {
    currentJob.set(null);
};
