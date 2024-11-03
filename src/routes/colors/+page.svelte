<script lang="ts">
	import { cn } from '$lib/utils';

	let colors: string[] = [
		'bg-muted',
		'bg-foreground',
		'bg-muted-foreground',
		'bg-primary',
		'bg-primary-foreground',
		'bg-secondary',
		'bg-secondary-foreground',
		'bg-destructive',
		'bg-destructive-foreground'
	];
</script>

<div class="w-full">
	<div class="grid grid-cols-4 gap-4">
		{#each colors as color}
			<div class="prose w-full">
				<h3 class="text-center text-foreground">{color}</h3>
				<div class={`mx-auto h-32 w-32 ${color}`}></div>
			</div>
		{/each}
	</div>
	<div
		class="mx-auto flex h-20 w-96 items-center justify-center rounded-2xl rounded-b-none border bg-primary"
	>
		Hi
	</div>
</div>
