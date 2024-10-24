<script lang="ts">
	import type { Member } from '$lib/types';
	import { Icons } from '$lib/components/icons';
	import { Button } from '$lib/components/ui/button';
	import { clan, q_queue, fire_team } from '$lib/stores/stores';
	export let member: Member;

	function DeleteMember(id: number) {
		$fire_team.members = $fire_team.members.filter((t) => t.id != id);
		$q_queue = $q_queue.filter((t) => t.id != id);
		$clan = $clan.filter((t) => t.id != id);
	}
</script>

<div
	class="my-auto grid w-[600px] grid-flow-col grid-cols-[3fr,2fr] grid-rows-2 gap-2 rounded-xl border p-4 drop-shadow-md hover:bg-white/10"
>
	<div class="row-span-2 self-center">
		<p class="text-xl font-semibold">{member.d2_username}</p>
		<p class="text-sm font-light italic">#{member.d2_id}</p>
	</div>
	<div class="ml-auto flex">
		<Icons.twitch class="mx-1 w-4" />:
		<span class="ml-2 self-center font-light italic">
			{#if member.twitch_username}
				{member.twitch_username}
			{:else}
				----
			{/if}
		</span>
	</div>
	<div class="ml-auto flex">
		<Icons.youtube class="mx-1 w-4" />:
		<span class="ml-2 self-center font-light italic">
			{#if member.youtube_username}
				{member.youtube_username}
			{:else}
				----
			{/if}
		</span>
	</div>
	<Button variant="destructive" size="icon" on:click={() => DeleteMember(member.id)}
		><Icons.x class="h-4" /></Button
	>
</div>
