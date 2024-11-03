<script lang="ts">
	import MemberComponent from '$lib/components/members/member-component.svelte';
	import { roster } from '$lib/states/global.svelte';
</script>

<div class="h-full w-full overflow-y-auto">
	<div class="flex flex-wrap gap-6 p-4">
		{#each roster.GetMembers() as member (member.id)}
			<MemberComponent {member} />
		{/each}
	</div>
</div>
