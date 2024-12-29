import { nostrManager } from './NostrManagerStore.js';
import { nostrEventFactory } from './NostrEventFactory.js';
import { nostrCache } from './NostrCacheStore.js';
import {
  NOSTR_KIND_JOB,
  NOSTR_KIND_OFFER,
  NOSTR_KIND_CONTRACT,
  NOSTR_KIND_APPROVAL
} from '../constants/nostrKinds.js';
import { communityJobManager } from './CommunityJobManager.js';

/**
 * Verwaltet entwicklerspezifische Interaktionen mit Jobs, Angeboten und Verträgen.
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

  // === Job Applications ===

  /**
   * Sendet eine erste Bewerbung auf einen Job
   * @param {string} content - Beschreibung der Bewerbung
   * @param {string} jobId - ID des Jobs
   * @param {number} bid - Preisvorstellung
   * @param {number} duration - Geschätzte Dauer in Tagen
   * @param {string} startDate - Startdatum (ISO-String)
   * @param {string} termsOfAgreement - Vereinbarte Bedingungen
   * @throws {Error} Wenn Job nicht gefunden oder Verschlüsselung fehlschlägt
   */
  async submitJobApplication(content, jobId, bid, duration, startDate, termsOfAgreement) {
    if (!this.manager) {
      throw new Error('NostrManager not initialized');
    }

    console.log('DeveloperManager: Creating job application event', {
      content,
      jobId,
      bid,
      duration,
      startDate,
      termsOfAgreement
    });

    const tags = [
      ['e', jobId, '', 'job'],
      ['bid', bid.toString()],
      ['duration', duration.toString()],
      ['startDate', startDate],
      ['termsOfAgreement', termsOfAgreement],
      ['s', 'bitspark']
    ];

    console.log('DeveloperManager: Tags for event:', tags);
    
    try {
      // Get job event to find the receiver
      const jobEvent = await this.cache.getEventById(jobId);
      if (!jobEvent) {
        throw new Error('Job not found');
      }
      console.log('DeveloperManager: Found job event:', jobEvent);

      const event = nostrEventFactory.createOfferEvent(
        content,
        jobId,
        bid,
        duration,
        startDate,
        termsOfAgreement
      );
      console.log('DeveloperManager: Created offer event:', event);

      const eventId = await this.manager.sendPrivateEvent(event, jobEvent.pubkey);
      console.log('DeveloperManager: Event sent successfully, id:', eventId);
      return eventId;
    } catch (error) {
      console.error('DeveloperManager: Error submitting application:', error);
      throw error;
    }
  }

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

  // === Offer Responses ===

  /**
   * Akzeptiert ein erhaltenes Angebot
   * @throws {Error} Wenn Angebot nicht gefunden
   */
  async acceptOffer(content, offerId) {
    if (!this.manager) {
      throw new Error('NostrManager not initialized');
    }
    return communityJobManager.approveOffer(content, offerId);
  }

  /**
   * Lehnt ein erhaltenes Angebot ab
   * @throws {Error} Wenn Angebot nicht gefunden
   */
  async declineOffer(content, offerId) {
    if (!this.manager) {
      throw new Error('NostrManager not initialized');
    }
    return communityJobManager.declineOffer(content, offerId);
  }

  // === Developer Subscriptions ===

  /**
   * Abonniert verfügbare Jobs nach Kriterien
   * @param {Object} scope - Filterkriterien
   * @param {string[]} scope.categories - Kategorien
   * @param {string[]} scope.languages - Programmiersprachen
   */
  async subscribeToAvailableJobs(scope) {
    if (!this.manager) {
      throw new Error('NostrManager not initialized');
    }
    
    const filter = {
      kinds: [NOSTR_KIND_JOB]
    };

    if (scope?.categories) {
      filter["#c"] = scope.categories;
    }
    if (scope?.languages) {
      filter["#l"] = scope.languages;
    }

    return this.manager.subscribeToEvents(filter);
  }

  /**
   * Abonniert eigene Angebote
   * @param {string} pubkey - Öffentlicher Schlüssel des Entwicklers
   */
  async subscribeToMyOffers(pubkey) {
    if (!this.manager) {
      throw new Error('NostrManager not initialized');
    }
    if (!pubkey) {
      throw new Error('Public key is required');
    }
    return this.manager.subscribeToEvents({
      kinds: [NOSTR_KIND_OFFER],
      authors: [pubkey]
    });
  }

  /**
   * Abonniert eigene Verträge
   * @param {string} pubkey - Öffentlicher Schlüssel des Entwicklers
   */
  async subscribeToMyContracts(pubkey) {
    if (!this.manager) {
      throw new Error('NostrManager not initialized');
    }
    if (!pubkey) {
      throw new Error('Public key is required');
    }
    return this.manager.subscribeToEvents({
      kinds: [NOSTR_KIND_CONTRACT],
      "#p": [pubkey]
    });
  }

  // === Pull Requests ===

  /**
   * Reicht einen Pull Request für einen Job ein
   * @throws {Error} Wenn Job nicht gefunden
   */
  async submitPullRequest(content, jobId, prUrl, lnAddress) {
    if (!this.manager) {
      throw new Error('NostrManager not initialized');
    }
    const event = await nostrEventFactory.createPullRequestEvent(
      content,
      jobId,
      prUrl,
      lnAddress
    );
    return this.manager.sendEvent(event.kind, event.content, event.tags);
  }
}

const developerManager = new DeveloperManager();
export { developerManager };