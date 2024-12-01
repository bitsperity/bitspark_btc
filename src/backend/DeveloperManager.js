import { nostrManager } from './NostrManagerStore.js';
import { nostrEventFactory } from './NostrEventFactory.js';
import { jobManager } from './JobManager.js';

class DeveloperManager {
  constructor() {
    this.manager = null;
    this.init();
  }

  init() {
    nostrManager.subscribe(value => {
      this.manager = value;
    });
  }

  async subscribeToAvailableJobs(scope) {
    // Implementation
  }

  async submitOffer(content, jobId, offerId, bid, startDate, duration, termsOfAgreement, pubKeys) {
    const event = await nostrEventFactory.createOfferEvent(
      content, jobId, offerId, bid, startDate, 
      duration, termsOfAgreement, pubKeys
    );
    return this.manager.sendEvent(event.kind, event.content, event.tags);
  }

  // Add other developer functions as per PLAN.md
}

const developerManager = new DeveloperManager();
export { developerManager }; 