import { writable } from 'svelte/store';

// Store for the currently selected offer
export const selectedOffer = writable(null);

// Store for the current negotiation chain
export const currentNegotiationChain = writable([]);

// Store for all initial offers
export const initialOffers = writable([]);

// Store for loading state
export const isLoading = writable(false);

// Function to clear selected offer
export const clearSelectedOffer = () => {
    selectedOffer.set(null);
};

// Function to clear initial offers
export const clearInitialOffers = () => {
    initialOffers.set([]);
};
