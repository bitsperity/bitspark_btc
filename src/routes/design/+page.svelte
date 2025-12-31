<script lang="ts">
	// Import all components from the component library
	import { 
		Button, 
		Card, 
		Badge, 
		Avatar, 
		Input, 
		Textarea,
		Select,
		Toggle,
		Navbar,
		Stack,
		Row,
		Container,
		AuroraBackground,
		Modal,
		Tabs,
		Skeleton,
		Spinner,
		Tooltip
	} from '$lib/components';

	// Import icons from Lucide
	import { 
		Lightbulb, 
		Briefcase, 
		User, 
		MessageCircle, 
		Home, 
		Zap, 
		Github, 
		Check, 
		Clock, 
		Star, 
		Search, 
		Bell, 
		Menu, 
		Wallet,
		Info
	} from 'lucide-svelte';

	// State for interactive demos
	let modalOpen = $state(false);
	let activeTab = $state('buttons');
	let selectValue = $state('');
	let toggleChecked = $state(false);
	let inputValue = $state('');

	const tabItems = [
		{ id: 'buttons', label: 'Buttons' },
		{ id: 'forms', label: 'Forms' },
		{ id: 'feedback', label: 'Feedback' },
		{ id: 'overlay', label: 'Overlays' }
	];

	const selectOptions = [
		{ value: 'dev', label: 'Development' },
		{ value: 'design', label: 'Design' },
		{ value: 'marketing', label: 'Marketing' }
	];
</script>

<!-- Global Aurora Background -->
<AuroraBackground />

<!-- Navigation -->
<nav class="navbar">
	<div class="navbar-content">
		<a href="/" class="nav-item">
			<Home class="nav-item-icon" size={20} strokeWidth={2} />
			<span class="nav-item-label">Home</span>
		</a>
		<a href="/ideas" class="nav-item">
			<Lightbulb class="nav-item-icon" size={20} strokeWidth={2} />
			<span class="nav-item-label">Ideas</span>
		</a>
		<a href="/jobs" class="nav-item">
			<Briefcase class="nav-item-icon" size={20} strokeWidth={2} />
			<span class="nav-item-label">Jobs</span>
		</a>
		<a href="/messages" class="nav-item">
			<MessageCircle class="nav-item-icon" size={20} strokeWidth={2} />
			<span class="nav-item-label">Messages</span>
		</a>
		<a href="/design" class="nav-item active">
			<Star class="nav-item-icon" size={20} strokeWidth={2} />
			<span class="nav-item-label">Design</span>
		</a>
	</div>
</nav>

<main class="pb-navbar">
	<!-- Header -->
	<section class="header">
		<Container>
			<Stack gap={4}>
				<Badge variant="gold">
					<Zap size={12} />
					Design System
				</Badge>
				<h1 class="text-display-lg">Component Library</h1>
				<p class="text-body">18 components for building BitSpark interfaces.</p>
			</Stack>
		</Container>
	</section>

	<!-- Tabs Navigation -->
	<section class="section">
		<Container>
			<Tabs items={tabItems} bind:active={activeTab} />
		</Container>
	</section>

	<!-- Tab Content -->
	<section class="section">
		<Container>
			{#if activeTab === 'buttons'}
				<Stack gap={6}>
					<h2 class="text-display-md">Buttons & Cards</h2>
					
					<!-- Buttons -->
					<Card>
						<Stack gap={6}>
							<Stack gap={3}>
								<span class="label">Button Variants</span>
								<Row gap={4} wrap>
									<Button variant="primary">
										<Zap size={16} />
										<span>Primary</span>
									</Button>
									<Button variant="glass">
										<Search size={16} />
										<span>Glass</span>
									</Button>
									<Button variant="ghost">
										<Star size={16} />
										<span>Ghost</span>
									</Button>
								</Row>
							</Stack>

							<Stack gap={3}>
								<span class="label">Sizes</span>
								<Row gap={4} align="end">
									<Button variant="primary" size="sm">Small</Button>
									<Button variant="primary">Default</Button>
									<Button variant="primary" size="lg">Large</Button>
								</Row>
							</Stack>

							<Stack gap={3}>
								<span class="label">Icon Buttons</span>
								<Row gap={4}>
									<Button variant="ghost" icon>
										<Bell size={18} />
									</Button>
									<Button variant="ghost" icon>
										<Menu size={18} />
									</Button>
									<Tooltip text="More info">
										<Button variant="ghost" icon>
											<Info size={18} />
										</Button>
									</Tooltip>
								</Row>
							</Stack>
						</Stack>
					</Card>

					<!-- Cards -->
					<Stack gap={4}>
						<span class="label">Card Variants</span>
						<div class="grid grid-2">
							<Card>
								<Stack gap={3}>
									<h3 class="text-heading">Default Card</h3>
									<p class="text-small">Standard glass card with backdrop blur.</p>
								</Stack>
							</Card>
							<Card variant="glow">
								<Stack gap={3}>
									<h3 class="text-heading">Glow Card</h3>
									<p class="text-small">Hover to see animated gradient border.</p>
								</Stack>
							</Card>
						</div>
					</Stack>

					<!-- Badges -->
					<Card>
						<Stack gap={3}>
							<span class="label">Badges</span>
							<Row gap={3} wrap>
								<Badge variant="primary">
									<Lightbulb size={10} />
									Primary
								</Badge>
								<Badge variant="gold">
									<Briefcase size={10} />
									Gold
								</Badge>
								<Badge variant="success">
									<Check size={10} />
									Success
								</Badge>
								<Badge variant="error">
									<Clock size={10} />
									Error
								</Badge>
								<Badge>Default</Badge>
							</Row>
						</Stack>
					</Card>

					<!-- Avatars -->
					<Card>
						<Stack gap={3}>
							<span class="label">Avatars</span>
							<Row gap={4}>
								<Avatar fallback="SM" size="sm" />
								<Avatar fallback="MD" />
								<Avatar fallback="LG" size="lg" />
								<Avatar fallback="XL" size="xl" />
							</Row>
						</Stack>
					</Card>
				</Stack>

			{:else if activeTab === 'forms'}
				<Stack gap={6}>
					<h2 class="text-display-md">Form Elements</h2>
					
					<Card>
						<div class="grid grid-2">
							<Stack gap={4}>
								<Input 
									label="Text Input" 
									placeholder="Enter text..." 
									bind:value={inputValue}
								/>
								<Input 
									label="With Error" 
									value="Invalid" 
									error="This field has an error"
								/>
								<Select 
									label="Select" 
									options={selectOptions}
									placeholder="Choose category..."
									bind:value={selectValue}
								/>
							</Stack>
							<Stack gap={4}>
								<Textarea 
									label="Textarea" 
									placeholder="Enter description..."
									rows={4}
								/>
								<Toggle 
									label="Enable notifications" 
									bind:checked={toggleChecked}
								/>
								<div class="text-small">
									Toggle is: {toggleChecked ? 'ON' : 'OFF'}
								</div>
							</Stack>
						</div>
					</Card>
				</Stack>

			{:else if activeTab === 'feedback'}
				<Stack gap={6}>
					<h2 class="text-display-md">Feedback</h2>
					
					<Card>
						<Stack gap={6}>
							<Stack gap={3}>
								<span class="label">Spinner</span>
								<Row gap={6}>
									<Stack gap={2} class="center">
										<Spinner size="sm" />
										<span class="text-small">Small</span>
									</Stack>
									<Stack gap={2} class="center">
										<Spinner />
										<span class="text-small">Default</span>
									</Stack>
									<Stack gap={2} class="center">
										<Spinner size="lg" />
										<span class="text-small">Large</span>
									</Stack>
								</Row>
							</Stack>

							<Stack gap={3}>
								<span class="label">Skeleton Loading</span>
								<Stack gap={2}>
									<Skeleton height="1.5rem" width="60%" />
									<Skeleton height="1rem" />
									<Skeleton height="1rem" width="80%" />
								</Stack>
							</Stack>

							<Stack gap={3}>
								<span class="label">Skeleton Avatar</span>
								<Row gap={4}>
									<Skeleton circle size="48px" />
									<Stack gap={2}>
										<Skeleton height="1rem" width="120px" />
										<Skeleton height="0.75rem" width="80px" />
									</Stack>
								</Row>
							</Stack>
						</Stack>
					</Card>
				</Stack>

			{:else if activeTab === 'overlay'}
				<Stack gap={6}>
					<h2 class="text-display-md">Overlays</h2>
					
					<Card>
						<Stack gap={6}>
							<Stack gap={3}>
								<span class="label">Modal</span>
								<Button variant="primary" onclick={() => modalOpen = true}>
									Open Modal
								</Button>
							</Stack>

							<Stack gap={3}>
								<span class="label">Tooltips</span>
								<Row gap={4}>
									<Tooltip text="Top tooltip" position="top">
										<Button variant="ghost">Top</Button>
									</Tooltip>
									<Tooltip text="Bottom tooltip" position="bottom">
										<Button variant="ghost">Bottom</Button>
									</Tooltip>
									<Tooltip text="Left tooltip" position="left">
										<Button variant="ghost">Left</Button>
									</Tooltip>
									<Tooltip text="Right tooltip" position="right">
										<Button variant="ghost">Right</Button>
									</Tooltip>
								</Row>
							</Stack>
						</Stack>
					</Card>
				</Stack>
			{/if}
		</Container>
	</section>

	<!-- Footer -->
	<footer class="footer">
		<Container>
			<p class="text-small">BitSpark Design System | 18 Components</p>
		</Container>
	</footer>
</main>

<!-- Modal -->
<Modal bind:open={modalOpen} title="Example Modal">
	<Stack gap={4}>
		<p class="text-body">This is a modal dialog with backdrop blur and keyboard support.</p>
		<Input label="Your Name" placeholder="Enter your name..." />
	</Stack>
	{#snippet footer()}
		<Button variant="ghost" onclick={() => modalOpen = false}>Cancel</Button>
		<Button variant="primary" onclick={() => modalOpen = false}>Confirm</Button>
	{/snippet}
</Modal>

<style>
	.header {
		padding: var(--space-16) 0 var(--space-8);
	}

	.section {
		padding: var(--space-6) 0;
	}

	.footer {
		padding: var(--space-8) 0;
		text-align: center;
		border-top: 1px solid rgba(255, 255, 255, 0.05);
		margin-top: var(--space-8);
	}

	:global(.center) {
		align-items: center;
	}

	@media (max-width: 768px) {
		.header {
			padding: var(--space-8) 0 var(--space-4);
		}
	}
</style>
