<script lang="ts">
	import { Icons } from '$lib/components/icons';
	import { Button } from '$lib/components/ui/button';
	import { duels, duel_id } from '$lib/stores/stores';

	function AddDueller() {
		$duels = [...$duels, { name: 'test', id: $duel_id }];
		$duel_id++;
	}

	function RemoveDueller(id: number) {
		$duels = $duels.filter((t) => t.id != id);
	}
</script>

<div class="flex h-full items-center justify-center">
	<div class="h-full w-96 border p-4">
		<!-- <button on:click={AddDueller}> Add </button> -->
		{#each $duels as dueller (dueller.id)}
			<div class="flex items-center justify-between border p-2">
				{dueller.name}
				<Button size="icon" variant="destructive" on:click={() => RemoveDueller(dueller.id)}
					><Icons.x class="w-4" /></Button
				>
			</div>
		{/each}
	</div>
</div>
