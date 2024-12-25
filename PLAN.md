# High-Level Development Plan

## Goal
The aim is to build an open-source development platform that enables decentralized collaboration on ideas, jobs, and contributions. The platform will use the Nostr protocol for propagating events, ensuring transparency, decentralization, and openness.

## Architecture

### 1. Event Factory (src/backend/NostrEventFactory.js)
Responsible for creating standardized Nostr events for different entities.

Functions:
- createIdeaEvent(name, description, imageUrl, gitRepo, categories)
- createJobEvent(content, ideaId, requirements, programmingLanguage, imageUrl, name, page, categories, pubKeys)
- createOfferEvent(content, jobId, offerId, bid, startDate, duration, termsOfAgreement, pubKeys)
- createApprovalEvent(content, eventId, status)
- createContractEvent(content, jobId, offerId, approvalId, pubKeys)
- createPullRequestEvent(content, jobId, contractId, prUrl, lnAddress)
- createReviewEvent(content, eventId, status, rating)

### 2. Idea Owner Functions (src/backend/IdeaOwnerManager.js)
Handles functionality specific to idea owners.

Functions:
- subscribeToJobsByIdea(ideaId)
- subscribeToOffersByJob(jobId)
- subscribeToContractsByJob(jobId)
- postJob(content, jobId, requirements, programmingLanguage, imageUrl, name, page, categories, pubKeys)
- counterOffer(content, jobId, offerId, bid, startDate, duration, termsOfAgreement, pubKeys)
- declineOffer(content, offerId, pubKeys)
- createContract(content, jobId, offerId, approvalId, pubKeys)
- review(content, eventId, status, rating)
- payDeveloper(content, eventId, amount, pubKey)

### 3. Developer Functions (src/backend/DeveloperManager.js)
Manages developer-specific interactions.

Functions:
- subscribeToAvailableJobs(scope)
- subscribeToMyOffers(pubkey)
- subscribeToMyContracts(pubkey)
- submitOffer(content, jobId, offerId, bid, startDate, duration, termsOfAgreement, pubKeys)
- submitPullRequest(content, jobId, contractId, prUrl, lnAddress)
- approveOffer(content, offerId, pubKeys)
- declineOffer(content, offerId, pubKeys)

### 4. Common Functions (src/backend/CommunityManager.js)
Handles shared functionality and community features.

Functions:
- subscribeToApprovedJobs(ideaId)
- subscribeToPendingJobs(ideaId)
- subscribeToJobActivity(jobId)
- jobHistory(ideaId, pubKey, scope, getPending, getAdvertised, getSigned)

## Implementation Strategy

1. Event Structure
- Each entity (Idea, Job, Offer, etc.) will have a specific Nostr event kind
- Events will maintain references through tags
- Sensitive data will be encrypted when necessary

2. Data Flow
- All events will be processed through NostrCacheStore
- Subscribers will trigger cache updates
- Frontend components will react to cache changes

3. Security Considerations
- Offer details should be encrypted
- Contract terms should be encrypted
- Verification of Github identities
- Validation of event signatures and ownership

4. Cache Management
- Events will be indexed by type and relationship
- Cache will maintain current state of all workflows
- Automatic pruning of outdated or invalid events

## Next Steps

1. Implement NostrEventFactory
2. Set up basic event subscriptions
3. Implement core workflow functions
4. Add encryption for sensitive data
5. Integrate with frontend components
6. Add validation and error handling
7. Implement Zap functionality



