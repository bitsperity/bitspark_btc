# BitSpark V2 Meta Implementation Plan

> **Purpose**: Phased roadmap for complete V2 rewrite based on V1 specification.
> Each phase builds on the previous. Detailed phase plans will be created separately.

---

## Technology Stack (V2)

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Framework** | SvelteKit + `adapter-static` | 100% client-side, modern, routing built-in |
| **Language** | TypeScript | Type safety, better DX |
| **Nostr** | NDK (`@nostr-dev-kit/ndk` + `@nostr-dev-kit/svelte`) | Industry standard, handles NIPs, Svelte 5 native |
| **Styling** | Tailwind CSS | Rapid UI development |
| **State** | NDK reactive stores + Svelte 5 runes | Simplified state management |
| **Testing** | Vitest + Playwright | Unit + E2E testing |
| **Build** | Vite (via SvelteKit) | Fast builds, HMR |

---

## Phase Overview

```
Phase 0: Project Setup & Infrastructure     [~2 days]
    ↓
Phase 1: Authentication & Profiles          [~3 days]
    ↓
Phase 2: Idea Management                    [~4 days]
    ↓
Phase 3: Job System                         [~5 days]
    ↓
Phase 4: Application/Offer System           [~6 days]  ← Most Complex
    ↓
Phase 5: Contract & PR Workflow             [~4 days]
    ↓
Phase 6: Social Features                    [~3 days]
    ↓
Phase 7: Payments & Zaps                    [~3 days]
    ↓
Phase 8: Direct Messaging                   [~3 days]
    ↓
Phase 9: Polish & Launch Prep               [~3 days]
```

**Total Estimated Time**: ~36 days (solo developer, full-time)

---

## Phase 0: Project Setup & Infrastructure

### Objective
Create the foundational project structure with all tooling configured.

### Deliverables
- [ ] SvelteKit project with `adapter-static`
- [ ] TypeScript configuration
- [ ] NDK integration with Svelte 5
- [ ] Tailwind CSS setup
- [ ] Base layout (Sidebar, Header, Footer)
- [ ] Routing structure
- [ ] Development environment (Vite, HMR)
- [ ] Testing setup (Vitest, Playwright)

### Key Files to Create
```
bitspark-v2/
├── src/
│   ├── lib/
│   │   ├── ndk/           # NDK setup and stores
│   │   ├── components/    # Shared components
│   │   └── types/         # TypeScript types
│   ├── routes/
│   │   ├── +layout.svelte
│   │   ├── +page.svelte   # Home
│   │   └── ...
│   └── app.css            # Tailwind
├── static/
├── svelte.config.js
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

### Success Criteria
- `npm run dev` starts development server
- `npm run build` creates static output
- NDK connects to relays
- Basic layout renders

### Dependencies
None (starting point)

---

## Phase 1: Authentication & Profiles

### Objective
Implement user authentication and profile management.

### Features from V1 Spec
- NIP-07 Login (browser extension)
- Profile viewing and editing
- GitHub identity verification
- Relay management (NIP-65)

### Deliverables
- [ ] Login/logout with NIP-07
- [ ] Current user state management
- [ ] Profile page (`/profile/[npub]`)
- [ ] Edit profile page (`/profile/edit`)
- [ ] GitHub verification flow
- [ ] Relay configuration UI

### Event Kinds Implemented
- Kind 0 (Profile metadata)
- Kind 10002 (Relay list)

### Key Components
- `LoginButton.svelte`
- `ProfileCard.svelte`
- `ProfileForm.svelte`
- `RelayManager.svelte`
- `GitHubVerification.svelte`

### Success Criteria
- User can login with Alby/nos2x
- Profile displays correctly
- Profile edits persist to relays
- GitHub verification works

### Dependencies
- Phase 0 complete

---

## Phase 2: Idea Management

### Objective
Implement the Idea entity - creation, viewing, and listing.

### Features from V1 Spec
- Create Idea (full form)
- View Ideas (browse, filter by category)
- Idea Detail page
- My Ideas dashboard

### Deliverables
- [ ] Idea creation form (`/ideas/create`)
- [ ] Idea listing page (`/ideas`)
- [ ] Idea detail page (`/ideas/[id]`)
- [ ] My Ideas page (`/dashboard/ideas`)
- [ ] Category filtering
- [ ] IdeaCard component
- [ ] IdeaBanner component

### Event Kinds Implemented
- Kind 1341 (IDEA)

### Event Schema
```typescript
interface IdeaEvent {
  kind: 1341;
  content: string; // description
  tags: [
    ["iName", string],
    ["iSub", string],
    ["ibUrl", string],
    ["gitrepo", string],
    ["lnadress", string],
    ["abstract", string],
    ["c", string], // categories (multiple)
    ["s", "bitspark"]
  ];
}
```

### Key Pages
- `/ideas` - Browse all ideas
- `/ideas/create` - Create new idea
- `/ideas/[id]` - Idea detail
- `/dashboard/ideas` - My ideas

### Success Criteria
- Ideas can be created and published
- Ideas appear in browse listing
- Idea detail shows all information
- Category filtering works

### Dependencies
- Phase 1 complete (need auth for creation)

---

## Phase 3: Job System

### Objective
Implement Jobs within Ideas - creation, approval flow, and viewing.

### Features from V1 Spec
- Create Job (linked to Idea)
- Job approval flow (IO must approve)
- Job statuses (pending → approved → signed)
- View Job detail
- Job Explorer (browse approved jobs)
- My Jobs dashboard

### Deliverables
- [ ] Job creation form (within Idea)
- [ ] Job listing within Idea page
- [ ] Job detail page (`/jobs/[id]`)
- [ ] Job Explorer page (`/jobs`)
- [ ] Job approval UI (for IO)
- [ ] Job status display
- [ ] My Jobs dashboard

### Event Kinds Implemented
- Kind 2542 (JOB)
- Kind 2544 (APPROVAL) - partial, for job approval

### Event Schema
```typescript
interface JobEvent {
  kind: 2542;
  content: string; // abstract
  tags: [
    ["name", string],
    ["requirements", string],
    ["image", string],
    ["page", string], // HTML content
    ["l", string], // languages (multiple)
    ["c", string], // categories (multiple)
    ["e", string], // idea ID
    ["e", string]?, // previous job ID (optional)
    ["p", string]?, // contributors (optional, multiple)
    ["thoughts", string]?,
    ["s", "bitspark"]
  ];
}
```

### Key Pages
- `/jobs` - Job Explorer
- `/jobs/[id]` - Job detail
- `/ideas/[id]` - Shows jobs within idea
- `/dashboard/jobs` - My jobs (as creator or involved)

### Success Criteria
- Jobs can be created within Ideas
- Only IO can approve jobs
- Approved jobs appear in Job Explorer
- Job detail shows all information

### Dependencies
- Phase 2 complete (Jobs belong to Ideas)

---

## Phase 4: Application/Offer System ⚠️ Complex

### Objective
Implement the encrypted offer negotiation system.

### Features from V1 Spec
- Submit encrypted application (bid, duration, terms)
- Offer chains (counter-offers)
- Offer status tracking
- View applications (for IO)
- My applications (for Developer)

### Deliverables
- [ ] Application form modal
- [ ] Encrypted offer creation (NIP-17/44/59)
- [ ] Offer decryption and display
- [ ] Counter-offer UI
- [ ] Offer chain visualization
- [ ] Accept/decline UI
- [ ] Application listing for IO
- [ ] My applications for Developer

### Event Kinds Implemented
- Kind 2543 (OFFER) - encrypted via Gift Wrap
- Kind 2544 (APPROVAL) - for offer accept/decline
- Kind 1059 (GIFT_WRAP)

### Encryption Flow
```
1. Create OFFER event with bid, duration, terms
2. Encrypt with NIP-44 for recipient
3. Wrap with NIP-59 Gift Wrap
4. Publish Kind 1059
5. Recipient decrypts and processes
```

### NDK Integration
```typescript
// NDK handles encryption automatically
import { NDKPrivateMessage } from '@nostr-dev-kit/ndk';

// Send encrypted offer
const offer = new NDKEvent(ndk);
offer.kind = 2543;
offer.content = offerMessage;
offer.tags = [...];
await offer.encrypt(recipientUser);
await offer.publish();
```

### Key Components
- `ApplicationModal.svelte`
- `OfferCard.svelte`
- `OfferChain.svelte`
- `CounterOfferForm.svelte`
- `OfferStatusBadge.svelte`

### Success Criteria
- Offers are encrypted (not readable by third parties)
- IO can view/decrypt offers on their jobs
- Counter-offers create proper chains
- Accept/decline updates status correctly

### Dependencies
- Phase 3 complete (Offers reference Jobs)

---

## Phase 5: Contract & PR Workflow

### Objective
Implement contract finalization and pull request submission.

### Features from V1 Spec
- Create contract (after offer acceptance)
- Submit PR with GitHub link
- PR review (approve/decline)
- Review with rating

### Deliverables
- [ ] Contract creation (automatic or explicit)
- [ ] Contract display
- [ ] PR submission form
- [ ] PR listing within job
- [ ] PR review UI
- [ ] Review/rating system

### Event Kinds Implemented
- Kind 2545 (CONTRACT)
- Kind 2546 (PULL_REQUEST)
- Kind 2547 (REVIEW)

### Key Pages/Components
- Contract display within job detail
- `PRSubmitForm.svelte`
- `PRCard.svelte`
- `PRReviewForm.svelte`
- `ReviewStars.svelte`

### Success Criteria
- Contracts are created after offer acceptance
- PRs can be submitted with GitHub links
- IO can approve/decline PRs
- Reviews are displayed on profiles

### Dependencies
- Phase 4 complete (Contracts follow accepted Offers)

---

## Phase 6: Social Features

### Objective
Implement community interaction features.

### Features from V1 Spec
- Follow/unfollow users
- Follow status checking
- Likes on events
- Comments on events
- Feed (followed users' content)

### Deliverables
- [ ] Follow button component
- [ ] Follow list management
- [ ] Like button with count
- [ ] Comment widget
- [ ] Comment form
- [ ] Feed page (`/feed`)
- [ ] Following/followers display on profile

### Event Kinds Used
- Kind 3 (Follows)
- Kind 7 (Reactions/Likes)
- Kind 1 (Comments with `["s", "bitspark"]`)

### Key Components
- `FollowButton.svelte`
- `LikeButton.svelte`
- `CommentWidget.svelte`
- `CommentForm.svelte`
- `FeedItem.svelte`

### Success Criteria
- Follow/unfollow persists and syncs
- Likes count correctly (unique per user)
- Comments display in thread
- Feed shows followed users' content

### Dependencies
- Phase 1 complete (uses profile system)
- Phase 2 complete (can comment on Ideas)

---

## Phase 7: Payments & Zaps

### Objective
Implement Lightning payment integration.

### Features from V1 Spec
- Zaps on any event (NIP-57)
- Zap counting and display
- Payment on PR approval

### Deliverables
- [ ] Zap button component
- [ ] Zap amount selection
- [ ] Zap counter display
- [ ] Invoice generation (via NDK/NWC)
- [ ] Payment confirmation
- [ ] Payment history

### Event Kinds Used
- Kind 9735 (Zaps)

### NDK Wallet Integration
```typescript
import { NDKWallet } from '@nostr-dev-kit/wallet';

// Setup NWC or WebLN
const wallet = new NDKWallet(ndk);
await wallet.init();

// Zap an event
await wallet.zap(event, 1000); // 1000 sats
```

### Key Components
- `ZapButton.svelte`
- `ZapWidget.svelte`
- `ZapAmountSelector.svelte`
- `PaymentModal.svelte`

### Success Criteria
- Zaps work via WebLN or NWC
- Zap counts update correctly
- Payment flow on PR approval works

### Dependencies
- Phase 5 complete (payment triggered by PR approval)

---

## Phase 8: Direct Messaging

### Objective
Implement encrypted private messaging.

### Features from V1 Spec
- Encrypted DMs (NIP-17)
- Chat rooms by participants
- Subject lines
- Real-time updates

### Deliverables
- [ ] DM page (`/messages`)
- [ ] Conversation list
- [ ] Message thread view
- [ ] Message composition
- [ ] Real-time message subscription
- [ ] DM button on profiles

### Event Kinds Used
- Kind 14 (Sealed DMs)
- Kind 1059 (Gift Wrap)

### NDK Messages Integration
```typescript
import { NDKPrivateConversation } from '@nostr-dev-kit/messages';

const convo = new NDKPrivateConversation(ndk, recipientPubkey);
await convo.send("Hello!");

// Subscribe to incoming
ndk.subscribe({ kinds: [1059], "#p": [myPubkey] });
```

### Key Components
- `ConversationList.svelte`
- `MessageThread.svelte`
- `MessageInput.svelte`
- `DMButton.svelte`

### Success Criteria
- Messages are encrypted end-to-end
- Conversations group correctly
- Real-time updates work
- Message history persists

### Dependencies
- Phase 1 complete (needs auth)

---

## Phase 9: Polish & Launch Prep

### Objective
Final polish, testing, and deployment preparation.

### Deliverables
- [ ] Mobile responsive design
- [ ] Performance optimization
- [ ] Error handling & loading states
- [ ] SEO meta tags
- [ ] PWA configuration (optional)
- [ ] Full E2E test suite
- [ ] Documentation
- [ ] Deployment to static host

### Quality Checklist
- [ ] All features from V1 working
- [ ] No console errors
- [ ] Graceful degradation without extension
- [ ] Loading spinners on all async operations
- [ ] Error messages for failures
- [ ] Works on mobile

### Deployment Options
- GitHub Pages (free)
- Vercel Static (free tier)
- IPFS (fully decentralized)
- Umbrel app packaging

### Success Criteria
- All E2E tests pass
- Works on mobile browsers
- Can be deployed to static host
- Documentation complete

### Dependencies
- All phases complete

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| NDK encryption API changes | Low | High | Pin NDK version, test early |
| NIP-07 extension compatibility | Medium | Medium | Test with multiple extensions |
| Gift Wrap complexity | High | High | Start Phase 4 early, prototype |
| Relay reliability | Medium | Low | Use fallback relays |
| Mobile responsiveness gaps | Medium | Medium | Mobile-first design in CSS |

---

## Decision Points (Need Input)

1. **Relay selection**: Use existing relays or set up dedicated BitSpark relay?
2. **Job approval**: Automatic or require explicit IO action?
3. **Payment automation**: Integrate NWC or keep manual zaps only?
4. **Search**: Implement client-side or rely on relay search?
5. **Notifications**: In-app only or browser notifications?

---

## Next Steps

1. **Review this meta plan** - Adjust phases as needed
2. **Create Phase 0 detailed plan** - First implementation plan
3. **Set up new repository** - `bitspark-v2`
4. **Begin Phase 0 implementation**

---

## References

- [BITSPARK_V1_SPECIFICATION.md](./BITSPARK_V1_SPECIFICATION.md) - Complete feature spec
- [NDK Documentation](https://ndk.fyi)
- [Nostr NIPs](https://github.com/nostr-protocol/nips)
- [SvelteKit Static Adapter](https://kit.svelte.dev/docs/adapter-static)
