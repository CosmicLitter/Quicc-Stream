<script lang="ts">
	import type { Member } from '$lib/types';
	import { Icons } from '$lib/components/icons';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { clan, q_queue, fire_team } from '$lib/stores/stores';
	import { copy } from 'svelte-copy';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	export let member: Member;

	function DeleteMember(id: number) {
		$fire_team.members = $fire_team.members.filter((t) => t.id != id);
		$q_queue = $q_queue.filter((t) => t.id != id);
		$clan = $clan.filter((t) => t.id != id);
	}
</script>

<!-- <div -->
<!-- 	class="my-auto grid w-[600px] grid-flow-col grid-cols-[3fr,2fr,auto] grid-rows-2 gap-2 rounded-xl border bg-slate-900 p-4 drop-shadow-md hover:bg-white/10" -->
<!-- > -->
<!-- 	<div class="row-span-2 self-center"> -->
<!-- 		<p class="text-xl font-semibold">{member.d2_username}</p> -->
<!-- 		<p class="text-sm font-light italic">#{member.d2_id}</p> -->
<!-- 	</div> -->
<!-- 	<div class="ml-auto flex"> -->
<!-- 		<Icons.twitch class="mx-1 w-4" />: -->
<!-- 		<span class="ml-2 self-center font-light italic"> -->
<!-- 			{#if member.twitch_username} -->
<!-- 				{member.twitch_username} -->
<!-- 			{:else} -->
<!-- 				---- -->
<!-- 			{/if} -->
<!-- 		</span> -->
<!-- 	</div> -->
<!-- 	<div class="ml-auto flex"> -->
<!-- 		<Icons.youtube class="mx-1 w-4" />: -->
<!-- 		<span class="ml-2 self-center font-light italic"> -->
<!-- 			{#if member.youtube_username} -->
<!-- 				{member.youtube_username} -->
<!-- 			{:else} -->
<!-- 				---- -->
<!-- 			{/if} -->
<!-- 		</span> -->
<!-- 	</div> -->
<!-- 	<AlertDialog.Root> -->
<!-- 		<AlertDialog.Trigger asChild let:builder> -->
<!-- 			<Button builders={[builder]} variant="destructive" size="icon"><Icons.x class="h-4" /></Button -->
<!-- 			> -->
<!-- 		</AlertDialog.Trigger> -->
<!-- 		<AlertDialog.Content> -->
<!-- 			<AlertDialog.Header> -->
<!-- 				<AlertDialog.Title>Confirm member deletion</AlertDialog.Title> -->
<!-- 				<AlertDialog.Description> -->
<!-- 					This will remove {member.d2_username} from the list, as well as from the queue and active fireteam. -->
<!-- 				</AlertDialog.Description> -->
<!-- 			</AlertDialog.Header> -->
<!-- 			<AlertDialog.Footer> -->
<!-- 				<AlertDialog.Cancel>Cancel</AlertDialog.Cancel> -->
<!-- 				<AlertDialog.Action on:click={() => DeleteMember(member.id)}>Continue</AlertDialog.Action> -->
<!-- 			</AlertDialog.Footer> -->
<!-- 		</AlertDialog.Content> -->
<!-- 	</AlertDialog.Root> -->
<!-- 	<div -->
<!-- 		class=" m-auto rounded-lg border-2 p-2 hover:bg-white/10" -->
<!-- 		use:copy={`${member.d2_username}#${member.d2_id}`} -->
<!-- 	> -->
<!-- 		<Icons.clipboard_copy /> -->
<!-- 	</div> -->
<!-- </div> -->

<div class="group/member rounded-lg">
	<Card.Root
		class="w-72 rounded-b-none border-b-0 bg-slate-900 pb-0 drop-shadow-lg group-hover/member:bg-primary/10"
	>
		<Card.Header>
			<Card.Title class="flex items-center justify-between">
				<p>
					{member.d2_username}
				</p>
				<AlertDialog.Root>
					<AlertDialog.Trigger asChild let:builder>
						<Button builders={[builder]} variant="destructive" size="icon" class="h-6 w-6"
							><Icons.x class="h-4" /></Button
						>
					</AlertDialog.Trigger>
					<AlertDialog.Content>
						<AlertDialog.Header>
							<AlertDialog.Title>Confirm member deletion</AlertDialog.Title>
							<AlertDialog.Description>
								This will remove {member.d2_username} from the list, as well as from the queue and active
								fireteam.
							</AlertDialog.Description>
						</AlertDialog.Header>
						<AlertDialog.Footer>
							<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
							<AlertDialog.Action on:click={() => DeleteMember(member.id)}
								>Continue</AlertDialog.Action
							>
						</AlertDialog.Footer>
					</AlertDialog.Content>
				</AlertDialog.Root>
			</Card.Title>
			<Card.Description class="font-light italic">#{member.d2_id}</Card.Description>
		</Card.Header>
		<Card.Content class="grid grid-rows-2 gap-2 ">
			<p class="flex items-center gap-2">
				<Icons.twitch class="w-4" />:<span class="font-light italic">
					{#if member.twitch_username}
						{member.twitch_username}
					{:else}
						----
					{/if}
				</span>
			</p>
			<p class="flex items-center gap-2">
				<Icons.youtube class="w-4" />:<span class="font-light italic">
					{#if member.youtube_username}
						{member.youtube_username}
					{:else}
						----
					{/if}
				</span>
			</p>
			<!-- <div class="border"> -->
			<!-- 	<Icons.clipboard_copy /> -->
			<!-- </div> -->
		</Card.Content>
		<!-- <Card.Footer> -->
		<!-- 	<Button variant="link"><Icons.clipboard_copy /></Button> -->
		<!-- </Card.Footer> -->
	</Card.Root>
	<div
		class="grid h-12 w-full grid-cols-[1fr,1fr] rounded-b-lg border border-t-0 bg-slate-800 shadow-inner"
	>
		<div
			class="flex h-full w-full cursor-pointer items-center justify-center rounded-bl-lg hover:bg-primary/50"
			use:copy={`${member.d2_username}#${member.d2_id}`}
		>
			<Icons.clipboard_copy />
		</div>
		<Dialog.Root>
			<Dialog.Trigger>
				<Button class="h-full w-full rounded-t-none rounded-bl-none" variant="ghost">
					<Icons.user_edit />
				</Button>
			</Dialog.Trigger>
			<Dialog.Content>
				<Dialog.Header>
					<Dialog.Title>Edit Member</Dialog.Title>
				</Dialog.Header>
				<div class="grid gap-4 py-4">
					<div class="grid grid-cols-4 items-center gap-4">
						<Label for="d2 name" class="text-right">Destiny Username</Label>
						<Input id="d2 name" bind:value={member.d2_username} class="col-span-3" />
					</div>
					<div class="grid grid-cols-4 items-center gap-4">
						<Label for="d2 id" class="text-right">Destiny ID Number</Label>
						<Input id="d2 id" bind:value={member.d2_id} class="col-span-3" />
					</div>
					<div class="grid grid-cols-4 items-center gap-4">
						<Label for="twitch name" class="text-right">Twitch Username</Label>
						<Input id="twitch name" bind:value={member.twitch_username} class="col-span-3" />
					</div>
					<div class="grid grid-cols-4 items-center gap-4">
						<Label for="youtube name" class="text-right">Youtube Username</Label>
						<Input id="youtube name" bind:value={member.youtube_username} class="col-span-3" />
					</div>
				</div>
				<!-- <Dialog.Footer> -->
				<!-- 	<Button on:click={() => UpdateMember(member.id)} type="submit">Update</Button> -->
				<!-- </Dialog.Footer> -->
			</Dialog.Content>
		</Dialog.Root>
	</div>
</div>
