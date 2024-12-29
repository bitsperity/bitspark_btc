<script>
  import { nostrCache } from '../../backend/NostrCacheStore.js';
  import { communityJobManager } from '../../backend/CommunityJobManager.js';
  import { socialMediaManager } from '../../backend/SocialMediaManager.js';
  import ProfileImg from '../ProfileImg.svelte';
  import { writable } from 'svelte/store';

  let jobApplications = [];
  let profiles = writable(new Map());

  async function fetchApplications() {
    jobApplications = await communityJobManager.getMyJobApplications();
    
    // Profile für alle Developer laden
    const developers = jobApplications
      .flatMap(job => job.applications)
      .map(app => app.pubkey);
    
    await fetchProfiles(developers);
  }

  async function fetchProfiles(pubkeys) {
    const profilePromises = pubkeys.map(async (pubkey) => {
      let profile = await socialMediaManager.getProfile(pubkey);
      return { pubkey, profile };
    });

    const results = await Promise.all(profilePromises);
    profiles.update((map) => {
      results.forEach(({ pubkey, profile }) => {
        if (profile) {
          map.set(pubkey, profile);
        }
      });
      return map;
    });
  }

  async function handleApprove(application) {
    try {
      await communityJobManager.approveOffer('Angebot akzeptiert', application.id);
      await fetchApplications();
    } catch (error) {
      console.error('Error approving offer:', error);
    }
  }

  async function handleDecline(application) {
    try {
      await communityJobManager.declineOffer('Angebot abgelehnt', application.id);
      await fetchApplications();
    } catch (error) {
      console.error('Error declining offer:', error);
    }
  }

  // Auf Cache-Änderungen reagieren
  $: $nostrCache, fetchApplications();
</script>

<div class="single-card">
  <div class="section-header">
    <h3>Eingehende Bewerbungen</h3>
    {#if jobApplications.length > 0}
      <span class="badge">{jobApplications.length}</span>
    {/if}
  </div>

  {#if jobApplications.length > 0}
    {#each jobApplications as { job, applications }}
      <div class="job-section">
        <h4>{job.tags.find(t => t[0] === 'name')?.[1] || 'Unbenannter Job'}</h4>
        
        <div class="applications">
          {#each applications as application}
            <div class="application {application.status === 'declined' ? 'declined' : ''}">
              <div class="header">
                <div class="developer">
                  {#if $profiles.has(application.pubkey)}
                    <ProfileImg profile={$profiles.get(application.pubkey)} />
                    <span>{$profiles.get(application.pubkey).name || application.pubkey}</span>
                  {/if}
                </div>

                <div class="status">
                  {#if application.status === 'pending'}
                    <span class="badge pending">Ausstehend</span>
                  {:else if application.status === 'approved'}
                    <span class="badge approved">Akzeptiert</span>
                  {:else if application.status === 'declined'}
                    <span class="badge declined">Abgelehnt</span>
                  {/if}
                </div>
              </div>

              <div class="content">
                <p>{application.content}</p>
              </div>

              <div class="details">
                <div class="detail">
                  <span class="label">Preisvorstellung</span>
                  <span class="value">{application.bid} Sats</span>
                </div>
                <div class="detail">
                  <span class="label">Dauer</span>
                  <span class="value">{application.duration} Tage</span>
                </div>
                <div class="detail">
                  <span class="label">Startdatum</span>
                  <span class="value">{new Date(application.startDate).toLocaleDateString()}</span>
                </div>
              </div>

              {#if application.previousOffer}
                <div class="counter-offer-info">
                  <span class="label">Counter-Offer zu vorheriger Bewerbung</span>
                </div>
              {/if}

              {#if application.status === 'pending'}
                <div class="actions">
                  <button class="decline" on:click={() => handleDecline(application)}>
                    Ablehnen
                  </button>
                  <button class="approve" on:click={() => handleApprove(application)}>
                    Akzeptieren
                  </button>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/each}
  {:else}
    <div class="empty-state">
      <p>Keine Bewerbungen vorhanden</p>
    </div>
  {/if}
</div>

<style>
  .section-header {
    padding: 2rem;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .section-header h3 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
  }

  .job-section {
    padding: 2rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .job-section:last-child {
    border-bottom: none;
  }

  .job-section h4 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 1.5rem 0;
  }

  .applications {
    display: grid;
    gap: 1.5rem;
  }

  .application {
    background: white;
    border-radius: 0.75rem;
    padding: 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
  }

  .application.declined {
    border-color: #ef4444;
    background: #fef2f2;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .developer {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .developer span {
    font-weight: 500;
    color: #1f2937;
  }

  .content {
    color: #4b5563;
    line-height: 1.5;
    margin-bottom: 1.5rem;
  }

  .details {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: #f9fafb;
    border-radius: 0.5rem;
  }

  .detail {
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

  .counter-offer-info {
    margin-bottom: 1.5rem;
    padding: 0.75rem;
    background: #dbeafe;
    border-radius: 0.5rem;
    color: #1e40af;
  }

  .actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
  }

  button {
    padding: 0.5rem 1.25rem;
    border-radius: 0.5rem;
    font-weight: 500;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
  }

  button:hover {
    transform: translateY(-1px);
  }

  .approve {
    background: #059669;
    color: white;
  }

  .approve:hover {
    background: #047857;
  }

  .decline {
    background: #f3f4f6;
    color: #1f2937;
  }

  .decline:hover {
    background: #e5e7eb;
  }

  .badge {
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .badge.pending {
    background: #f3f4f6;
    color: #6b7280;
  }

  .badge.approved {
    background: #ecfdf5;
    color: #059669;
  }

  .badge.declined {
    background: #fef2f2;
    color: #ef4444;
  }

  .empty-state {
    padding: 4rem 2rem;
    text-align: center;
    color: #6b7280;
  }
</style> 