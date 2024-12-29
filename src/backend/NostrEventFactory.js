import {
  NOSTR_KIND_IDEA,
  NOSTR_KIND_JOB,
  NOSTR_KIND_OFFER,
  NOSTR_KIND_APPROVAL,
  NOSTR_KIND_CONTRACT,
  NOSTR_KIND_PR,
  NOSTR_KIND_REVIEW,
  NOSTR_KIND_PAYMENT,
} from '../constants/nostrKinds.js';

class NostrEventFactory {
  createBaseEvent(kind, content = "", tags = []) {
    return {
      kind,
      content,
      tags: [...tags, ["s", "bitspark"]]
    };
  }

  createIdeaEvent(name, subtitle, abstract, message, bannerUrl, githubRepo, lightningAddress, categories) {
    const tags = [
      ["iName", name],
      ["iSub", subtitle],
      ["ibUrl", bannerUrl],
      ["gitrepo", githubRepo],
      ["lnadress", lightningAddress],
      ["abstract", abstract],
      ...categories.map(cat => ["c", cat])
    ];

    return this.createBaseEvent(NOSTR_KIND_IDEA, message, tags);
  }

  createJobEvent(name, requirements, imageUrl, page, programmingLanguage, categories, ideaId, abstract, previousJobId = null, contributorPubkeys = [], thoughts = "") {
    const tags = [
      ["name", name],
      ["requirements", requirements],
      ["image", imageUrl],
      ["page", page],
      ...programmingLanguage.map(lang => ["l", lang]),
      ...categories.map(cat => ["c", cat]),
      ["e", ideaId],  // reference to idea
    ];

    // Optional tags
    if (previousJobId) {
      tags.push(["e", previousJobId]); // reference to previous job
    }
    if (contributorPubkeys.length > 0) {
      contributorPubkeys.forEach(key => tags.push(["p", key]));
    }
    if (thoughts) {
      tags.push(["thoughts", thoughts]);
    }

    return this.createBaseEvent(NOSTR_KIND_JOB, abstract, tags);
  }

  createOfferEvent(message, jobId, bid, duration, startDate, termsOfAgreement, recipientPubkey, previousOfferId = null) {
    const tags = [
      ["bid", bid.toString()],
      ["duration", duration.toString()],
      ["startDate", startDate],
      ["termsOfAgreement", termsOfAgreement],
      ["e", jobId, "", "job"],  // job reference mit marker
      ["p", recipientPubkey]    // Empfänger des Offers
    ];

    if (previousOfferId) {
      tags.push(["e", previousOfferId, "", "prev_offer"]); // previous offer mit marker
    }

    return this.createBaseEvent(NOSTR_KIND_OFFER, message, tags);
  }

  /**
   * Erstellt ein Approval Event
   * @param {string} content - Nachricht
   * @param {string} offerId - ID des Angebots
   * @param {string} status - Status (approved/declined)
   */
  async createApprovalEvent(content, offerId, status) {
    console.log('NostrEventFactory: Creating approval event:', {
      content,
      offerId,
      status,
      kind: NOSTR_KIND_APPROVAL
    });

    const tags = [
      ['e', offerId, '', 'offer'],
      ['status', status]
    ];

    console.log('Approval event tags:', tags);

    return {
      kind: NOSTR_KIND_APPROVAL,
      content,
      tags
    };
  }

  createContractEvent(message, jobId, offerId, approvalId) {
    const tags = [
      ["e", jobId, "", "job"],     // reference to job
      ["e", offerId, "", "offer"],   // reference to offer
      ["e", approvalId, "", "approval"] // reference to approval
    ];

    return this.createBaseEvent(NOSTR_KIND_CONTRACT, message, tags);
  }

  createPullRequestEvent(message, jobId, prUrl, lnAddress) {
    const tags = [
      ["url", prUrl],
      ["ln", lnAddress],
      ["e", jobId]  // reference to job
    ];

    return this.createBaseEvent(NOSTR_KIND_PR, message, tags);
  }

  createZapEvent(reason, eventId, status) {
    const tags = [
      ["e", eventId],  // reference to event being zapped
      ["status", status]  // approved or declined
    ];

    return this.createBaseEvent(NOSTR_KIND_PAYMENT, reason, tags);
  }

  createReviewEvent(reason, eventId, status, rating) {
    const tags = [
      ["e", eventId],  // reference to event being reviewed
      ["status", status],  // approved or declined
      ["rating", rating.toString()]
    ];

    return this.createBaseEvent(NOSTR_KIND_REVIEW, reason, tags);
  }
}

const nostrEventFactory = new NostrEventFactory();
export { nostrEventFactory }; 