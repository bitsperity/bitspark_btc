# Idea Lab Implementation Structure

## Directory Structure

```
src/
├── components/
│   ├── IdeaLab/
│   │   ├── ModeSelector/
│   │   │   ├── ModeSelector.svelte
│   │   │   └── modeSelectorStore.js
│   │   │
│   │   ├── Selectors/
│   │   │   ├── IdeaSelector.svelte
│   │   │   ├── JobSelector.svelte
│   │   │   └── selectorStore.js
│   │   │
│   │   ├── Negotiation/
│   │   │   ├── NegotiationWidget.svelte
│   │   │   ├── OfferSelector.svelte
│   │   │   ├── OfferFilter.svelte
│   │   │   ├── NegotiationWindow.svelte
│   │   │   ├── NegotiationBubble.svelte
│   │   │   ├── InteractionBar.svelte
│   │   │   └── negotiationStore.js
│   │   │
│   │   ├── Contracts/
│   │   │   ├── ContractsWidget.svelte
│   │   │   ├── ContractTable.svelte
│   │   │   ├── ContractRow.svelte
│   │   │   ├── ContractInteractionBar.svelte
│   │   │   └── contractStore.js
│   │   │
│   │   ├── PullRequests/
│   │   │   ├── PullRequestWidget.svelte
│   │   │   ├── PullRequestTable.svelte
│   │   │   ├── PullRequestRow.svelte
│   │   │   ├── PullRequestInteractionBar.svelte
│   │   │   └── pullRequestStore.js
│   │   │
│   │   └── shared/
│   │       ├── InteractionBar.svelte
│   │       └── TableRow.svelte
│   │
│   └── shared/
│       └── ... (existing shared components)
│
├── backend/
│   ├── IdeaLabManager.js       # New manager for Idea Lab functionality
│   ├── NegotiationManager.js   # Handles negotiation events and state
│   ├── ContractManager.js      # Manages contract events and state
│   └── PullRequestManager.js   # Handles pull request events and state
│
├── stores/
│   └── idealab/
│       ├── modeStore.js        # Global Idea Lab mode state
│       ├── selectionStore.js   # Idea/Job selection state
│       ├── negotiationStore.js # Negotiation state management
│       ├── contractStore.js    # Contract state management
│       └── prStore.js         # Pull request state management
│
└── views/
    └── IdeaLabView.svelte     # Main Idea Lab view component
```

## Component Responsibilities

### Backend Managers

1. **IdeaLabManager.js**
   - Coordinates between different managers
   - Handles mode switching logic
   - Manages global Idea Lab state

2. **NegotiationManager.js**
   - Implements NIP-44 encryption for negotiations
   - Handles offer creation and updates
   - Manages negotiation events

3. **ContractManager.js**
   - Handles contract creation and updates
   - Manages contract state transitions
   - Implements contract-related NIPs

4. **PullRequestManager.js**
   - Manages pull request lifecycle
   - Handles code review events
   - Coordinates with contract state

### Stores

1. **modeStore.js**
   - Current Idea Lab mode
   - Mode transition logic
   - User preferences

2. **selectionStore.js**
   - Selected ideas/jobs
   - Filter states
   - Selection history

3. **negotiationStore.js**
   - Active negotiations
   - Offer states
   - Message history

4. **contractStore.js**
   - Active contracts
   - Contract states
   - Contract history

5. **prStore.js**
   - Active pull requests
   - PR states
   - Review history

### Key Components

1. **ModeSelector/**
   - Mode switching UI
   - Mode indicators
   - User preferences interface

2. **Selectors/**
   - Idea browsing interface
   - Job selection interface
   - Filter controls

3. **Negotiation/**
   - Offer management
   - Negotiation interface
   - Message exchange

4. **Contracts/**
   - Contract overview
   - Contract management
   - Status tracking

5. **PullRequests/**
   - PR overview
   - Review interface
   - Status tracking

## Implementation Notes

1. **Event Handling**
   - All components should follow Nostr event principles
   - Use proper event kinds from nostrKinds.js
   - Implement proper event signing and verification

2. **State Management**
   - Use Svelte stores for reactive state
   - Implement proper state synchronization
   - Handle offline/online scenarios

3. **Security**
   - Implement NIP-44 encryption for sensitive data
   - Use proper key management
   - Follow security best practices

4. **UI/UX**
   - Consistent interaction patterns
   - Responsive design
   - Clear status indicators

5. **Testing**
   - Unit tests for managers
   - Component tests
   - Integration tests for workflows 