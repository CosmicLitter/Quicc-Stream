<script lang="ts">
	import { Icons } from '$lib/components/icons';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { duels, duel_id } from '$lib/stores/stores';

	let inputValue = '';

	// console.log('count:', get(count));
	function HandleInput() {
		if (inputValue.trim() !== '') {
			AddDueller(inputValue);
		}
		inputValue = '';
	}
	function AddDueller(name: string) {
		$duels = [...$duels, { name: name, id: $duel_id }];
		$duel_id++;
	}

	function RemoveDueller(id: number) {
		$duels = $duels.filter((t) => t.id != id);
	}
</script>

<div class="flex h-full items-center justify-center">
	<div class="h-full w-96 space-y-2 overflow-y-auto border-x-2 bg-muted/50 p-4">
		<!-- <button on:click={AddDueller}> Add </button> -->
		<div class="flex items-center focus-visible:ring-0">
			<Input
				bind:value={inputValue}
				on:keydown={(event) => event.key === 'Enter' && HandleInput()}
				class="my-4 focus-visible:ring-0"
			/>
			<Button on:click={HandleInput} size="sm" class="rounded-l-none"
				><Icons.plus class="h-5 w-5" /></Button
			>
		</div>
		{#each $duels as dueller (dueller.id)}
			<div class="flex items-center justify-between rounded-lg border bg-slate-900 p-2">
				{dueller.name}
				<Button size="icon" variant="destructive" on:click={() => RemoveDueller(dueller.id)}
					><Icons.x class="w-4" /></Button
				>
			</div>
		{/each}
	</div>
</div>
