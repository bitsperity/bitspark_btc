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

  ensureInitialized() {
    if (!this.cache || !this.manager) {
      throw new Error('Manager oder Cache nicht initialisiert');
    }
  }

  // === Job Queries ===

  /**
   * Basis-Methode zum Laden von Jobs
   * @param {Object} criteria - Suchkriterien
   * @returns {Array} Gefundene Jobs
   */
  async queryJobs(criteria = {}) {
    this.ensureInitialized();
    
    const jobCriteria = {
      kinds: [NOSTR_KIND_JOB],
      ...criteria
    };

    return this.cache.getEventsByCriteria(jobCriteria);
  }

  /**
   * Basis-Methode zum Laden von Job-bezogenen Events
   * @param {string} jobId - ID des Jobs
   * @param {Array} kinds - Event-Typen die geladen werden sollen
   * @returns {Array} Gefundene Events
   */
  async queryJobEvents(jobId, kinds = [NOSTR_KIND_OFFER, NOSTR_KIND_APPROVAL, NOSTR_KIND_CONTRACT]) {
    this.ensureInitialized();

    return this.cache.getEventsByCriteria({
      kinds,
      tags: {
        'e': [jobId]
      }
    });
  }

  // === Job Status & History ===
  
  /**
   * Ermittelt den aktuellen Status eines Jobs
   * @param {string} jobId - ID des Jobs
   * @returns {string} Status: 'pending', 'approved', 'declined', 'signed'
   */
  async getJobStatus(jobId) {
    this.ensureInitialized();

    const events = await this.queryJobEvents(jobId, [NOSTR_KIND_APPROVAL, NOSTR_KIND_CONTRACT]);

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
   * Lädt die komplette Offer-Kette für einen Job
   * @private
   */
  async getOfferChain(initialOffer) {
    const chain = [initialOffer];
    let currentOffer = initialOffer;

    while (true) {
      // Suche nach Counter-Offers die auf das aktuelle Offer verweisen
      const counterOffers = await this.cache.getEventsByCriteria({
        kinds: [NOSTR_KIND_OFFER],
        tags: {
          'e': [currentOffer.id]  // Referenz zum vorherigen Offer
        }
      });

      // Sortiere nach Zeitstempel und nimm das neueste
      const nextOffer = counterOffers.sort((a, b) => b.created_at - a.created_at)[0];
      if (!nextOffer) break;

      chain.push(nextOffer);
      currentOffer = nextOffer;
    }

    return chain;
  }

  /**
   * Lädt alle Offer-Ketten für einen Job
   * @private
   */
  async getOfferChains(jobId) {
    // Finde alle initialen Offers (die, die nur auf den Job verweisen)
    const initialOffers = await this.cache.getEventsByCriteria({
      kinds: [NOSTR_KIND_OFFER],
      tags: {
        'e': [jobId]
      }
    });

    // Filtere auf wirklich initiale Offers (die keine prev_offer Referenz haben)
    const realInitialOffers = initialOffers.filter(offer => 
      !offer.tags.some(t => t[0] === 'e' && t[3] === 'prev_offer')
    );

    // Für jedes initiale Offer die komplette Kette laden
    const chains = await Promise.all(
      realInitialOffers.map(offer => this.getOfferChain(offer))
    );

    return chains;
  }

  /**
   * Lädt die Historie eines Jobs oder mehrerer Jobs
   * @param {string} ideaId - Optional: Filtert nach Idea
   * @param {string} pubKey - Optional: Filtert nach Autor
   * @param {Object} scope - Filteroptionen
   * @returns {Array} Jobs mit zugehöriger Event-Historie
   */
  async getJobHistory(ideaId, pubKey = null, options = {}) {
    this.ensureInitialized();

    console.log('=== Getting Job History ===');
    console.log('IdeaID:', ideaId);
    console.log('PubKey:', pubKey);
    console.log('Options:', options);

    // Hole alle Jobs für die Idea
    const jobs = await this.cache.getEventsByCriteria({
      kinds: [NOSTR_KIND_JOB],
      tags: {
        'e': [ideaId]
      }
    });

    console.log('Found jobs:', jobs.length);

    // Für jeden Job die zugehörigen Events laden
    const jobsWithHistory = await Promise.all(jobs.map(async job => {
      console.log('Processing job:', job.id);

      // Hole alle Events die sich auf diesen Job beziehen
      const history = await this.cache.getEventsByCriteria({
          tags: {
          'e': [job.id]
        }
      });

      console.log('Found history events:', history.length);

      // Baue Angebotsketten auf
      const offerChains = this.buildOfferChains(history);
      console.log('Built offer chains:', offerChains.length);

        return {
          job,
        history,
        offerChains
      };
    }));

    return jobsWithHistory;
  }

  /**
   * Baut Angebotsketten aus den Events auf
   */
  buildOfferChains(events) {
    console.log('=== Building Offer Chains ===');
    
    // Extrahiere alle Angebote
    const offers = events.filter(e => e.kind === NOSTR_KIND_OFFER);
    console.log('Total offers:', offers.length);

    // Map für schnellen Zugriff auf Angebote
    const offerMap = new Map(offers.map(o => [o.id, o]));

    // Finde Root-Angebote (die keinen prev_offer tag haben)
    const rootOffers = offers.filter(o => {
      const eTags = o.tags.filter(t => t[0] === 'e');
      return !eTags.some(t => t[3] === 'prev_offer');
    });
    console.log('Root offers:', rootOffers.length);

    // Baue Ketten auf
    const chains = rootOffers.map(root => {
      const chain = {
        id: root.id,
        initialOffer: root,
        counterOffers: [],
        status: 'pending',
        currentActor: root.pubkey === this.manager?.publicKey ? 'dev' : 'io'
      };

      let current = root;
      
      // Folge den Counter-Offers
      while (true) {
        // Suche nach Angeboten die das aktuelle als prev_offer referenzieren
        const reply = offers.find(o => 
          o.tags.some(t => t[0] === 'e' && t[1] === current.id && t[3] === 'prev_offer')
        );
        
        if (!reply) break;
        
        console.log(`Found counter-offer: ${reply.id} for offer: ${current.id}`);
        chain.counterOffers.push(reply);
        current = reply;
        
        // Update chain status
        const approval = events.find(e => 
          e.kind === NOSTR_KIND_APPROVAL && 
          e.tags.some(t => t[0] === 'e' && t[1] === current.id)
        );
        
        if (approval) {
          const status = approval.tags.find(t => t[0] === 'status')?.[1];
          chain.status = status || 'pending';
          console.log(`Found approval for ${current.id} with status: ${chain.status}`);
        }
        
        // Update current actor
        chain.currentActor = current.pubkey === this.manager?.publicKey ? 'dev' : 'io';
      }

      // Check for contract
      const hasContract = events.some(e => 
        e.kind === NOSTR_KIND_CONTRACT && 
        e.tags.some(t => t[0] === 'e' && t[1] === chain.id)
      );
      
      if (hasContract) {
        chain.status = 'contracted';
        console.log(`Found contract for chain: ${chain.id}`);
      }

      console.log(`Chain ${chain.id}:`, {
        initialOffer: chain.initialOffer.id,
        counterOffers: chain.counterOffers.map(o => o.id),
        status: chain.status,
        currentActor: chain.currentActor
      });

      return chain;
    });

    console.log('Built chains:', chains.length);
    return chains;
  }

  /**
   * Filtert Jobs nach ihrem Status
   * @private
   */
  filterJobsByScope(jobsWithHistory, scope) {
    const { getPending = true, getAdvertised = true, getSigned = true } = scope;

    return jobsWithHistory.filter(({ history }) => {
      const hasContract = history.some(e => e.kind === NOSTR_KIND_CONTRACT);
      const hasApproval = history.some(e => 
        e.kind === NOSTR_KIND_APPROVAL && 
        e.tags.find(t => t[0] === 'status')?.[1] === 'approved'
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
   */
  async subscribeToJobActivity(jobId) {
    this.ensureInitialized();
    
    return this.manager.subscribeToEvents({
      kinds: [NOSTR_KIND_JOB, NOSTR_KIND_OFFER, NOSTR_KIND_APPROVAL, NOSTR_KIND_CONTRACT],
      "#e": [jobId]
    });
  }

  /**
   * Abonniert Jobs für eine bestimmte Idea
   * @param {string} ideaId - ID der Idea
   */
  async subscribeToJobsByIdea(ideaId) {
    this.ensureInitialized();

    return this.manager.subscribeToEvents({
      kinds: [NOSTR_KIND_JOB],
      "#e": [ideaId]
    });
  }
}

const communityJobManager = new CommunityJobManager();
export { communityJobManager }; 