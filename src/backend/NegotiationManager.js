import { nostrManager } from './NostrManagerStore.js';
import { nostrEventFactory } from './NostrEventFactory.js';
import { nostrCache } from './NostrCacheStore.js';
import { NOSTR_KIND_OFFER, NOSTR_KIND_APPROVAL } from '../constants/nostrKinds.js';

/**
 * Manages negotiations between idea owners and developers
 */
class NegotiationManager {
  constructor() {
    this.manager = null;
    this.cache = null;
    this.init();
  }

  init() {
    nostrManager.subscribe(value => {
      this.manager = value;
    });
    nostrCache.subscribe(value => {
      this.cache = value;
    });
  }

  ensureInitialized() {
    if (!this.cache || !this.manager) {
      throw new Error('Manager or Cache not initialized');
    }
  }

  /**
   * Gets all initial offers for a job (offers that don't reference previous offers)
   * @param {string} jobId - The ID of the job
   * @returns {Promise<Array>} Array of initial offers
   */
  async getInitialOffers(jobId) {
    this.ensureInitialized();

    const offers = await this.cache.getEventsByCriteria({
      kinds: [NOSTR_KIND_OFFER],
      tags: {
        'e': [jobId]
      }
    });

    // Filter for initial offers (those that don't have a prev_offer tag)
    return offers.filter(offer => 
      !offer.tags.some(tag => tag[0] === 'e' && tag[3] === 'prev_offer')
    );
  }

  /**
   * Gets the complete negotiation chain for an offer
   * @param {string} offerId - The ID of any offer in the chain
   * @returns {Promise<Array>} Array of offers in chronological order
   */
  async getNegotiationChain(offerId) {
    this.ensureInitialized();

    const offer = await this.cache.getEventById(offerId);
    if (!offer) {
      throw new Error('Offer not found');
    }

    let currentOffer = offer;
    const chain = [offer];

    while (true) {
      // Find events that reference the current offer as prev_offer
      const nextOffers = await this.cache.getEventsByCriteria({
        kinds: [NOSTR_KIND_OFFER],
        tags: {
          'e': [currentOffer.id]
        }
      });

      // Find the next offer in the chain (that has current offer as prev_offer)
      const nextOffer = nextOffers.find(offer => 
        offer.tags.some(tag => 
          tag[0] === 'e' && 
          tag[1] === currentOffer.id && 
          tag[3] === 'prev_offer'
        )
      );

      if (!nextOffer) break;

      chain.push(nextOffer);
      currentOffer = nextOffer;
    }

    return chain.sort((a, b) => a.created_at - b.created_at);
  }

  /**
   * Submits a new offer or counter offer
   * @param {string} content - Message content
   * @param {string} jobId - ID of the job
   * @param {number} bid - Price in sats
   * @param {number} duration - Estimated duration in days
   * @param {string} startDate - Start date
   * @param {string} termsOfAgreement - Terms of agreement
   * @param {string} [prevOfferId] - Optional: ID of the previous offer for counter offers
   * @param {string} [recipient] - Optional: Recipient's public key
   * @returns {Promise<string>} The ID of the created offer
   */
  async submitOffer(content, jobId, bid, duration, startDate, termsOfAgreement, prevOfferId = null, recipient = null) {
    this.ensureInitialized();

    // For initial offers: Get the job creator as recipient
    if (!recipient) {
      const job = await this.cache.getEventById(jobId);
      if (!job) {
        throw new Error('Job not found');
      }
      recipient = job.pubkey;
    }

    try {
      // Create the offer event
      const event = await nostrEventFactory.createOfferEvent(
        content,
        jobId,
        bid,
        duration,
        startDate,
        termsOfAgreement,
        recipient,
        prevOfferId
      );

      // Send encrypted event to recipient and self
      await this.manager.sendPrivateEvent(event, recipient);
      await this.manager.sendPrivateEvent(event, this.manager.publicKey);

      return event.id;
    } catch (error) {
      console.error('Error submitting offer:', error);
      throw error;
    }
  }

  /**
   * Accepts an offer
   * @param {string} content - Approval message
   * @param {string} offerId - ID of the offer to accept
   * @returns {Promise<string>} The ID of the approval event
   */
  async acceptOffer(content, offerId) {
    this.ensureInitialized();

    try {
      const event = await nostrEventFactory.createApprovalEvent(content, offerId, 'approved');
      return await this.manager.sendEvent(event.kind, event.content, event.tags);
    } catch (error) {
      console.error('Error accepting offer:', error);
      throw error;
    }
  }

  /**
   * Declines an offer
   * @param {string} content - Decline message
   * @param {string} offerId - ID of the offer to decline
   * @returns {Promise<string>} The ID of the decline event
   */
  async declineOffer(content, offerId) {
    this.ensureInitialized();

    try {
      const event = await nostrEventFactory.createApprovalEvent(content, offerId, 'declined');
      return await this.manager.sendEvent(event.kind, event.content, event.tags);
    } catch (error) {
      console.error('Error declining offer:', error);
      throw error;
    }
  }

  /**
   * Gets all offers for a specific job
   * @param {string} jobId - The ID of the job
   * @returns {Promise<Array>} Array of all offers for the job
   */
  async getJobOffers(jobId) {
    this.ensureInitialized();

    return await this.cache.getEventsByCriteria({
      kinds: [NOSTR_KIND_OFFER],
      tags: {
        'e': [jobId]
      }
    });
  }

  /**
   * Gets the approval status for an offer
   * @param {string} offerId - The ID of the offer
   * @returns {Promise<Object|null>} The approval event or null if not found
   */
  async getOfferApproval(offerId) {
    this.ensureInitialized();
    // TODO: get only approval events that belong to the idea owner and the developer
    const approvals = await this.cache.getEventsByCriteria({
      kinds: [NOSTR_KIND_APPROVAL],
      tags: {
        'e': [offerId]
      }
    });

    return approvals.length > 0 ? approvals : null;
  }
}

const negotiationManager = new NegotiationManager();
export { negotiationManager };
