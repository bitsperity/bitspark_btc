import { writable, derived } from 'svelte/store';

// Store for currently selected idea
export const currentIdea = writable(null);

// Derived store that contains just the ID of the selected idea
export const selectedIdeaIds = derived(currentIdea, $currentIdea => 
    $currentIdea ? [$currentIdea.id] : []
);

// Function to set current idea
export const setIdea = (idea) => {
    currentIdea.set(idea);
};

// Function to clear selection
export const clearSelectedIdea = () => {
    currentIdea.set(null);
};
