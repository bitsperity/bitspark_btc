import { nostrManager } from './NostrManagerStore.js';
import { nostrEventFactory } from './NostrEventFactory.js';
import { nostrCache } from './NostrCacheStore.js';
import { communityJobManager } from './CommunityJobManager.js';
import { NOSTR_KIND_IDEA, NOSTR_KIND_JOB, NOSTR_KIND_OFFER, NOSTR_KIND_GIFT_WRAP } from '../constants/nostrKinds.js';

/**
 * Verwaltet die Idea Owner spezifischen Aktionen
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

  ensureInitialized() {
    if (!this.cache || !this.manager) {
      throw new Error('Manager oder Cache nicht initialisiert');
    }
  }

  /**
   * Erstellt eine neue Idea
   */
  async createIdea(name, subtitle, abstract, message, bannerUrl, githubRepo, lightningAddress, categories) {
    this.ensureInitialized();

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

  /**
   * Erstellt einen neuen Job für eine Idea
   */
  async postJob(name, requirements, imageUrl, page, programmingLanguage, categories, ideaId, abstract, previousJobId = null, contributorPubkeys = [], thoughts = "") {
    this.ensureInitialized();

    const event = await nostrEventFactory.createJobEvent(
      name,
      requirements,
      imageUrl,
      page,
      programmingLanguage,
      categories,
      ideaId,
      abstract,
      previousJobId,
      contributorPubkeys,
      thoughts
    );

    return this.manager.sendEvent(event.kind, event.content, event.tags);
  }

  /**
   * Sendet ein Angebot
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
   * Erstellt einen Vertrag
   */
  async createContract(message, jobId, offerId, approvalId) {
    this.ensureInitialized();
    return communityJobManager.createContract(message, jobId, offerId, approvalId);
  }

  /**
   * Lädt alle meine Ideas
   */
  async getMyIdeas() {
    this.ensureInitialized();

    const ideas = await this.cache.getEventsByCriteria({
      kinds: [NOSTR_KIND_IDEA],
      authors: [this.manager.publicKey]
    });

    // Für jede Idea die zugehörigen Jobs laden
    const ideasWithJobs = await Promise.all(
      ideas.map(async idea => {
        const jobs = await this.cache.getEventsByCriteria({
          kinds: [NOSTR_KIND_JOB],
          tags: {
            'e': [idea.id]
          }
        });

        return {
          idea,
          jobs
        };
      })
    );

    return ideasWithJobs;
  }

  /**
   * Lädt alle Jobs einer Idea
   */
  async getIdeaJobs(ideaId) {
    this.ensureInitialized();
    return communityJobManager.getJobHistory(ideaId);
  }

  /**
   * Abonniert Jobs für eine Idea
   */
  async subscribeToJobsByIdea(ideaId) {
    this.ensureInitialized();
    return communityJobManager.subscribeToJobsByIdea(ideaId);
  }
}

const ideaOwnerManager = new IdeaOwnerManager();
export { ideaOwnerManager };