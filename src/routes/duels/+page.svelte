<script lang="ts">
	import { duels } from '$lib/states/duels.svelte';
	import { roster } from '$lib/states/global.svelte';
	import { toast } from 'svelte-sonner';
	import { Icons } from '$lib/components/icons';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Dialog from '$lib/components/ui/dialog';
	import { copy } from 'svelte-copy';
	import type { Member } from '$lib/types';
	import Label from '$lib/components/ui/label/label.svelte';
	import { getDestinyService } from '$lib/services/destiny';

	let name = $state('');
	let userName = $state('');

	function HandleInput() {
		duels.Add(name);
		name = '';
	}

	async function Link(twitchUsername: string, accountName: string, id: number) {
		console.log(twitchUsername, accountName);
		const destinyService = getDestinyService();

		if (!accountName || !accountName.includes('#')) {
			toast.error('D2 account not formatted properly. Must include "#" followed by a 4 digit code');
			return null;
		}
		const [displayName, accountNumber] = accountName.split('#');

		if (/^\d{4}$/.test(accountNumber)) {
			// NOTE : Adding to duel checks if twitch username exists. This checks for existing d2 account name
			const existingMember = roster.GetMember(displayName, accountNumber); //
			if (existingMember) {
				if (!existingMember.twitchUsername) return;
				// TODO : This case would mean twitch username doesn't exist but the d2 account does, log this for debugging
				toast.warning(`Destiny name already exists with twitch user: ${twitchUsername}`);

				duels.duels.matches.push({
					d2Username: existingMember.d2Username,
					d2Id: existingMember.d2Id,
					twitchUsername: existingMember.twitchUsername,
					id: duels.duels.nextMatchId
				}); // Just add the member for now
				duels.duels.nextMatchId++;
				return null;
			} else {
				// console.log(displayName);
				const searchResponse = await destinyService.getActiveProfile(displayName, accountNumber);
				// console.log(searchResponse);
				if (!searchResponse) {
					// TODO : log something when search fails
					toast.error('Response from Destiny API failed. Is the Destiny account name correct?');
					return null;
				}
				const newMember: Member = {
					d2Username: displayName,
					d2Id: accountNumber,
					twitchUsername: twitchUsername,
					sessionCount: 0,
					isActive: true,
					membershipId: searchResponse.membershipId.toString(),
					membershipType: searchResponse.membershipType
				};
				const response = await fetch('./api/db/addmember', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ member: newMember })
				});

				if (!response.ok) {
					// const error = await response.json();
					toast.error('Found the member, but failed to add to roster');
					// throw new Error(error.message || 'Failed to add member');
					return;
				}

				toast.success(`${newMember.d2Username}#${newMember.d2Id} was successfully added`);
				duels.RemoveUnlinked(id);
				if (newMember.twitchUsername)
					duels.duels.matches.push({
						d2Id: newMember.d2Id,
						d2Username: newMember.d2Username,
						twitchUsername: newMember.twitchUsername,
						id: duels.duels.nextMatchId
					});
				duels.duels.nextMatchId++;
			}
		}
	}

	function RemoveUnlinkedDuller(id: number) {
		duels.RemoveUnlinked(id);
	}

	function CopyToast(player: any) {
		toast(`"${player.d2Username}#${player.d2Id}" copied to clipboard`);
	}
</script>

<div class="mx-auto grid max-w-5xl grid-cols-[2fr,1fr] grid-rows-[auto,1fr] rounded-lg p-10">
	<Input
		class="col-span-2 mx-auto max-w-md bg-slate-900"
		placeholder="manual entry"
		onkeydown={(event) => event.key === 'Enter' && HandleInput()}
		bind:value={name}
	/>
	<div class="p-10">
		<div class="w-2xl grid grid-cols-[1fr,auto] items-center gap-y-2">
			{#each duels.duels.matches as dueller (dueller.id)}
				<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions  -->
				<div
					class="cursor-pointer rounded-l-lg bg-slate-900 p-4 drop-shadow-lg hover:bg-slate-300/10"
					use:copy={`${dueller.d2Username}#${dueller.d2Id}`}
					onclick={() => CopyToast(dueller)}
				>
					<div class="flex gap-2">
						<h2 class="truncate text-lg font-bold">{dueller.d2Username}</h2>
						<div class="ml-auto flex items-center gap-2">
							<Icons.twitch />
							<span class="truncate text-muted-foreground">{dueller.twitchUsername}</span>
						</div>
					</div>
					<span class="font-light italic text-muted-foreground">#{dueller.d2Id} </span>
				</div>
				<Button
					onclick={() => duels.Remove(dueller.id)}
					class="h-full rounded-l-none"
					variant="destructive"><Icons.x /></Button
				>
			{/each}
		</div>
	</div>
	<div class="justif-center mt-10 w-full text-center">
		{#if duels.duels.unlinkedRequests.length > 0}
			<h2 class="mb-2 text-2xl font-bold">Unlinked:</h2>
		{/if}
		<div class="grid grid-cols-1 gap-y-2">
			{#each duels.duels.unlinkedRequests as viewer (viewer.id)}
				<Dialog.Root>
					<Dialog.Trigger>
						<Button variant="ghost" class="w-full rounded-lg bg-slate-900 p-2 drop-shadow-lg">
							<h2 class="text-lg font-bold">
								{viewer.username}
							</h2>
						</Button>
					</Dialog.Trigger>
					<Dialog.Content>
						<Dialog.Header>Link Viewer</Dialog.Header>
						<div class="grid gap-4 py-4">
							<div class="grid grid-cols-4 items-center gap-2 p-4">
								<Label for="name" class="text-right">Name</Label>
								<Input id="name" disabled value={`${viewer.username}`} class="col-span-3" />
								<Label for="userName" class="text-right">Destiny Account</Label>
								<Input id="userName" bind:value={userName} class="col-span-3" />
							</div>
						</div>
						<Dialog.Footer>
							<Button
								onclick={() => RemoveUnlinkedDuller(viewer.id)}
								variant="destructive"
								class="mr-72">Remove</Button
							>
							<Button onclick={() => Link(viewer.username, userName, viewer.id)}>Link</Button>
						</Dialog.Footer>
					</Dialog.Content>
				</Dialog.Root>
			{/each}
		</div>
	</div>
</div>
