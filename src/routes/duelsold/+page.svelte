<script lang="ts">
	import { duelList, nextDuelId } from '$lib/states/duels.svelte';
	import { Icons } from '$lib/components/icons';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';

	let inputValue = '';

	function HandleInput() {
		if (inputValue.trim() !== '') {
			AddDueller(inputValue);
		}
		inputValue = '';
	}

	function AddDueller(name: string) {
		duelList?.value.push({ username: name, id: nextDuelId!.value });
		nextDuelId!.value++;
	}

	function RemoveDueller(id: number) {
		duelList!.value = duelList!.value.filter((t) => t.id != id);
	}
</script>

<div class="flex h-full items-center justify-center">
	<div class="h-full w-96 space-y-2 overflow-y-auto border-x-2 bg-muted/50 p-4">
		<!-- <button on:click={AddDueller}> Add </button> -->
		<div class="flex items-center focus-visible:ring-0">
			<Input
				bind:value={inputValue}
				onkeydown={(event) => event.key === 'Enter' && HandleInput()}
				class="my-4 focus-visible:ring-0"
			/>
			<Button onclick={HandleInput} size="sm" class="rounded-l-none"
				><Icons.plus class="h-5 w-5" /></Button
			>
		</div>
		{#each duelList.value as dueller (dueller.id)}
			<div class="flex items-center justify-between rounded-lg border bg-slate-900 p-2">
				{dueller.username}
				<Button size="icon" variant="destructive" onclick={() => RemoveDueller(dueller.id)}
					><Icons.x class="w-4" /></Button
				>
			</div>
		{/each}
	</div>
</div>
