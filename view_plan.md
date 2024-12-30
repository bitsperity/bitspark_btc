# BitSpark Job Management Views

## Core Principles

### Negotiation Flow
1. Developer (Dev) initiates with initial offer
2. Idea Owner (IO) can:
   - Decline (ends process)
   - Create counter offer
3. Developer can:
   - Accept (creates approval event)
   - Decline (creates approval event)
   - Create counter offer
4. When Dev accepts IO's counter offer:
   - IO gets option to create contract
   - Process completes

Key Rules:
- IO can NEVER accept, only decline or counter
- Dev can ALWAYS accept, decline, or counter
- Only IO can create contract after Dev approval
- All offers are private/encrypted
- Jobs, contracts, PRs, reviews are public

## UI Design Philosophy

### 1. Thread-Based Design
- Each negotiation is a distinct thread
- Clear visual separation between threads
- Collapsible threads for better overview
- Quick-action buttons on thread level

### 2. Timeline View
- Vertical timeline for each thread
- Clear indication of current actor (IO/Dev)
- Visual status indicators (pending, approved, declined)
- Compact message preview with expandable details

### 3. Action Hierarchy
Primary Actions (prominent):
- Dev: Accept Offer
- IO: Create Counter Offer
- Dev: Create Counter Offer

Secondary Actions (less prominent):
- Decline Offer
- View Details
- Collapse Thread

### 4. Visual Design
- Clean, minimal interface
- White cards on subtle background
- Clear typography hierarchy
- Status-based color coding:
  - Blue: Active/Pending
  - Green: Approved
  - Red: Declined
  - Purple: Contract Created

### 5. Interaction Design
- One-click access to primary actions
- Swipe gestures on mobile
- Hover previews on desktop
- Infinite scroll for history
- Real-time updates

### 6. Layout Structure
```
+------------------------+
|     Thread Overview    |
+------------------------+
| Thread 1 [Collapsed]   |
+------------------------+
| Thread 2               |
| ├─ Initial Offer      |
| ├─ Counter Offer      |
| └─ Current Status     |
|    [Action Buttons]   |
+------------------------+
| Thread 3 [Collapsed]   |
+------------------------+
```

## Component Updates

### OfferThread.svelte (New)
- Replaces current OfferTimeline
- Manages single negotiation thread
- Handles thread-specific actions
- Shows thread status overview

### ThreadList.svelte (New)
- Manages multiple OfferThreads
- Handles sorting and filtering
- Provides thread-level actions
- Implements infinite scroll

### ActionPanel.svelte (New)
- Context-aware action buttons
- Role-based action display (IO/Dev)
- Status-based availability
- Clear action hierarchy

## State Management

### Thread State
```typescript
interface ThreadState {
  id: string
  initialOffer: Offer
  counterOffers: Offer[]
  currentActor: 'io' | 'dev'
  status: 'pending' | 'declined' | 'approved' | 'contracted'
  canCreateContract: boolean
}
```

### Action Permissions
```typescript
const actionMatrix = {
  io: {
    canAccept: false,
    canDecline: true,
    canCounter: true,
    canCreateContract: (thread) => thread.status === 'approved'
  },
  dev: {
    canAccept: true,
    canDecline: true,
    canCounter: true,
    canCreateContract: false
  }
}
```
