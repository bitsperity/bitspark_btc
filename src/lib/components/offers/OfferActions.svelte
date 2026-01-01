<!--
  OfferActions - Accept/Decline/Counter buttons
  
  Flow:
  1. Dev sends initial offer → IO
  2. IO sends counter (or same terms) → Dev  
  3. Dev accepts counter → IO
  4. IO creates contract
  
  Rules:
  - IO can only COUNTER or DECLINE (not accept directly)
  - Dev can ACCEPT a counter-offer from IO
  - Contract is created by IO after Dev accepts
-->
<script lang="ts">
	import { offerService, authService, jobService } from '$lib/services';
	import type { Offer } from '$lib/types/offer';
	import type { Job } from '$lib/types/job';
	import { Row, Button, Spinner } from '$lib/components';
	import { Check, X, MessageSquare } from 'lucide-svelte';

	interface Props {
		offer: Offer;
		job?: Job;  // Need job to check ownership
		onaccept?: () => void;
		ondecline?: () => void;
		oncounter?: () => void;
	}

	let { offer, job, onaccept, ondecline, oncounter }: Props = $props();

	let isAccepting = $state(false);
	let isDeclining = $state(false);

	const myPubkey = $derived(authService.user?.pubkey);
	const isForMe = $derived(myPubkey === offer.recipientPubkey);
	const isPending = $derived(offer.status === 'pending');
	
	// Am I the Idea Owner (job creator)?
	const isIO = $derived(job && myPubkey === job.pubkey);
	// Am I the Developer (not the job creator)?
	const isDev = $derived(job && myPubkey !== job.pubkey);
	
	// Was this offer sent by the IO? (counter-offer from IO)
	const isFromIO = $derived(job && offer.pubkey === job.pubkey);
	
	// IO can only counter or decline - never accept directly
	const canIOCounter = $derived(isIO && isForMe && isPending && !isFromIO);
	const canIODecline = $derived(isIO && isForMe && isPending && !isFromIO);
	
	// Dev can accept a counter-offer from IO
	const canDevAccept = $derived(isDev && isForMe && isPending && isFromIO);
	// Dev can also counter an IO's counter
	const canDevCounter = $derived(isDev && isForMe && isPending && isFromIO);
	const canDevDecline = $derived(isDev && isForMe && isPending && isFromIO);

	async function handleAccept() {
		if (!canDevAccept) return;
		
		isAccepting = true;
		try {
			await offerService.acceptOffer(offer);
			// After Dev accepts, IO will see this and create contract
			onaccept?.();
		} catch (e) {
			console.error('[OfferActions] Accept error:', e);
		} finally {
			isAccepting = false;
		}
	}

	async function handleDecline() {
		isDeclining = true;
		try {
			await offerService.declineOffer(offer);
			ondecline?.();
		} catch (e) {
			console.error('[OfferActions] Decline error:', e);
		} finally {
			isDeclining = false;
		}
	}
</script>

<!-- IO Actions: Can only Counter or Decline -->
{#if canIOCounter || canIODecline}
	<Row gap={2} class="offer-actions">
		<Button variant="primary" size="sm" onclick={oncounter}>
			<MessageSquare size={14} />
			<span>Send Counter</span>
		</Button>
		
		<Button variant="ghost" size="sm" onclick={handleDecline} disabled={isDeclining}>
			{#if isDeclining}
				<Spinner size="sm" />
			{:else}
				<X size={14} />
			{/if}
			<span>Decline</span>
		</Button>
	</Row>
{/if}

<!-- Dev Actions: Can Accept, Counter, or Decline -->
{#if canDevAccept}
	<Row gap={2} class="offer-actions">
		<Button variant="primary" size="sm" onclick={handleAccept} disabled={isAccepting}>
			{#if isAccepting}
				<Spinner size="sm" />
			{:else}
				<Check size={14} />
			{/if}
			<span>Accept</span>
		</Button>
		
		{#if canDevCounter}
			<Button variant="secondary" size="sm" onclick={oncounter}>
				<MessageSquare size={14} />
				<span>Counter</span>
			</Button>
		{/if}
		
		{#if canDevDecline}
			<Button variant="ghost" size="sm" onclick={handleDecline} disabled={isDeclining}>
				{#if isDeclining}
					<Spinner size="sm" />
				{:else}
					<X size={14} />
				{/if}
				<span>Decline</span>
			</Button>
		{/if}
	</Row>
{/if}

<style>
	:global(.offer-actions) {
		padding-top: var(--space-2);
		border-top: 1px solid rgba(255, 255, 255, 0.05);
	}
</style>
