<script>
  import { onMount } from "svelte";
  import { ideaOwnerManager } from "../../backend/IdeaOwnerManager.js";
  import { nostrCache } from "../../backend/NostrCacheStore.js";
  import { NOSTR_KIND_OFFER, NOSTR_KIND_JOB } from "../../constants/nostrKinds.js";
  import JobCard from "./JobCard.svelte";

  export let ideaId;
  let applications = [];

  async function fetchApplications() {
    if (!ideaId) return;

    console.log('Fetching applications for ideaId:', ideaId);

    // Zuerst alle Jobs dieser Idea finden
    const jobEvents = await $nostrCache.getEventsByCriteria({
      kinds: [NOSTR_KIND_JOB],
      tags: {
        'e': { value: ideaId }
      }
    });

    console.log('Found job events:', jobEvents);

    // Für jeden Job die zugehörigen Bewerbungen laden
    const allApplications = await Promise.all(
      jobEvents.map(async jobEvent => {
        const jobApplications = await $nostrCache.getEventsByCriteria({
          kinds: [NOSTR_KIND_OFFER],
          tags: {
            'e': { value: jobEvent.id, marker: 'job' }
          }
        });

        console.log(`Found applications for job ${jobEvent.id}:`, jobApplications);

        // Für jede Bewerbung die Details aufbereiten
        return Promise.all(
          jobApplications.map(application => 
            transformApplication(application, jobEvent)
          )
        );
      })
    );

    // Alle Bewerbungen in eine flache Liste bringen und null-Werte filtern
    applications = allApplications
      .flat()
      .filter(Boolean);

    console.log('Final applications:', applications);
  }

  function transformApplication(applicationEvent, jobEvent) {
    const jobTags = jobEvent.tags.reduce(
      (tagObj, [key, value]) => ({ ...tagObj, [key]: value }),
      {}
    );

    const applicationTags = applicationEvent.tags.reduce(
      (tagObj, [key, value]) => ({ ...tagObj, [key]: value }),
      {}
    );

    return {
      id: applicationEvent.id,
      jobId: jobEvent.id,
      jobTitle: jobTags.name || "N/A",
      developerPubkey: applicationEvent.pubkey,
      content: applicationEvent.content,
      bid: applicationTags.bid,
      duration: applicationTags.duration,
      startDate: applicationTags.startDate,
      termsOfAgreement: applicationTags.termsOfAgreement,
      createdAt: applicationEvent.created_at
    };
  }

  async function handleAccept(applicationId) {
    try {
      await ideaOwnerManager.acceptApplication(applicationId);
      await fetchApplications(); // Liste aktualisieren
    } catch (error) {
      console.error('Error accepting application:', error);
    }
  }

  async function handleReject(applicationId) {
    try {
      await ideaOwnerManager.rejectApplication(applicationId);
      await fetchApplications(); // Liste aktualisieren
    } catch (error) {
      console.error('Error rejecting application:', error);
    }
  }

  $: if ($nostrCache && ideaId) {
    fetchApplications();
  }
</script>

<section class="section">
  <div class="section-header">
    <h3>Bewerbungen</h3>
    {#if applications.length > 0}
      <span class="badge">{applications.length}</span>
    {/if}
  </div>

  {#if applications.length === 0}
    <div class="empty-state">
      <p>Keine neuen Bewerbungen.</p>
    </div>
  {:else}
    <div class="applications-grid">
      {#each applications as application (application.id)}
        <div class="application-card">
          <div class="application-header">
            <h4>{application.jobTitle}</h4>
            <span class="developer">von: {application.developerPubkey}</span>
          </div>
          
          <div class="application-content">
            <p class="description">{application.content}</p>
            
            <div class="details">
              <div class="detail-item">
                <span class="label">Preisvorstellung:</span>
                <span class="value">{application.bid} Sats</span>
              </div>
              <div class="detail-item">
                <span class="label">Dauer:</span>
                <span class="value">{application.duration} Tage</span>
              </div>
              <div class="detail-item">
                <span class="label">Startdatum:</span>
                <span class="value">{new Date(application.startDate).toLocaleDateString()}</span>
              </div>
            </div>

            <div class="terms">
              <h5>Bedingungen:</h5>
              <p>{application.termsOfAgreement}</p>
            </div>
          </div>

          <div class="application-actions">
            <button class="reject-btn" on:click={() => handleReject(application.id)}>
              Ablehnen
            </button>
            <button class="accept-btn" on:click={() => handleAccept(application.id)}>
              Annehmen
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</section>

<style>
  .section {
    padding: 2rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .section-header h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
  }

  .badge {
    background: #f3f4f6;
    color: #6b7280;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .empty-state {
    text-align: center;
    padding: 2rem;
    color: #6b7280;
  }

  .applications-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 1.5rem;
  }

  .application-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .application-header {
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;
    background: #f9fafb;
  }

  .application-header h4 {
    font-size: 1.1rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
  }

  .developer {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .application-content {
    padding: 1rem;
  }

  .description {
    margin-bottom: 1rem;
    color: #4b5563;
  }

  .details {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
    padding: 1rem;
    background: #f9fafb;
    border-radius: 0.5rem;
  }

  .detail-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .label {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .value {
    font-weight: 500;
    color: #1f2937;
  }

  .terms {
    margin-top: 1rem;
  }

  .terms h5 {
    font-size: 1rem;
    font-weight: 500;
    color: #374151;
    margin: 0 0 0.5rem 0;
  }

  .terms p {
    color: #4b5563;
    font-size: 0.875rem;
  }

  .application-actions {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    border-top: 1px solid #e5e7eb;
    background: #f9fafb;
  }

  button {
    flex: 1;
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .reject-btn {
    background: white;
    border: 1px solid #ef4444;
    color: #ef4444;
  }

  .reject-btn:hover {
    background: #fef2f2;
  }

  .accept-btn {
    background: #2c5282;
    border: none;
    color: white;
  }

  .accept-btn:hover {
    background: #1a365d;
  }
</style> 