import { writable, derived } from 'svelte/store';

// Create writable store for current mode
export const currentIdea = writable(null);

// Function to set current mode
export const setIdea = (idea) => {
    currentIdea.set(idea);
};

export const selectedIdeas = writable([]);

// Derived store that only contains the IDs of selected ideas
export const selectedIdeaIds = derived(selectedIdeas, $selectedIdeas => 
    $selectedIdeas.map(idea => idea.id)
);

export function toggleIdea(idea) {
    selectedIdeas.update(current => {
        const exists = current.some(i => i.id === idea.id);
        if (exists) {
            return current.filter(i => i.id !== idea.id);
        } else {
            return [...current, idea];
        }
    });
}

export function clearSelectedIdeas() {
    selectedIdeas.set([]);
}
