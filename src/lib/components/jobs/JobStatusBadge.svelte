<!--
  JobStatusBadge - Display job status with color
-->
<script lang="ts">
	import { Badge } from '$lib/components';
	import { JOB_STATUS_CONFIG, type JobStatus } from '$lib/types/job';

	interface Props {
		status: JobStatus;
		size?: 'sm' | 'md';
	}

	let { status, size = 'md' }: Props = $props();

	const config = $derived(JOB_STATUS_CONFIG[status]);
</script>

<Badge variant={config.color as 'success' | 'warning' | 'muted'} {size}>
	{config.label}
</Badge>
