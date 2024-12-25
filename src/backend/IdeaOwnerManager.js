import { nostrManager } from './NostrManagerStore.js';
import { nostrEventFactory } from './NostrEventFactory.js';
import { jobManager } from './JobManager.js';

class IdeaOwnerManager {
  constructor() {
    this.manager = null;
    this.init();
  }

  init() {
    nostrManager.subscribe(value => {
      this.manager = value;
    });
  }

  async subscribeToJobsByIdea(ideaId) {
    return jobManager.subscribeToJob(ideaId);
  }

  async postJob(content, ideaId, requirements, programmingLanguage, imageUrl, name, page, categories, pubKeys) {
    const event = await nostrEventFactory.createJobEvent(
      content, ideaId, requirements, programmingLanguage, 
      imageUrl, name, page, categories, pubKeys
    );
    return this.manager.sendEvent(event.kind, event.content, event.tags);
  }

  // Add other idea owner functions as per PLAN.md
}

const ideaOwnerManager = new IdeaOwnerManager();
export { ideaOwnerManager }; 