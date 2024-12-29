import { nostrManager } from './NostrManagerStore.js';
import { nostrEventFactory } from './NostrEventFactory.js';
import { nostrCache } from './NostrCacheStore.js';
import {
  NOSTR_KIND_JOB,
  NOSTR_KIND_OFFER,
  NOSTR_KIND_CONTRACT,
  NOSTR_KIND_APPROVAL,
  NOSTR_KIND_REVIEW,
  NOSTR_KIND_PAYMENT,
  NOSTR_KIND_GIFT_WRAP
} from '../constants/nostrKinds.js';
import { communityJobManager } from './CommunityJobManager.js';

/**
 * Verwaltet Idea Owner spezifische Operationen wie Job-Erstellung und Vertragsmanagement
 */
class IdeaOwnerManager {
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

  // === Idea Management ===

  /**
   * Erstellt eine neue Idea
   * @param {string} name - Name der Idea
   * @param {string} subtitle - Untertitel
   * @param {string} abstract - Kurzbeschreibung
   * @param {string} message - Detaillierte Beschreibung
   * @param {string} bannerUrl - URL zum Banner-Bild
   * @param {string} githubRepo - GitHub Repository URL
   * @param {string} lightningAddress - Lightning Zahlungsadresse
   * @param {string[]} categories - Kategorien der Idea
   * @throws {Error} Wenn NostrManager nicht initialisiert
   */
  async createIdea(name, subtitle, abstract, message, bannerUrl, githubRepo, lightningAddress, categories) {
    if (!this.manager) {
      throw new Error('NostrManager not initialized');
    }
    const event = await nostrEventFactory.createIdeaEvent(
      name,
      subtitle,
      abstract,
      message,
      bannerUrl,
      githubRepo,
      lightningAddress,
      categories
    );
    return this.manager.sendEvent(event.kind, event.content, event.tags);
  }

  // === Job Management ===

  /**
   * Erstellt einen neuen Job für eine Idea
   * @throws {Error} Wenn NostrManager nicht initialisiert
   */
  async postJob(name, requirements, imageUrl, page, programmingLanguage, categories, ideaId, abstract) {
    if (!this.manager) {
      throw new Error('NostrManager not initialized');
    }
    const event = await nostrEventFactory.createJobEvent(
      name,
      requirements,
      imageUrl,
      page,
      programmingLanguage,
      categories,
      ideaId,
      abstract
    );
    return this.manager.sendEvent(event.kind, event.content, event.tags);
  }

  /**
   * Republiziert einen Community-Job mit Credit zum ursprünglichen Ersteller
   * @param {Object} jobEvent - Das originale Job-Event
   * @throws {Error} Wenn Job nicht an eine Idea gelinkt oder IO nicht Besitzer
   */
  async republishCommunityJob(jobEvent) {
    if (!this.manager) {
      throw new Error('NostrManager not initialized');
    }
    if (!this.cache) {
      throw new Error('NostrCache not initialized');
    }

    // Prüfe ob der Job an eine unserer Ideas gelinkt ist
    const ideaId = jobEvent.tags.find(t => t[0] === 'e')?.[1];
    if (!ideaId) {
      throw new Error('Job is not linked to an idea');
    }

    const ideaEvent = await this.cache.getEventById(ideaId);
    if (!ideaEvent || ideaEvent.pubkey !== this.manager.publicKey) {
      throw new Error('Not the owner of the linked idea');
    }

    // Republish mit Credit zum ursprünglichen Ersteller
    const event = await nostrEventFactory.createJobEvent(
      jobEvent.tags.find(t => t[0] === 'name')?.[1] || '',
      jobEvent.tags.find(t => t[0] === 'requirements')?.[1] || '',
      jobEvent.tags.find(t => t[0] === 'image')?.[1] || '',
      jobEvent.tags.find(t => t[0] === 'page')?.[1] || '',
      jobEvent.tags.filter(t => t[0] === 'l').map(t => t[1]),
      jobEvent.tags.filter(t => t[0] === 'c').map(t => t[1]),
      ideaId,
      jobEvent.content,  // abstract
      jobEvent.id,  // previousJobId
      [jobEvent.pubkey]  // Credit zum ursprünglichen Ersteller
    );
    return this.manager.sendEvent(event.kind, event.content, event.tags);
  }

  // === Offer Management ===

  /**
   * Sendet ein Gegenangebot zu einem bestehenden Angebot
   * @throws {Error} Wenn vorheriges Angebot nicht gefunden
   */
  async submitCounterOffer(content, jobId, previousOfferId, bid, duration, startDate, termsOfAgreement) {
    if (!this.manager) {
      throw new Error('NostrManager not initialized');
    }
    return communityJobManager.submitOffer(content, jobId, bid, duration, startDate, termsOfAgreement, previousOfferId);
  }

  /**
   * Lehnt ein Angebot ab
   * @throws {Error} Wenn Angebot nicht gefunden
   */
  async declineOffer(content, offerId) {
    if (!this.manager) {
      throw new Error('NostrManager not initialized');
    }
    return communityJobManager.declineOffer(content, offerId);
  }

  // === Contract & Review Management ===

  /**
   * Erstellt einen Vertrag nach Annahme eines Angebots
   * @throws {Error} Wenn Job, Offer oder Approval nicht gefunden
   */
  async createContract(message, jobId, offerId, approvalId) {
    if (!this.manager) {
      throw new Error('NostrManager not initialized');
    }
    return communityJobManager.createContract(message, jobId, offerId, approvalId);
  }

  /**
   * Erstellt ein Review für einen abgeschlossenen Job
   * @throws {Error} Wenn Event nicht gefunden
   */
  async createReview(reason, eventId, status, rating) {
    if (!this.manager) {
      throw new Error('NostrManager not initialized');
    }
    const event = await nostrEventFactory.createReviewEvent(
      reason,
      eventId,
      status,
      rating
    );
    return this.manager.sendEvent(event.kind, event.content, event.tags);
  }

  // === IO Subscriptions ===

  /**
   * Abonniert Jobs für eine bestimmte Idea
   * @param {string} ideaId - ID der Idea
   */
  async subscribeToJobsByIdea(ideaId) {
    if (!this.manager) {
      throw new Error('NostrManager not initialized');
    }
    return this.manager.subscribeToEvents({
      kinds: [NOSTR_KIND_JOB, NOSTR_KIND_GIFT_WRAP],
      "#e": [ideaId]
    });
  }

  /**
   * Abonniert Angebote für einen bestimmten Job
   * @param {string} jobId - ID des Jobs
   */
  async subscribeToOffersByJob(jobId) {
    if (!this.manager) {
      throw new Error('NostrManager not initialized');
    }
    return this.manager.subscribeToEvents({
      kinds: [NOSTR_KIND_OFFER],
      "#e": [jobId, "", "job"]
    });
  }

  /**
   * Abonniert Verträge für einen bestimmten Job
   * @param {string} jobId - ID des Jobs
   */
  async subscribeToContractsByJob(jobId) {
    if (!this.manager) {
      throw new Error('NostrManager not initialized');
    }
    return this.manager.subscribeToEvents({
      kinds: [NOSTR_KIND_CONTRACT],
      "#e": [jobId, "", "job"]
    });
  }

  /**
   * Abonniert Community-Jobs für eine Idea
   * @param {string} ideaId - ID der Idea
   * @note Filterung nach nicht-IO Jobs erfolgt im Frontend/Cache
   */
  async subscribeToCommunityJobs(ideaId) {
    if (!this.manager) {
      throw new Error('NostrManager not initialized');
    }
    return communityJobManager.subscribeToJobsByIdea(ideaId);
  }

  // === Payment (via Lightning) ===

  /**
   * Bezahlt einen Developer via Lightning
   * @throws {Error} Funktionalität wird durch Lightning SDK bereitgestellt
   */
  async payDeveloper(content, eventId, amount, pubKey) {
    throw new Error('Payment handling is done via Lightning SDK');
  }
}

const ideaOwnerManager = new IdeaOwnerManager();
export { ideaOwnerManager };