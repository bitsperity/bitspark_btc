# BitSpark V1 Complete Feature Specification

> **Purpose**: Exhaustive documentation of all BitSpark V1 features for V2 reimplementation.
> No functionality should be lost in migration.

---

## Table of Contents
1. [Platform Overview](#1-platform-overview)
2. [Event Data Model](#2-event-data-model)
3. [User Roles & Permissions](#3-user-roles--permissions)
4. [Feature Modules](#4-feature-modules)
5. [User Workflows](#5-user-workflows)
6. [UI Components](#6-ui-components)
7. [Infrastructure](#7-infrastructure)

---

## 1. Platform Overview

BitSpark is a **decentralized freelance marketplace** built on Nostr protocol where:
- **Idea Owners (IO)** post project ideas and create jobs
- **Developers** apply for jobs with encrypted offers
- **Community** can browse, comment, like, and support with Zaps

### Core Value Proposition
- Decentralized identity (Nostr keys)
- Encrypted negotiations (NIP-17/44/59)
- Lightning payments (Zaps via NIP-57)
- GitHub identity verification
- Open-source collaboration

---

## 2. Event Data Model

### 2.1 Custom Event Kinds

| Kind | Name | Description | Privacy |
|------|------|-------------|---------|
| **1341** | IDEA | Project/idea posting | Public |
| **2542** | JOB | Job posting within an idea | Public |
| **2543** | OFFER | Job application/bid | **Encrypted** (Gift Wrap) |
| **2544** | APPROVAL | Accept/decline offer | Public |
| **2545** | CONTRACT | Finalized agreement | Public |
| **2546** | PULL_REQUEST | PR submission | Public |
| **2547** | REVIEW | Work review with rating | Public |

### 2.2 Standard Nostr Events Used

| Kind | Usage |
|------|-------|
| **0** | User profiles |
| **1** | Comments (with `s:bitspark` tag) |
| **3** | Follow lists |
| **5** | Event deletion |
| **7** | Reactions/Likes |
| **14** | Sealed DMs (NIP-17) |
| **1059** | Gift Wrap (NIP-59) |
| **9735** | Zaps (NIP-57) |
| **10002** | Relay list metadata |

---

### 2.3 Event Schemas

#### IDEA (Kind 1341)
```
content: string (detailed description / abstract)
tags:
  - ["iName", "<idea name>"]
  - ["iSub", "<subtitle>"]
  - ["ibUrl", "<banner image URL>"]
  - ["gitrepo", "<GitHub repository URL>"]
  - ["lnadress", "<Lightning address for tips>"]
  - ["abstract", "<short abstract>"]
  - ["c", "<category>"] (multiple)
  - ["s", "bitspark"]
```

#### JOB (Kind 2542)
```
content: string (job abstract/description)
tags:
  - ["name", "<job title>"]
  - ["requirements", "<technical requirements>"]
  - ["image", "<job banner URL>"]
  - ["page", "<detailed HTML page content>"]
  - ["l", "<programming language>"] (multiple)
  - ["c", "<category>"] (multiple)
  - ["e", "<idea ID>"]
  - ["e", "<previous job ID>"] (optional, for follow-up jobs)
  - ["p", "<contributor pubkey>"] (multiple, optional)
  - ["thoughts", "<additional thoughts>"]
  - ["s", "bitspark"]
```

#### OFFER (Kind 2543) - **ENCRYPTED via Gift Wrap**
```
content: string (message to job owner)
tags:
  - ["bid", "<amount in sats>"]
  - ["duration", "<estimated days>"]
  - ["startDate", "<ISO date>"]
  - ["termsOfAgreement", "<terms text>"]
  - ["e", "<job ID>", "", "job"]
  - ["e", "<previous offer ID>", "", "prev_offer"] (for counter-offers)
  - ["p", "<recipient pubkey>"]
  - ["s", "bitspark"]
```

#### APPROVAL (Kind 2544)
```
content: string (reason/message)
tags:
  - ["e", "<offer ID>", "", "offer"]
  - ["status", "approved" | "declined"]
  - ["reason", "<optional reason>"]
  - ["s", "bitspark"]
```

#### CONTRACT (Kind 2545)
```
content: string (contract message)
tags:
  - ["e", "<job ID>", "", "job"]
  - ["e", "<offer ID>", "", "offer"]
  - ["e", "<approval ID>", "", "approval"]
  - ["s", "bitspark"]
```

#### PULL_REQUEST (Kind 2546)
```
content: string (PR description)
tags:
  - ["url", "<PR URL>"]
  - ["ln", "<Lightning address for payment>"]
  - ["e", "<job ID>"]
  - ["commit", "<commit hash>"] (optional)
  - ["s", "bitspark"]
```

#### REVIEW (Kind 2547)
```
content: string (review text)
tags:
  - ["e", "<event ID being reviewed>"]
  - ["status", "approved" | "declined"]
  - ["rating", "<1-5>"]
  - ["s", "bitspark"]
```

---

## 3. User Roles & Permissions

### 3.1 Idea Owner (IO)

**Capabilities:**
- Create Ideas with full metadata
- Create Jobs for their Ideas
- View all applications (offers) for their jobs
- Send counter-offers
- Accept/decline offers
- Create contracts
- Review submitted PRs
- Approve/decline PRs
- Initiate payments via Zaps

**Restrictions:**
- Cannot apply to their own jobs

### 3.2 Developer

**Capabilities:**
- Browse all public ideas and approved jobs
- Submit encrypted offers/applications
- Receive counter-offers
- Accept/decline counter-offers
- Submit pull requests
- Receive payments

**Restrictions:**
- Cannot create jobs (only IOs can)

### 3.3 Community (Any User)

**Capabilities:**
- Browse ideas, jobs, profiles
- Comment on any public event
- Like/unlike events
- Follow/unfollow users
- Zap (tip) any event or user
- Send direct messages

---

## 4. Feature Modules

### 4.1 Authentication & Identity

| Feature | Description |
|---------|-------------|
| **NIP-07 Login** | Browser extension signer (Alby, nos2x) |
| **Profile Creation** | Name, picture, banner, bio, Lightning address |
| **GitHub Verification** | Link GitHub identity via Gist proof |
| **Relay Management** | Add/remove personal relays (NIP-65) |

**Profile Fields:**
- `name`, `picture`, `banner`, `dev_about`, `lud16` (Lightning)
- GitHub identity: `["i", "github:<username>", "<gist proof ID>"]`

### 4.2 Idea Management

| Feature | Description |
|---------|-------------|
| **Create Idea** | Full form with name, subtitle, abstract, description, banner, GitHub repo, Lightning address, categories |
| **View Ideas** | Browse all ideas, filter by category |
| **Idea Detail** | Full idea page with jobs, comments, zaps |
| **My Ideas** | Dashboard of user's own ideas |

### 4.3 Job Management

| Feature | Description |
|---------|-------------|
| **Create Job** | Linked to idea, with title, requirements, languages, categories |
| **Job Approval Flow** | IO must approve jobs before they're publicly visible |
| **Job Statuses** | `pending` → `approved` → `signed` (contracted) |
| **View Job** | Full job detail with application button |
| **Job Explorer** | Browse all approved jobs |
| **My Jobs** | Dashboard of jobs user is involved with |

### 4.4 Application/Offer System

| Feature | Description |
|---------|-------------|
| **Submit Application** | Encrypted offer with bid, duration, start date, terms |
| **Offer Chains** | Back-and-forth negotiation (counter-offers) |
| **Offer Status Tracking** | `pending` → `approved` / `declined` → `contracted` |
| **View Applications** | IO sees all offers for their jobs |
| **My Applications** | Developer sees their own offers |

**Negotiation Flow:**
```
Developer → Initial Offer (encrypted)
    ↓
IO ← Receives offer
    ↓
IO → Counter-offer (encrypted) | Accept | Decline
    ↓
Developer ← Counter-offer
    ↓
(Repeat until agreement or decline)
    ↓
IO → Create Contract
```

### 4.5 Pull Request System

| Feature | Description |
|---------|-------------|
| **Submit PR** | Link to GitHub PR, Lightning address for payment |
| **PR Review** | IO reviews and approves/declines |
| **PR Status** | `pending` → `approved` / `declined` |
| **Payment Trigger** | Approved PR triggers payment flow |

### 4.6 Payment System

| Feature | Description |
|---------|-------------|
| **Zaps (NIP-57)** | Lightning tips on any event |
| **Zap Counting** | Display total sats received per event |
| **Zap Widget** | UI component showing zap totals |
| **Payment on PR Approval** | Suggested payment to developer |

### 4.7 Social Features

| Feature | Description |
|---------|-------------|
| **Follow/Unfollow** | NIP-02 follow lists |
| **Follow Status** | Check if following, if follows me |
| **Feed** | Events from followed users |
| **Likes** | React to events with ❤️ |
| **Like Counting** | Display unique like count |
| **Comments** | Kind 1 notes referencing events |

### 4.8 Direct Messaging

| Feature | Description |
|---------|-------------|
| **Encrypted DMs** | NIP-17 Gift Wrap DMs |
| **Chat Rooms** | Group conversations by participants |
| **Subject Lines** | Optional message subjects |
| **Real-time Updates** | Subscribe to incoming messages |

### 4.9 Profile Features

| Feature | Description |
|---------|-------------|
| **View Profile** | Public profile page |
| **Edit Profile** | Update name, picture, bio, etc. |
| **GitHub Verification Display** | Show verified badge |
| **Lightning Address** | Display for tipping |
| **Follow Button** | Follow/unfollow from profile |
| **DM Button** | Start conversation from profile |

---

## 5. User Workflows

### 5.1 Idea Owner Workflow

![Workflow Diagram](./uploaded_image_1_1767193672454.png)

**Activities:**
1. Login → Create Idea
2. Idea Management:
   - Post Job
   - Review Job Proposal
   - Accept/Decline Job Proposal
   - Share/Counter Job Proposal
   - Accept Counter Offer
3. Application Management:
   - Read Applications
   - Accept/Decline Application
   - Counter Offer
4. PR Management:
   - Review PR
   - Accept/Decline PR
   - Pay Developer

**Tasks (Granular):**
- Click Login → Click Create Idea → Fill Form → Check Preview → Post
- Read job proposal → Accept/Decline/Share/Counter
- Read applications → Accept/Decline/Counter offer
- Pay on PR approval

### 5.2 Developer Workflow

**Activities:**
1. Apply for Job
2. Accept Counter Offer
3. Publish PR
4. Browse

**Tasks:**
- Find Job → Fill Form → Post → Await Response
- Read/Accept/Decline Counter Offer
- Submit PR URL + Lightning Address

### 5.3 Community Workflow

**Activities:**
1. Explore all
2. DM
3. View Idea/Profile/Job
4. Browse Ideas/Jobs/All
5. Create Ideas/Jobs
6. Browse Jobs

**Tasks:**
- Find Idea → Click on Idea → View Details
- Click Add Job → Fill Form → Preview → Post → Wait for Approval

---

## 6. UI Components

### 6.1 Layout Components
- **Sidebar** - Navigation menu
- **Banner** - Page header with title/subtitle
- **Toolbar** - Action buttons (GitHub, Lightning, etc.)
- **Footer** - Site footer

### 6.2 Widgets
- **IdeaWidget** - Idea card display
- **JobWidget** - Job listing for an idea
- **CommentWidget** - Comment thread
- **ZapWidget** - Zap counter and button
- **LikeIcon** - Like button with count
- **ShareIcon** - Share functionality
- **FollowButton** - Follow/unfollow toggle
- **DMButton** - Direct message trigger
- **ProfileImg** - Avatar display

### 6.3 Cards
- **IdeaCard** - Idea preview card
- **JobCard** - Job preview card
- **ProfileCard** - User profile card

### 6.4 Modals
- **ApplicationModal** - Job application form
- (Other modals for confirmations, etc.)

### 6.5 Feed Components
- **FeedItem** - Individual feed entry
- **FeedList** - Feed container

### 6.6 Job Management Components
- 13 components for job workflow UI

### 6.7 Direct Message Components
- 5 components for DM UI

---

## 7. Infrastructure

### 7.1 State Management

| Store | Purpose |
|-------|---------|
| `nostrManager` | Relay pool, signing, event publishing |
| `nostrCache` | Event caching with indexes |
| `helperStore` | Legacy NostrHelper instance |
| `balanceStore` | Payment balance tracking |
| `ideaStore` | Idea-specific state |
| `filterStore` | Search/filter state |

### 7.2 Manager Classes

| Manager | Responsibility |
|---------|----------------|
| `NostrCacheManager` | Relay connection, subscriptions, encryption |
| `NostrEventFactory` | Event creation templates |
| `JobManager` | Job CRUD, approvals, PRs |
| `IdeaOwnerManager` | IO-specific workflows |
| `DeveloperManager` | Developer-specific workflows |
| `CommunityJobManager` | Shared job logic, offer chains |
| `SocialMediaManager` | Likes, follows, profiles |
| `DMManager` | Encrypted messaging |
| `ZapManager` | Zap subscriptions and counting |

### 7.3 Encryption Flow (NIP-17/44/59)

```
1. Create inner event (e.g., Offer)
2. Sign inner event with user key
3. Create Seal: Encrypt inner event with NIP-44 for recipient
4. Sign Seal with user key
5. Create Gift Wrap: Encrypt Seal with anonymous key
6. Publish Gift Wrap (Kind 1059)
```

### 7.4 Caching Strategy

- **In-memory event cache** with Map
- **Kind index** - Fast lookup by event kind
- **Author index** - Fast lookup by pubkey
- **Tag-based filtering** - Complex query support
- **GitHub verification cache** - Async validation

### 7.5 Relay Configuration

Default relays:
- `wss://relay.damus.io`
- `wss://nostr.einundzwanzig.space`

User can add custom relays via NIP-65.

---

## 8. Event Relationship Diagram

![Event Schema](./uploaded_image_0_1767193672454.png)

**Hierarchy:**
```
Idea (1341)
  └── Job (2542)
        ├── Offer (2543) [encrypted]
        │     └── Counter-Offer (2543) [chain]
        │           └── Approval (2544)
        │                 └── Contract (2545)
        └── PullRequest (2546)
              └── Zap (9735)
                    └── Review (2547)
```

---

## 9. Missing/Incomplete Features (V1)

| Feature | Status |
|---------|--------|
| Payment automation | Manual (no NWC integration) |
| Dispute resolution | Not implemented |
| Milestone payments | Not implemented |
| Team jobs | Partial (contributor pubkeys) |
| Search/filtering | Basic |
| Notifications | Via relay subscriptions only |
| Mobile responsiveness | Partial |

---

## 10. Technical Debt / Issues

1. **Dual Nostr implementations**: Both `NostrHelper.js` (legacy) and new manager system
2. **Svelte 3** - Should upgrade to Svelte 5
3. **nostr-tools direct usage** - Should use NDK
4. **Manual encryption** - Complex Gift Wrap implementation
5. **No TypeScript** - All JavaScript
6. **Inconsistent tag formats** - Some use markers, some don't

---

## 11. Recommended V2 Improvements

1. **Use NDK** instead of nostr-tools
2. **Svelte 5** with runes
3. **TypeScript** throughout
4. **NWC (Nostr Wallet Connect)** for payments
5. **Proper state management** with NDK reactive stores
6. **Milestone-based payments**
7. **Dispute resolution system**
8. **Mobile-first responsive design**
9. **Real-time notifications**
10. **Full-text search**
