<script lang="ts">
	import MemberComponent from '$lib/components/members/member-component.svelte';
	// import { roster } from '$lib/states/global.svelte';

	let { data } = $props();
	console.log(data.members);
</script>

<div class="w-full">
	<div class="flex flex-wrap justify-center gap-6 p-4">
		{#each data.members.items as member (member.id)}
			<MemberComponent {member} />
		{/each}
	</div>
</div>
