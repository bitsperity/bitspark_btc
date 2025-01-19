import { nostrManager } from './NostrManagerStore.js';
import { nostrEventFactory } from './NostrEventFactory.js';
import { nostrCache } from './NostrCacheStore.js';
import { communityJobManager } from './CommunityJobManager.js';
import { NOSTR_KIND_OFFER, NOSTR_KIND_APPROVAL, NOSTR_KIND_GIFT_WRAP } from '../constants/nostrKinds.js';

/**
 * Verwaltet die Developer-spezifischen Aktionen wie Bewerbungen und Angebote
 */
class DeveloperManager {
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
      throw new Error('Manager oder Cache nicht initialisiert');
    }
  }

  /**
   * Erstellt ein Angebot für einen Job
   * @param {string} content - Nachricht
   * @param {string} jobId - ID des Jobs
   * @param {number} bid - Preisvorstellung
   * @param {number} duration - Geschätzte Dauer in Tagen
   * @param {string} startDate - Startdatum
   * @param {string} termsOfAgreement - Vereinbarte Bedingungen
   * @param {string} [previousOfferId] - Optional: ID des vorherigen Angebots bei Gegenangeboten
   */
  async submitOffer(content, jobId, bid, duration, startDate, termsOfAgreement, prevOfferId = null, recipient = null) {
    this.ensureInitialized();

    // Bei initialem Angebot: Hole den Job-Ersteller als Empfänger
    if (!recipient) {
      const job = await this.cache.getEventById(jobId);
      if (!job) {
        throw new Error('Job nicht gefunden');
      }
      recipient = job.pubkey;
      console.log('Using job creator as recipient:', recipient);
    }

    try {
      // Erstelle das Event über den Factory
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

      // Debug: Event vor dem Publishing
      console.log('=== Event vor dem Publishing ===');
      console.log(JSON.stringify(event, null, 2));
      console.log('==============================');

      // Sende das Event verschlüsselt an beide Empfänger
      console.log('Sending encrypted event to recipient:', recipient);
      const recipientEventId = await this.manager.sendPrivateEvent(event, recipient);
      
      console.log('Sending encrypted event to self:', this.manager.publicKey);
      const selfEventId = await this.manager.sendPrivateEvent(event, this.manager.publicKey);

      return recipientEventId;
    } catch (error) {
      console.error('Error sending event:', error);
      throw error;
    }
  }

  /**
   * Akzeptiert ein Angebot
   */
  async acceptOffer(content, offerId) {
    this.ensureInitialized();
    return communityJobManager.approveOffer(content, offerId);
  }

  /**
   * Lehnt ein Angebot ab
   */
  async declineOffer(content, offerId) {
    this.ensureInitialized();
    return communityJobManager.declineOffer(content, offerId);
  }

  /**
   * Lädt alle Jobs auf die ich mich beworben habe
   */
  async getMyApplications() {
    this.ensureInitialized();

    // Alle Offers von mir laden
    const myOffers = await this.cache.getEventsByCriteria({
      kinds: [NOSTR_KIND_OFFER],
      authors: [this.manager.publicKey]
    });

    // Für jedes Offer den zugehörigen Job und Status laden
    const applications = await Promise.all(
      myOffers.map(async offer => {
        const jobId = offer.tags.find(t => t[0] === 'e')?.[1];
        if (!jobId) return null;

        const job = await this.cache.getEventById(jobId);
        if (!job) return null;

        const status = await communityJobManager.getJobStatus(jobId);

        return {
          job,
          offer,
          status
        };
      })
    );

    return applications.filter(Boolean);
  }
}

const developerManager = new DeveloperManager();
export { developerManager };