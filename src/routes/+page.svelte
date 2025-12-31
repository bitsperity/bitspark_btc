<script lang="ts">
	import { Button, Card, Badge, Stack, Row, Container, AuroraBackground } from '$lib/components';
	import { Zap, ArrowRight, Lightbulb, Briefcase, Shield, Globe } from 'lucide-svelte';
</script>

<AuroraBackground />

<main class="landing">
	<!-- Hero -->
	<section class="hero">
		<Container>
			<Stack gap={6} class="hero-content">
				<Badge variant="gold">
					<Zap size={12} />
					Built on Nostr
				</Badge>
				<h1 class="text-display-hero">BitSpark</h1>
				<p class="text-body hero-tagline">
					The decentralized freelance marketplace.<br />
					Ideas meet developers. Powered by Bitcoin.
				</p>
				<Row gap={4} wrap class="hero-actions">
					<Button variant="primary" size="lg">
						<span>Get Started</span>
						<ArrowRight size={18} />
					</Button>
					<Button variant="glass" size="lg">
						<span>Explore Ideas</span>
					</Button>
				</Row>
			</Stack>
		</Container>
	</section>

	<!-- Features -->
	<section class="features">
		<Container>
			<div class="grid grid-3">
				<Card>
					<Stack gap={4}>
						<div class="feature-icon">
							<Shield size={24} />
						</div>
						<h3 class="text-heading">Decentralized</h3>
						<p class="text-small">No middleman. Your keys, your identity. Built on the Nostr protocol.</p>
					</Stack>
				</Card>
				<Card>
					<Stack gap={4}>
						<div class="feature-icon">
							<Zap size={24} />
						</div>
						<h3 class="text-heading">Lightning Payments</h3>
						<p class="text-small">Instant, low-fee payments via Bitcoin Lightning Network.</p>
					</Stack>
				</Card>
				<Card>
					<Stack gap={4}>
						<div class="feature-icon">
							<Globe size={24} />
						</div>
						<h3 class="text-heading">Global Access</h3>
						<p class="text-small">Work with anyone, anywhere. No banks, no borders.</p>
					</Stack>
				</Card>
			</div>
		</Container>
	</section>

	<!-- CTA -->
	<section class="cta">
		<Container>
			<Card variant="glow">
				<Stack gap={6} class="cta-content">
					<Row gap={4}>
						<Badge variant="primary">
							<Lightbulb size={10} />
							For Idea Owners
						</Badge>
						<Badge variant="gold">
							<Briefcase size={10} />
							For Developers
						</Badge>
					</Row>
					<h2 class="text-display-lg">Ready to get started?</h2>
					<p class="text-body">Connect your Nostr wallet and join the decentralized economy.</p>
					<Button variant="primary" size="lg">
						<Zap size={18} />
						<span>Connect Wallet</span>
					</Button>
				</Stack>
			</Card>
		</Container>
	</section>
</main>

<style>
	.landing {
		padding-bottom: var(--space-16);
	}

	.hero {
		min-height: 70vh;
		display: flex;
		align-items: center;
		padding: var(--space-16) 0;
	}

	:global(.hero-content) {
		align-items: center;
		text-align: center;
	}

	.hero-tagline {
		max-width: 450px;
		line-height: 1.8;
	}

	.features {
		padding: var(--space-16) 0;
	}

	.feature-icon {
		width: 48px;
		height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-lg);
		background: linear-gradient(135deg, var(--orange-500), var(--gold-500));
		color: white;
	}

	.cta {
		padding: var(--space-8) 0;
	}

	:global(.cta-content) {
		align-items: center;
		text-align: center;
		padding: var(--space-8);
	}

	@media (max-width: 768px) {
		.hero {
			min-height: 60vh;
			padding: var(--space-8) 0;
		}
	}
</style>
