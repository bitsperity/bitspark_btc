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

  createJobEvent(name, requirements, imageUrl, page, programmingLanguage, categories, ideaId, previousJobId = null, contributorPubkeys = [], thoughts = "") {
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

    return this.createBaseEvent(NOSTR_KIND_JOB, "", tags);
  }

  createOfferEvent(message, jobId, bid, duration, startDate, termsOfAgreement) {
    const tags = [
      ["bid", bid.toString()],
      ["duration", duration],
      ["start", startDate],
      ["terms", termsOfAgreement],
      ["e", jobId]  // reference to job/offer
    ];

    return this.createBaseEvent(NOSTR_KIND_OFFER, message, tags);
  }

  createApprovalEvent(reason, eventId, status) {
    const tags = [
      ["e", eventId],  // reference to event being approved/declined
      ["status", status]  // approved or declined
    ];

    return this.createBaseEvent(NOSTR_KIND_APPROVAL, reason, tags);
  }

  createContractEvent(message, jobId, offerId, approvalId) {
    const tags = [
      ["e", jobId],     // reference to job
      ["e", offerId],   // reference to offer
      ["e", approvalId] // reference to approval
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