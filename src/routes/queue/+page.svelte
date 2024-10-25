<script lang="ts">
	import MemberComponent from '$lib/components/members/MemberComponent.svelte';
	import type { Member } from '$lib/types';
	import { fire_team, q_queue, clan } from '$lib/stores/stores';
	import { dndzone } from 'svelte-dnd-action';
	import QueueComponent from '$lib/components/queue/QueueComponent.svelte';
	import { Icons } from '$lib/components/icons';
	import { quintOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { copy } from 'svelte-copy';
	import { Button } from '$lib/components/ui/button';

	let flipDurationMs = 200;
	let dropFromOthersDisabled = false;

	function IncrementPartySize() {
		$fire_team.max_size++;
	}

	function DecrementPartySize() {
		$fire_team.max_size--;
	}

	function RemoveFromFireteam(id: number) {
		clan.update((members) => {
			return members.map((member) => {
				if (member.id === id) {
					return { ...member, participation_count: member.participation_count + 1 };
				}
				return member;
			});
		});
		$fire_team.members = $fire_team.members.filter((t) => t.id != id);
	}

	function RemoveFromQueue(id: number) {
		$q_queue = $q_queue.filter((t) => t.id != id);
		// $party.members = $party.members.filter((t) => t.id != id);
	}

	const handleConsiderQueue = (evt: CustomEvent<DndEvent<Member>>) => {
		$q_queue = evt.detail.items;
		if ($fire_team.members.length < $fire_team.max_size) {
			dropFromOthersDisabled = false;
		} else {
			dropFromOthersDisabled = true;
		}
	};

	const handleFinalizeQueue = (evt: CustomEvent<DndEvent<Member>>) => {
		$q_queue = evt.detail.items;
		dropFromOthersDisabled = $fire_team.members.length >= $fire_team.max_size;
	};

	const handleConsiderParty = (evt: CustomEvent<DndEvent<Member>>) => {
		$fire_team.members = evt.detail.items;
		if ($fire_team.members.length < $fire_team.max_size) {
			dropFromOthersDisabled = false;
		} else {
			dropFromOthersDisabled = true;
		}
	};

	const handleFinalizeParty = (evt: CustomEvent<DndEvent<Member>>) => {
		$fire_team.members = evt.detail.items;
		dropFromOthersDisabled = $fire_team.members.length >= $fire_team.max_size;
	};
</script>

<div class="flex h-full justify-center">
	<div class="grid w-[800px] grid-cols-2 grid-rows-[auto,auto,1fr] bg-muted/50">
		<div class="col-span-2 flex h-12 items-center justify-center">
			<h2 class="text-lg font-semibold">Fireteam Size</h2>
		</div>
		<div class="col-span-2 mx-auto items-center justify-center space-x-4 border-b-2">
			<Button on:click={DecrementPartySize} size="icon" variant="ghost">
				<Icons.minus class="h-4 w-4" />
			</Button>
			<span class="text-center text-lg">
				{$fire_team.max_size}
			</span>
			<Button on:click={IncrementPartySize} size="icon" variant="ghost">
				<Icons.plus class="h-4 w-4" />
			</Button>
		</div>
		<div class="w-full items-center overflow-y-auto border-r">
			<section
				use:dndzone={{ items: $q_queue, flipDurationMs, dropTargetStyle: {} }}
				on:consider={handleConsiderQueue}
				on:finalize={handleFinalizeQueue}
				class="h-full p-2"
			>
				{#each $q_queue as member (member.id)}
					<div
						in:fly={{ duration: 200, y: 500, opacity: 0.5, easing: quintOut }}
						animate:flip={{ duration: flipDurationMs }}
						class="my-2"
					>
						<div
							class="grid grid-cols-[7fr,6fr] rounded-t-lg border-2 bg-slate-800 p-2 hover:bg-primary hover:drop-shadow-lg"
						>
							<div>
								<p class="font-semibold">{member.d2_username}</p>
								<p class="font-light italic">
									#{member.d2_id} | sessions: {member.participation_count}
								</p>
							</div>
							<div class="my-auto grid grid-rows-2 space-y-1">
								<span class="place-center ml-auto flex text-sm font-light">
									<Icons.twitch class="h-4" />:
									{#if member.twitch_username}
										{member.twitch_username}
									{:else}
										----
									{/if}
								</span>
								<span class="place-center ml-auto flex text-sm font-light">
									<Icons.youtube class="h-4" />:
									{#if member.youtube_username}
										{member.youtube_username}
									{:else}
										----
									{/if}
								</span>
							</div>
						</div>
						<div class="grid grid-cols-3 rounded-b-lg border-b">
							<!-- disable a11y  -->
							<div
								class="flex cursor-pointer items-center justify-center rounded-bl-lg border-x bg-slate-900 hover:bg-white/10"
								on:click={() => RemoveFromQueue(member.id)}
							>
								<Icons.x class="w-4" />
							</div>
							<div
								class="flex cursor-pointer items-center justify-center border-x bg-slate-900 hover:bg-white/10"
								use:copy={`${member.d2_username}#${member.d2_id}`}
							>
								<Icons.clipboard_copy class="w-4" />
							</div>
							<div
								class="flex cursor-pointer items-center justify-center rounded-br-lg border-x bg-slate-900 hover:bg-white/10"
							>
								<Icons.chevron_right class="w-4" />
							</div>
						</div>
					</div>
				{/each}
			</section>
		</div>
		<div class="w-full items-center overflow-y-auto border-l">
			<section
				use:dndzone={{
					items: $fire_team.members,
					flipDurationMs,
					dropTargetStyle: {},
					dropFromOthersDisabled
				}}
				on:consider={handleConsiderParty}
				on:finalize={handleFinalizeParty}
				class="h-full p-2"
			>
				{#each $fire_team.members as member (member.id)}
					<div
						in:fly={{ duration: 200, y: 500, opacity: 0.5, easing: quintOut }}
						animate:flip={{ duration: flipDurationMs }}
						class="my-2"
					>
						<div
							class="grid grid-cols-[7fr,6fr] rounded-t-lg border-2 bg-slate-800 p-2 hover:bg-primary hover:drop-shadow-lg"
						>
							<div>
								<p class="font-semibold">{member.d2_username}</p>
								<p class="font-light italic">#{member.d2_id}</p>
							</div>
							<div class="my-auto grid grid-rows-2 space-y-1">
								<span class="place-center ml-auto flex text-sm font-light">
									<Icons.twitch class="h-4" />:
									{#if member.twitch_username}
										{member.twitch_username}
									{:else}
										----
									{/if}
								</span>
								<span class="place-center ml-auto flex text-sm font-light">
									<Icons.youtube class="h-4" />:
									{#if member.youtube_username}
										{member.youtube_username}
									{:else}
										----
									{/if}
								</span>
							</div>
						</div>
						<div class="grid grid-cols-3 rounded-b-lg border-b">
							<!-- disable a11y  -->
							<div
								class="flex cursor-pointer items-center justify-center rounded-bl-lg border-x bg-slate-900 hover:bg-white/10"
							>
								<Icons.chevron_left class="w-4" />
							</div>
							<div
								class="flex cursor-pointer items-center justify-center border-x bg-slate-900 hover:bg-white/10"
								use:copy={`${member.d2_username}#${member.d2_id}`}
							>
								<Icons.clipboard_copy class="w-4" />
							</div>
							<div
								class="flex cursor-pointer items-center justify-center rounded-br-lg border-x bg-slate-900 hover:bg-white/10"
								on:click={() => RemoveFromFireteam(member.id)}
							>
								<Icons.check class="w-4" />
							</div>
						</div>
					</div>
				{/each}
			</section>
		</div>
	</div>
</div>
