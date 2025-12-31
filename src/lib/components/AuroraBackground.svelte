<!--
  AuroraBackground Component - Animated background effect
  
  Usage:
    <AuroraBackground />
  
  Place once in root layout for global effect.
-->
<script lang="ts">
	interface Props {
		class?: string;
	}

	let { class: className = '' }: Props = $props();
</script>

<div class="aurora-bg {className}">
	<div class="aurora-secondary"></div>
</div>
