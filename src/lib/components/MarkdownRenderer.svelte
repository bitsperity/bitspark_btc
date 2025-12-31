<!--
  MarkdownRenderer - Secure markdown to HTML rendering
  
  Uses DOMPurify to sanitize output and prevent XSS.
-->
<script lang="ts">
	import { renderMarkdown } from '$lib/utils/markdown';

	interface Props {
		content: string;
		class?: string;
	}

	let { content, class: className = '' }: Props = $props();

	const html = $derived(renderMarkdown(content));
</script>

<div class="prose {className}">
	{@html html}
</div>

<style>
	.prose {
		line-height: 1.7;
		color: var(--text-secondary);
	}

	.prose :global(h1),
	.prose :global(h2),
	.prose :global(h3),
	.prose :global(h4) {
		color: var(--text-primary);
		margin-top: 1.5em;
		margin-bottom: 0.5em;
		font-weight: 600;
	}

	.prose :global(h1) { font-size: 1.75rem; }
	.prose :global(h2) { font-size: 1.5rem; }
	.prose :global(h3) { font-size: 1.25rem; }

	.prose :global(p) {
		margin-bottom: 1em;
	}

	.prose :global(ul),
	.prose :global(ol) {
		margin-bottom: 1em;
		padding-left: 1.5em;
	}

	.prose :global(li) {
		margin-bottom: 0.25em;
	}

	.prose :global(code) {
		background: rgba(255, 255, 255, 0.05);
		padding: 0.2em 0.4em;
		border-radius: var(--radius-sm);
		font-family: var(--font-mono);
		font-size: 0.875em;
	}

	.prose :global(pre) {
		background: rgba(0, 0, 0, 0.3);
		padding: var(--space-4);
		border-radius: var(--radius-md);
		overflow-x: auto;
		margin-bottom: 1em;
	}

	.prose :global(pre code) {
		background: none;
		padding: 0;
	}

	.prose :global(blockquote) {
		border-left: 3px solid var(--orange-500);
		padding-left: var(--space-4);
		margin: 1em 0;
		font-style: italic;
		color: var(--text-muted);
	}

	.prose :global(a) {
		color: var(--orange-400);
		text-decoration: underline;
	}

	.prose :global(a:hover) {
		color: var(--orange-300);
	}

	.prose :global(img) {
		max-width: 100%;
		height: auto;
		border-radius: var(--radius-md);
		margin: 1em 0;
	}

	.prose :global(hr) {
		border: none;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		margin: 2em 0;
	}
</style>
