<script lang="ts">
	import type { QueueEntry } from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import { qQueue, roster } from '$lib/states/global.svelte';
	import { fly } from 'svelte/transition';
	import { Icons } from '$lib/components/icons';
	import { copy } from 'svelte-copy';
	import { toast } from 'svelte-sonner';
	import * as HoverCard from '$lib/components/ui/hover-card/index';
	import Youtube from 'lucide-svelte/icons/youtube';

	let queue = $derived(qQueue.GetQueue());
	let selectedPlayer: QueueEntry | null = $state(null);
	let selectionPromise: Promise<QueueEntry | null> | null = $state(null);

	// $effect(() => {
	// 	$inspect(queue);
	// });

	async function SelectNextPlayer() {
		selectionPromise = new Promise((resolve) => {
			setTimeout(() => {
				resolve(qQueue.SelectNextPlayer());
			}, 1000);
		});

		selectedPlayer = await selectionPromise;
	}

	async function AddToFireteam() {
		if (selectedPlayer) {
			qQueue.RemoveFromQueue(selectedPlayer);
			let member = roster
				.GetMembers()
				.find(
					(viewer) =>
						selectedPlayer?.destinyUsername === viewer.d2Username &&
						selectedPlayer.destinyId === viewer.d2Id
				);
			if (member?.sessionCount) member.sessionCount++;
			const response = await fetch('/api/db/updatemember', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ member })
			});
			if (!response.ok) {
				console.error(await response.json());
			}
		}
		selectedPlayer = null;
		selectionPromise = null;
	}

	function PlayerNotAvailable() {
		if (selectedPlayer) qQueue.AbsentPlayer(selectedPlayer);
		selectedPlayer = null;
		selectionPromise = null;
	}

	function CopyToast(player: QueueEntry) {
		toast(`"${player.destinyUsername}#${player.destinyId}" copied to clipboard`);
	}
</script>

<div class="h-full w-full max-w-2xl p-4">
	<!-- Selected player component goes here -->
	<div class="grid w-full grid-rows-[auto,auto] gap-y-2">
		<div
			class="mx-auto mb-4 h-24 w-full max-w-lg rounded-xl border border-b-slate-950 border-t-slate-700 bg-slate-900 drop-shadow-lg"
		>
			<div class="grid h-full grid-cols-[1fr,auto] items-center p-2">
				{#if selectionPromise}
					{#await selectionPromise}
						<div class="flex w-full items-center justify-center">
							<p class="animate-pulse text-lg">Selecting Player...</p>
						</div>
					{:then player}
						{#if player}
							<HoverCard.Root>
								<HoverCard.Trigger onclick={() => CopyToast(player)}>
									<div class="space-y-1" use:copy={`${player.destinyUsername}#${player.destinyId}`}>
										<div class="flex">
											<h2 class="text-2xl font-bold">{player.destinyUsername}</h2>
											<span>
												<Button
													variant="ghost"
													class="-mt-1 ml-2 cursor-pointer rounded-lg px-2 hover:bg-primary/20"
													><Icons.clipboardCopy class="m-auto h-full w-full" /></Button
												>
											</span>
										</div>
										<p class="font-light italic">#{player.destinyId}</p>
									</div>
								</HoverCard.Trigger>
								<HoverCard.Content
									class="flex w-full max-w-2xl items-center gap-8 border-b-slate-950 border-t-slate-700 bg-slate-800 drop-shadow-lg"
								>
									{#if player.twitchUsername}
										<p class="flex gap-2"><Icons.twitch />: {player.twitchUsername}</p>
									{/if}
									{#if player.youtubeUsername}
										<p class="flex gap-2"><Icons.youtube />: {player.youtubeUsername}</p>
									{/if}
									<p class="flex gap-2"><Icons.members />: {player.sessionCount}</p>
									<p class="flex gap-2"><Icons.userX />: {player.absences}</p>
								</HoverCard.Content>
							</HoverCard.Root>
							<div class="flex items-center">
								<Button onclick={AddToFireteam} variant="outline"><Icons.check /></Button>
								<Button onclick={PlayerNotAvailable} variant="outline"><Icons.userX /></Button>
							</div>
						{/if}
					{/await}
				{/if}
			</div>
		</div>
		<div class="relative flex w-full items-center">
			<Button onclick={SelectNextPlayer} disabled={!!selectedPlayer} class="mx-auto"
				>Select Player</Button
			>
			<Button onclick={() => qQueue.ClearQueue()} class="absolute right-1">Clear</Button>
		</div>
	</div>
	<div class="">
		<!-- Main content area -->
		<!-- <div> -->
		<!-- 	<!-- List view -->
		<!-- 	<table> -->
		<!-- 		<thead> -->
		<!-- 			<tr> -->
		<!-- 				<th>Username</th> -->
		<!-- 				<th>Platforms</th> -->
		<!-- 				<th>Session Count</th> -->
		<!-- 				<th>Queue Time</th> -->
		<!-- 			</tr> -->
		<!-- 		</thead> -->
		<!-- 		<tbody> -->
		<!-- 			{#each queue as entry} -->
		<!-- 				<tr class="p-2"> -->
		<!-- 					<td class="p-2">{entry.destinyUsername}#{entry.destinyId}</td> -->
		<!-- 					<td class="p-2"> -->
		<!-- 						{#if entry.twitchUsername}{entry.twitchUsername}{/if} -->
		<!-- 						{#if entry.youtubeUsername}{entry.youtubeUsername}{/if} -->
		<!-- 					</td> -->
		<!-- 					<td class="p-2">{entry.sessionCount}</td> -->
		<!-- 					<td class="p-2"> -->
		<!-- 						{Math.round((new Date().getTime() - entry.queueJoined.getTime()) / (1000 * 60))}m -->
		<!-- 					</td> -->
		<!-- 				</tr> -->
		<!-- 			{/each} -->
		<!-- 		</tbody> -->
		<!-- 	</table> -->
		<!-- </div> -->
		<!-- Probability view -->
		<div class="scrollbar-hidden h-[calc(100vh-255px)] w-full overflow-y-auto scroll-smooth">
			{#each qQueue.probabilityView as prob (prob.destinyId)}
				<div
					transition:fly={{ y: 200, duration: 500 }}
					class="my-4 w-full rounded border border-b-slate-950 border-t-slate-700 bg-slate-900 p-6 drop-shadow-lg"
				>
					<h3 class="font-semibold">{prob.destinyUsername}</h3>
					<div class="mt-2 h-4 w-full rounded bg-slate-600">
						<div
							class="h-4 rounded bg-blue-500 transition-all duration-700"
							style="width: {prob.probability}%"
						></div>
						<p class="-mt-2 text-right text-lg font-bold">{prob.probability.toFixed(1)}%</p>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>
