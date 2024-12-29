<script>
  import { writable } from 'svelte/store';
  import { nostrCache } from '../../backend/NostrCacheStore.js';
  import { developerManager } from '../../backend/DeveloperManager.js';
  import ProfileImg from '../ProfileImg.svelte';
  import ApplicationModal from '../Modals/ApplicationModal.svelte';
  import {
    NOSTR_KIND_JOB,
    NOSTR_KIND_OFFER,
    NOSTR_KIND_APPROVAL,
    NOSTR_KIND_CONTRACT
  } from '../../constants/nostrKinds.js';
  import { communityJobManager } from '../../backend/CommunityJobManager.js';
  import { socialMediaManager } from '../../backend/SocialMediaManager.js';

  export let ideaId;
  let applications = [];
  let showApplicationModal = false;
  let selectedApplication = null;
  let profiles = writable(new Map()); // Als Svelte Store

  async function fetchProfiles(pubkeys) {
    console.log('Fetching profiles for:', pubkeys);
    const profilePromises = pubkeys.map(async (pubkey) => {
      let profile = await socialMediaManager.getProfile(pubkey);
      if (!profile) {
        socialMediaManager.subscribeProfile(pubkey);
      }
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
        console.log('Searching applications for job:', jobEvent.id);
        const jobApplications = await $nostrCache.getEventsByCriteria({
          kinds: [NOSTR_KIND_OFFER],
          tags: {
            'e': { value: jobEvent.id, marker: 'job' }
          }
        });

        console.log(`Found applications for job ${jobEvent.id}:`, jobApplications);

        // Für jede Bewerbung die Details aufbereiten
        return Promise.all(
          jobApplications.map(async application => {
            console.log('Processing application:', application);
            
            // Subscribe to approval events for this offer
            await communityJobManager.subscribeToOfferActivity(application.id);
            
            // Status vom CommunityJobManager holen
            const { status, approvalEvent } = await communityJobManager.getOfferStatus(application.id);

            return {
              id: application.id,
              content: application.content,
              bid: parseInt(application.tags.find(t => t[0] === 'bid')?.[1] || '0'),
              duration: parseInt(application.tags.find(t => t[0] === 'duration')?.[1] || '0'),
              startDate: application.tags.find(t => t[0] === 'startDate')?.[1],
              termsOfAgreement: application.tags.find(t => t[0] === 'termsOfAgreement')?.[1],
              created_at: application.created_at,
              pubkey: application.pubkey,
              jobId: jobEvent.id,
              status,
              approvalEvent,
              hasApproval: status === 'approved'
            };
          })
        );
      })
    );

    // Alle Bewerbungen in eine flache Liste bringen und null-Werte filtern
    applications = allApplications
      .flat()
      .filter(Boolean);

    console.log('Final applications:', applications);

    // Profile für alle Bewerber laden
    await fetchProfiles(applications.map(app => app.pubkey));
  }

  async function handleDecline(application) {
    try {
      console.log('Declining application:', {
        id: application.id,
        application
      });
      
      // Nutze communityJobManager statt developerManager
      await communityJobManager.declineOffer('Angebot abgelehnt', application.id);
      console.log('Decline event published successfully');
      
      await fetchApplications();
    } catch (error) {
      console.error('Error declining offer:', error);
    }
  }

  async function handleCounterOffer(application) {
    console.log('Creating counter offer for application:', {
      id: application.id,
      application
    });
    selectedApplication = {
      ...application,
      previousOfferId: application.id
    };
    showApplicationModal = true;
  }

  function handleModalClose() {
    showApplicationModal = false;
    selectedApplication = null;
  }

  function handleModalSuccess() {
    showApplicationModal = false;
    selectedApplication = null;
    fetchApplications();
  }

  async function handleCreateContract(application) {
    try {
      // Hier müssen wir das letzte Approval finden
      const approvals = await $nostrCache.getEventsByCriteria({
        kinds: [NOSTR_KIND_APPROVAL],
        tags: {
          'e': { value: application.id }
        }
      });
      
      const latestApproval = approvals.sort((a, b) => b.created_at - a.created_at)[0];
      
      if (!latestApproval) {
        console.error('No approval found for application');
        return;
      }

      await developerManager.createContract(
        'Vertrag erstellt',
        application.jobId,
        application.id,
        latestApproval.id
      );
      
      await fetchApplications();
    } catch (error) {
      console.error('Error creating contract:', error);
    }
  }

  // Auf Cache-Änderungen reagieren
  $: $nostrCache, fetchApplications();

  $: {
    if (ideaId) {
      fetchApplications();
    }
  }
</script>

<section class="section">
  <div class="section-header">
    <h3>Bewerbungen</h3>
    {#if applications.length > 0}
      <span class="badge">{applications.length}</span>
    {/if}
  </div>

  {#if applications.length > 0}
    <div class="applications">
      <h3>Bewerbungen</h3>
      {#each applications as application}
        <div class="application {application.status === 'declined' ? 'declined-offer' : ''}">
          <div class="header">
            <div class="developer">
              {#if $profiles.has(application.pubkey)}
                <ProfileImg profile={$profiles.get(application.pubkey)} />
              {/if}
              <div class="developer-info">
                <h4>{$profiles.get(application.pubkey)?.name || application.pubkey}</h4>
                {#if $profiles.get(application.pubkey)?.about}
                  <p class="about">{$profiles.get(application.pubkey).about}</p>
                {/if}
              </div>
            </div>
            <div class="status">
              {#if application.status === 'pending'}
                <span class="badge pending">Ausstehend</span>
              {:else if application.status === 'approved'}
                <span class="badge approved">Akzeptiert</span>
              {:else if application.status === 'declined'}
                <span class="badge declined">Abgelehnt vom IO</span>
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

          <div class="terms">
            <span class="label">Bedingungen</span>
            <p>{application.termsOfAgreement}</p>
          </div>

          {#if application.status === 'pending'}
            <div class="actions">
              <button class="decline" on:click={() => handleDecline(application)}>
                Ablehnen
              </button>
              <button class="counter" on:click={() => handleCounterOffer(application)}>
                Gegenangebot
              </button>
              {#if application.hasApproval}
                <button class="accept" on:click={() => handleCreateContract(application)}>
                  Vertrag erstellen
                </button>
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {:else}
    <p class="no-applications">Keine Bewerbungen vorhanden</p>
  {/if}
</section>

{#if showApplicationModal && selectedApplication}
  <ApplicationModal
    jobId={selectedApplication.jobId}
    mode="counter"
    existingApplication={selectedApplication}
    on:close={handleModalClose}
    on:success={handleModalSuccess}
  />
{/if}

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

  .applications {
    margin-top: 2rem;
  }

  .application {
    background: var(--surface-2);
    padding: 1.5rem;
    border-radius: 8px;
    margin-bottom: 1rem;
    border: 2px solid transparent;
    transition: all 0.2s ease;
  }

  .declined-offer {
    border-color: #ef4444;
    background: #fef2f2;
  }

  .developer-info {
    display: flex;
    align-items: center;
    margin-bottom: 1rem;
  }

  .developer-image {
    width: 50px;
    height: 50px;
    border-radius: 25px;
    margin-right: 1rem;
  }

  .developer-details h4 {
    margin: 0;
    color: var(--text-1);
  }

  .about {
    margin: 0.5rem 0;
    color: var(--text-2);
    font-size: 0.9rem;
  }

  .content {
    margin: 1rem 0;
    color: var(--text-1);
  }

  .details {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin: 1rem 0;
  }

  .detail {
    display: flex;
    flex-direction: column;
  }

  .detail strong {
    color: var(--text-2);
    font-size: 0.9rem;
    margin-bottom: 0.25rem;
  }

  .actions {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
  }

  button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
  }

  .decline {
    background: var(--surface-3);
    color: var(--text-1);
  }

  .accept {
    background: var(--accent);
    color: white;
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
</style> 