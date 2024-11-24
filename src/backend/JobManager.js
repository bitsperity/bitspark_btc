import { nostrManager } from "./NostrManagerStore.js";
import { nostrCache } from "./NostrCacheStore.js";
import { nip44 } from 'nostr-tools';

const KINDS = {
  JOB: 30000,           // Public job posting
  APPROVAL: 30001,      // Generic approval/decline event
  APPLICATION: 30002,   // Wrapped anonymous application
  PAYMENT: 30003,       // Wrapped anonymous payment
  PR: 30004            // Public pull request
};

class JobManager {
  constructor() {
    this.init();
  }

  init() {
    this.cacheSubscription = this.subscribeToStore(nostrCache, (value) => {
      this.cache = value;
    });

    this.managerSubscription = this.subscribeToStore(nostrManager, (value) => {
      this.manager = value;
    });
  }

  subscribeToStore(store, updateFunction) {
    const unsubscribe = store.subscribe(updateFunction);
    return unsubscribe;
  }

  async wrapEvent(innerEvent, receiverPubKey) {
    const anonPrivateKey = window.NostrTools.generateSecretKey();
    const anonPublicKey = window.NostrTools.getPublicKey(anonPrivateKey);

    const sealContent = await window.nostr.nip44.encrypt(receiverPubKey, JSON.stringify(innerEvent));
    let seal = {
      created_at: Math.floor(Date.now() / 1000),
      kind: innerEvent.kind,
      tags: [],
      content: sealContent,
    };
    seal = await window.nostr.signEvent(seal);

    const conversationKey = nip44.getConversationKey(anonPrivateKey, receiverPubKey);
    const wrappedContent = await nip44.encrypt(JSON.stringify(seal), conversationKey);
    
    return {
      content: wrappedContent,
      anonPrivateKey,
      anonPublicKey
    };
  }

  // Job Creation & Management
  async createJob(ideaId, jobData) {
    if (!this.manager?.publicKey) return;

    const tags = [
      ["e", ideaId],
      ["title", jobData.title],
      ["abstract", jobData.abstract],
      ["description", jobData.description],
      ["requirements", jobData.requirements],
      ...jobData.languages.map(lang => ["l", lang]),
      ...jobData.categories.map(cat => ["c", cat]),
      ["s", "bitspark"]
    ];

    try {
      const result = await this.manager.sendEvent(KINDS.JOB, "", tags);
      console.log('Job created:', result);
      return result;
    } catch (error) {
      console.error('Error creating job:', error);
    }
  }

  // Application Handling
  async submitApplication(jobId, applicationData, receiverPubKey) {
    if (!this.manager?.publicKey) return;

    const applicationEvent = {
      kind: KINDS.APPLICATION,
      created_at: Math.floor(Date.now() / 1000),
      content: JSON.stringify({
        bid: applicationData.bid,
        timeEstimate: applicationData.timeEstimate,
        message: applicationData.message,
        portfolio: applicationData.portfolio,
        jobId: jobId
      }),
      tags: []
    };

    const { content, anonPrivateKey, anonPublicKey } = await this.wrapEvent(
      applicationEvent,
      receiverPubKey
    );

    await this.manager.sendAnonEvent(
      KINDS.APPLICATION, 
      content, 
      [["p", receiverPubKey]],
      anonPrivateKey, 
      anonPublicKey
    );
  }

  // Generic Approval/Decline Handler
  async handleApproval(targetEventId, ideaId, isApproved, reason = "") {
    console.log('Starting approval process...', { targetEventId, ideaId, isApproved, reason });

    if (!this.manager?.publicKey) {
      console.error('No public key available - user not logged in');
      return;
    }

    try {
      // Prüfe ob der aktuelle User der Idea-Creator ist
      const ideaCreatorPubkey = await this.getIdeaCreatorPubkey(ideaId);
      console.log('Idea creator pubkey:', ideaCreatorPubkey);
      console.log('Current user pubkey:', this.manager.publicKey);

      if (this.manager.publicKey !== ideaCreatorPubkey) {
        console.error('Permission denied: Current user is not the idea creator');
      }

      const tags = [
        ["e", targetEventId],
        ["status", isApproved ? "approved" : "declined"],
        ["s", "bitspark"]  // Wichtig: s-Tag nicht vergessen!
      ];
      if (reason) tags.push(["reason", reason]);

      console.log('Sending approval event with tags:', tags);
      const result = await this.manager.sendEvent(KINDS.APPROVAL, "", tags);
      console.log('Approval event sent successfully:', result);
      return result;

    } catch (error) {
      console.error('Error in handleApproval:', error);
    }
  }

  // Pull Request Handling
  async submitPR(jobId, prData) {
    if (!this.manager?.publicKey) return;
    
    const tags = [
      ["e", jobId],
      ["url", prData.url],
      ["commit", prData.commitHash]
    ];

    await this.manager.sendEvent(KINDS.PR, prData.description || "", tags);
  }

  // Payment Handling
  async sendPayment(prId, paymentData, receiverPubKey) {
    if (!this.manager?.publicKey) return;

    const paymentEvent = {
      kind: KINDS.PAYMENT,
      created_at: Math.floor(Date.now() / 1000),
      content: JSON.stringify({
        amount: paymentData.amount,
        message: paymentData.message
      }),
      tags: [["e", prId]]
    };

    const { content, anonPrivateKey, anonPublicKey } = await this.wrapEvent(
      paymentEvent,
      receiverPubKey
    );

    await this.manager.sendAnonEvent(
      KINDS.PAYMENT, 
      content, 
      [["e", prId], ["p", receiverPubKey]], 
      anonPrivateKey, 
      anonPublicKey
    );
  }

  // Query Methods
  async getJobsByIdea(ideaId) {
    const events = await this.cache.getEventsByCriteria({
      kinds: [KINDS.JOB],
      tags: { e: [ideaId] }
    });

    return events
      .filter(event => event.tags.find(t => t[0] === "s" && t[1] === "bitspark"))
      .map(event => {
        const tags = event.tags.reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {});

        return {
          id: event.id,
          pubkey: event.pubkey,
          title: tags.title || "No Title",
          abstract: tags.abstract || "No Abstract",
          description: tags.description || "No Description",
          requirements: tags.requirements || "No Requirements",
          languages: event.tags.filter(t => t[0] === "l").map(t => t[1]),
          categories: event.tags.filter(t => t[0] === "c").map(t => t[1]),
          created_at: event.created_at
        };
      })
      .sort((a, b) => b.created_at - a.created_at);
  }

  async getApplicationsForJob(jobId) {
    return this.cache.getEventsByCriteria({
      kinds: [KINDS.APPLICATION],
      tags: { e: [jobId] }
    });
  }

  async getPRsForJob(jobId) {
    return this.cache.getEventsByCriteria({
      kinds: [KINDS.PR],
      tags: { e: [jobId] }
    });
  }

  cleanup() {
    this.cacheSubscription();
    this.managerSubscription();
  }

  // Status Checking Method
  async getApprovalStatus(eventId, creatorPubkey) {
    console.log('Checking approval status for:', { eventId, creatorPubkey });

    const approvals = await this.cache.getEventsByCriteria({
      kinds: [KINDS.APPROVAL],
      tags: { e: [eventId] }
    });

    console.log('Found approval events:', approvals);

    // Filtere nach bitspark approvals
    const bitsparkApprovals = approvals.filter(event => 
      event.tags.find(t => t[0] === "s" && t[1] === "bitspark")
    );
    console.log('Filtered bitspark approvals:', bitsparkApprovals);

    // Debug: Prüfe die Pubkeys
    bitsparkApprovals.forEach((approval, index) => {
      console.log(`Approval ${index} pubkey:`, approval.pubkey);
      console.log(`Matches creator pubkey:`, approval.pubkey === creatorPubkey);
      console.log(`Types:`, {
        approvalPubkeyType: typeof approval.pubkey,
        creatorPubkeyType: typeof creatorPubkey
      });
    });

    const creatorApprovals = bitsparkApprovals
      .filter(approval => {
        const matches = approval.pubkey === creatorPubkey;
        console.log(`Filtering approval ${approval.id}:`, {
          approvalPubkey: approval.pubkey,
          creatorPubkey,
          matches
        });
        return matches;
      })
      .sort((a, b) => b.created_at - a.created_at);
    
    console.log('Creator approvals:', creatorApprovals);

    if (creatorApprovals.length === 0) {
      console.log('No creator approvals found, returning pending');
      return "pending";
    }

    // Nehme das neueste Approval vom Creator
    const latestApproval = creatorApprovals[0];
    const status = latestApproval.tags.find(t => t[0] === "status")?.[1] || "pending";
    console.log('Latest approval status:', status);
    return status;
  }

  // Job Fetching & Transformation
  async getJobById(jobId) {
    const jobEvent = await this.cache.getEventById(jobId);
    if (!jobEvent) return null;

    const tags = jobEvent.tags.reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});

    return {
      id: jobEvent.id,
      pubkey: jobEvent.pubkey,
      title: tags.title || "No Title",
      abstract: tags.abstract || "No Abstract",
      description: tags.description || "No Description",
      requirements: tags.requirements || "No Requirements",
      languages: jobEvent.tags.filter(t => t[0] === "l").map(t => t[1]),
      categories: jobEvent.tags.filter(t => t[0] === "c").map(t => t[1]),
      created_at: jobEvent.created_at
    };
  }

  // Job Deletion
  async deleteJob(jobId) {
    if (!this.manager?.publicKey) return;
    return await this.manager.deleteEvent(jobId);
  }

  // Subscription
  async subscribeToJob(ideaId) {
    if (!this.manager) return;
    
    // Subscribe zu allen Jobs dieser Idea
    this.manager.subscribeToEvents({
      kinds: [KINDS.JOB],
      "#e": [ideaId]
    });

    // Subscribe zu allen Approvals dieser Idea
    this.manager.subscribeToEvents({
      kinds: [KINDS.APPROVAL],
      "#s": ["bitspark"]
    });

    console.log(`Subscribed to jobs and approvals for ideaId: ${ideaId}`);
  }

  async getApprovedJobsByIdea(ideaId) {
    const jobs = await this.getJobsByIdea(ideaId);
    console.log('Found jobs for idea:', jobs);

    const ideaCreatorPubkey = await this.getIdeaCreatorPubkey(ideaId);
    console.log('Idea creator pubkey:', ideaCreatorPubkey);
    
    const approvedJobs = await Promise.all(
      jobs.map(async (job) => {
        const status = await this.getApprovalStatus(job.id, ideaCreatorPubkey);
        console.log(`Job ${job.id} status:`, status);
        return status === "approved" ? job : null;
      })
    );
    
    const filteredJobs = approvedJobs.filter(job => job !== null);
    console.log('Final approved jobs:', filteredJobs);
    
    return filteredJobs;
  }

  async getIdeaCreatorPubkey(ideaId) {
    console.log('Fetching idea creator pubkey for:', ideaId);
    const ideaEvent = await this.cache.getEventById(ideaId);
    
    if (!ideaEvent) {
      console.log('Idea not found:', ideaId);
      return null;
    }
    
    console.log('Found idea event:', ideaEvent);
    return ideaEvent.pubkey;
  }
}

const jobManager = new JobManager();
export { jobManager, KINDS };