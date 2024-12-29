import { nostrManager } from './NostrManagerStore.js';
import { nostrEventFactory } from './NostrEventFactory.js';
import { nostrCache } from './NostrCacheStore.js';
import {
  NOSTR_KIND_JOB,
  NOSTR_KIND_OFFER,
  NOSTR_KIND_APPROVAL,
  NOSTR_KIND_CONTRACT,
  NOSTR_KIND_GIFT_WRAP
} from '../constants/nostrKinds.js';

/**
 * Zentrale Verwaltung für Jobs, Angebote und Verträge.
 * Stellt gemeinsame Funktionalität für Developer und Idea Owner bereit.
 */
class CommunityJobManager {
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

  // === Job Status & History ===
  
  /**
   * Ermittelt den aktuellen Status eines Jobs
   * @param {string} jobId - ID des Jobs
   * @returns {string} Status: 'pending', 'approved', 'declined', 'signed'
   * @throws {Error} Wenn NostrCache nicht initialisiert
   */
  async getJobStatus(jobId) {
    if (!this.cache) {
      throw new Error('NostrCache not initialized');
    }

    const events = await this.cache.getEventsByCriteria({
      kinds: [NOSTR_KIND_APPROVAL, NOSTR_KIND_CONTRACT],
      tags: {
        'e': { 
          value: jobId,
          marker: 'job'  // Nur Events mit Job-Marker
        }
      }
    });

    if (events.some(event => event.kind === NOSTR_KIND_CONTRACT)) {
      return 'signed';
    }

    const latestApproval = events
      .filter(event => event.kind === NOSTR_KIND_APPROVAL)
      .sort((a, b) => b.created_at - a.created_at)[0];

    if (latestApproval) {
      const statusTag = latestApproval.tags.find(tag => tag[0] === 'status');
      return statusTag ? statusTag[1] : 'pending';
    }

    return 'pending';
  }

  /**
   * Lädt die Historie eines Jobs oder mehrerer Jobs
   * @param {string} ideaId - Optional: Filtert nach Idea
   * @param {string} pubKey - Optional: Filtert nach Autor
   * @param {Object} scope - Filteroptionen
   * @param {boolean} scope.getPending - Zeige offene Jobs
   * @param {boolean} scope.getAdvertised - Zeige beworbene Jobs
   * @param {boolean} scope.getSigned - Zeige Jobs mit Vertrag
   * @returns {Array} Jobs mit zugehöriger Event-Historie
   * @throws {Error} Wenn NostrCache nicht initialisiert
   */
  async getJobHistory(ideaId, pubKey, scope = {}) {
    if (!this.cache) {
      throw new Error('NostrCache not initialized');
    }

    const jobs = await this.cache.getEventsByCriteria({
      kinds: [NOSTR_KIND_JOB],
      authors: pubKey ? [pubKey] : undefined,
      tags: ideaId ? {
        'e': { value: ideaId }  // Referenz zur Idea
      } : undefined
    });

    // Für jeden Job die zugehörigen Events laden
    const jobsWithHistory = await Promise.all(
      jobs.map(async job => {
        const relatedEvents = await this.cache.getEventsByCriteria({
          kinds: [NOSTR_KIND_OFFER, NOSTR_KIND_APPROVAL, NOSTR_KIND_CONTRACT],
          tags: {
            'e': { 
              value: job.id,
              marker: 'job'  // Nur Events mit Job-Marker
            }
          }
        });

        return {
          job,
          history: relatedEvents.sort((a, b) => a.created_at - b.created_at)
        };
      })
    );

    // Nach Scope filtern
    const { 
      getPending = true, 
      getAdvertised = true, 
      getSigned = true 
    } = scope;

    return jobsWithHistory.filter(({ job, history }) => {
      const hasContract = history.some(event => event.kind === NOSTR_KIND_CONTRACT);
      const hasApproval = history.some(event => 
        event.kind === NOSTR_KIND_APPROVAL && 
        event.tags.some(tag => tag[0] === 'status' && tag[1] === 'approved')
      );

      return (
        (getPending && !hasApproval && !hasContract) ||
        (getAdvertised && hasApproval && !hasContract) ||
        (getSigned && hasContract)
      );
    });
  }

  // === Job Subscriptions ===

  /**
   * Abonniert alle Events zu einem Job
   * @param {string} jobId - ID des Jobs
   * @throws {Error} Wenn NostrManager nicht initialisiert
   */
  async subscribeToJobActivity(jobId) {
    if (!this.manager) {
      throw new Error('NostrManager not initialized');
    }
    
    console.log('Subscribing to job activity:', jobId);
    
    // Nur eine Subscription für Job-bezogene Events
    return this.manager.subscribeToEvents({
      kinds: [NOSTR_KIND_JOB, NOSTR_KIND_OFFER, NOSTR_KIND_APPROVAL, NOSTR_KIND_CONTRACT],
      "#e": [jobId, "", "job"]
    });
  }

  /**
   * Abonniert Jobs für eine bestimmte Idea
   * @param {string} ideaId - ID der Idea
   * @throws {Error} Wenn NostrManager nicht initialisiert
   */
  async subscribeToJobsByIdea(ideaId) {
    if (!this.manager) {
      throw new Error('NostrManager not initialized');
    }
    return this.manager.subscribeToEvents({
      kinds: [NOSTR_KIND_JOB, NOSTR_KIND_GIFT_WRAP],
      "#e": [ideaId, "", "idea"]
    });
  }

  /**
   * Abonniert Approval Events für ein Angebot
   * @param {string} offerId - ID des Angebots
   */
  async subscribeToOfferActivity(offerId) {
    if (!this.manager) {
      throw new Error('NostrManager not initialized');
    }

    console.log('Subscribing to offer activity:', offerId);

    return this.manager.subscribeToEvents({
      kinds: [NOSTR_KIND_APPROVAL],
      "#e": [offerId]  // Approval Events referenzieren direkt die offerId
    });
  }

  // === Job Search & Filtering ===

  /**
   * Sucht Jobs nach verschiedenen Kriterien
   * @param {Object} criteria - Suchkriterien
   * @param {string[]} criteria.categories - Kategorien
   * @param {string[]} criteria.programmingLanguages - Programmiersprachen
   * @param {string} criteria.searchTerm - Textsuche
   * @returns {Array} Gefundene Jobs
   * @throws {Error} Wenn NostrCache nicht initialisiert
   */
  async searchJobs(criteria) {
    if (!this.cache) {
      throw new Error('NostrCache not initialized');
    }

    const {
      categories = [],
      programmingLanguages = [],
      searchTerm = ''
    } = criteria;

    const filter = {
      kinds: [NOSTR_KIND_JOB],
      tags: {}
    };

    if (categories.length > 0) {
      filter.tags.c = categories;
    }
    if (programmingLanguages.length > 0) {
      filter.tags.l = programmingLanguages;
    }

    const jobs = await this.cache.getEventsByCriteria(filter);

    // Text-basierte Filterung
    if (searchTerm) {
      return jobs.filter(job => 
        job.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.tags.some(tag => 
          (tag[0] === 'name' || tag[0] === 'requirements') && 
          tag[1].toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    return jobs;
  }

  // === Offer Management ===

  /**
   * Erstellt ein neues Angebot oder Gegenangebot
   * @param {string} content - Beschreibung des Angebots
   * @param {string} jobId - ID des Jobs
   * @param {number} bid - Preisvorstellung
   * @param {number} duration - Geschätzte Dauer in Tagen
   * @param {string} startDate - Startdatum (ISO-String)
   * @param {string} termsOfAgreement - Vereinbarte Bedingungen
   * @param {string} [previousOfferId] - ID des vorherigen Angebots bei Gegenangeboten
   * @throws {Error} Wenn Job/Angebot nicht gefunden oder Verschlüsselung fehlschlägt
   */
  async submitOffer(content, jobId, bid, duration, startDate, termsOfAgreement, previousOfferId = null) {
    if (!this.manager) {
      throw new Error('NostrManager not initialized');
    }
    if (!this.cache) {
      throw new Error('NostrCache not initialized');
    }

    console.log('submitOffer called with:', {
      content, jobId, bid, duration, startDate, termsOfAgreement, previousOfferId
    });

    // Hole das Job-Event oder vorheriges Offer um den Empfänger zu bestimmen
    const targetEvent = previousOfferId 
      ? await this.cache.getEventById(previousOfferId)
      : await this.cache.getEventById(jobId);
      
    console.log('Cache lookup result:', {
      lookupId: previousOfferId || jobId,
      found: !!targetEvent,
      eventKind: targetEvent?.kind,
      eventPubkey: targetEvent?.pubkey
    });

    if (!targetEvent) {
      throw new Error(previousOfferId ? 'Previous offer not found' : 'Job not found');
    }

    const event = await nostrEventFactory.createOfferEvent(
      content,
      jobId,
      parseInt(bid),
      parseInt(duration),
      startDate,
      termsOfAgreement,
      previousOfferId
    );

    event.pubkey = this.manager.publicKey;

    // Sende an den Empfänger des vorherigen Events
    return this.manager.sendPrivateEvent(event, targetEvent.pubkey);
  }

  /**
   * Akzeptiert ein Angebot
   * @throws {Error} Wenn Angebot nicht gefunden
   */
  async approveOffer(content, offerId) {
    if (!this.manager) {
      throw new Error('NostrManager not initialized');
    }
    const event = await nostrEventFactory.createApprovalEvent(
      content,
      offerId,
      'approved'
    );
    return this.manager.sendEvent(event.kind, event.content, event.tags);
  }

  /**
   * Lehnt ein Angebot ab
   * @throws {Error} Wenn Angebot nicht gefunden
   */
  async declineOffer(content, offerId) {
    if (!this.manager) {
      throw new Error('NostrManager not initialized');
    }

    console.log('CommunityJobManager: Declining offer:', {
      content,
      offerId
    });

    const event = await nostrEventFactory.createApprovalEvent(
      content,
      offerId,
      'declined'
    );

    console.log('Created decline event:', event);

    const result = await this.manager.sendEvent(event.kind, event.content, event.tags);
    console.log('Decline event sent:', result);
    
    return result;
  }

  // === Contract Management ===

  /**
   * Erstellt einen Vertrag nach Annahme eines Angebots
   * @throws {Error} Wenn Job, Offer oder Approval nicht gefunden
   */
  async createContract(message, jobId, offerId, approvalId) {
    if (!this.manager) {
      throw new Error('NostrManager not initialized');
    }
    const event = await nostrEventFactory.createContractEvent(
      message,
      jobId,
      offerId,
      approvalId
    );
    return this.manager.sendEvent(event.kind, event.content, event.tags);
  }

  /**
   * Ermittelt den Status einer Bewerbung anhand der Approval Events
   * @param {string} offerId - ID des Angebots
   * @returns {Promise<{status: string, approvalEvent: Object|null}>} Status und zugehöriges Approval Event
   */
  async getOfferStatus(offerId) {
    if (!this.cache) {
      throw new Error('NostrCache not initialized');
    }

    const approvals = await this.cache.getEventsByCriteria({
      kinds: [NOSTR_KIND_APPROVAL],
      tags: {
        'e': { value: offerId }
      }
    });

    // Neuestes Approval Event finden
    const latestApproval = approvals.sort((a, b) => b.created_at - a.created_at)[0];
    
    if (!latestApproval) {
      return { status: 'pending', approvalEvent: null };
    }

    // Status aus den Tags auslesen
    const statusTag = latestApproval.tags.find(tag => tag[0] === 'status');
    const status = statusTag ? statusTag[1] : 'pending';

    return { 
      status,
      approvalEvent: latestApproval
    };
  }
}

const communityJobManager = new CommunityJobManager();
export { communityJobManager }; 