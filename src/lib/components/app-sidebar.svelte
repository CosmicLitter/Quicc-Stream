<script lang="ts" module>
	import AudioWaveform from 'lucide-svelte/icons/audio-waveform';
	import BookOpen from 'lucide-svelte/icons/book-open';
	import Bot from 'lucide-svelte/icons/bot';
	import ChartPie from 'lucide-svelte/icons/chart-pie';
	import Command from 'lucide-svelte/icons/command';
	import Frame from 'lucide-svelte/icons/frame';
	import GalleryVerticalEnd from 'lucide-svelte/icons/gallery-vertical-end';
	import Map from 'lucide-svelte/icons/map';
	import Settings2 from 'lucide-svelte/icons/settings-2';
	import SquareTerminal from 'lucide-svelte/icons/square-terminal';
	import { Icons } from '$lib/components/icons/index';

	// This is sample data.
	const data = {
		user: {
			name: 'shadcn',
			email: 'm@example.com',
			avatar: '/avatars/shadcn.jpg'
		},
		teams: [
			{
				name: 'Acme Inc',
				logo: GalleryVerticalEnd,
				plan: 'Enterprise'
			},
			{
				name: 'Acme Corp.',
				logo: AudioWaveform,
				plan: 'Startup'
			},
			{
				name: 'Evil Corp.',
				logo: Command,
				plan: 'Free'
			}
		],
		navMain: [
			{
				title: 'Home',
				url: '/',
				icon: Icons.house
			},
			{
				title: 'Raffle',
				url: '/raffle',
				icon: Icons.tickets
			},
			{
				title: 'Duels',
				url: '/duels',
				icon: Icons.swords
			}
			// {
			// 	title: 'Settings',
			// 	url: '#',
			// 	icon: Settings2,
			// 	items: [
			// 		{
			// 			title: 'General',
			// 			url: '#'
			// 		},
			// 		{
			// 			title: 'Team',
			// 			url: '#'
			// 		},
			// 		{
			// 			title: 'Billing',
			// 			url: '#'
			// 		},
			// 		{
			// 			title: 'Limits',
			// 			url: '#'
			// 		}
			// 	]
			// }
		],
		projects: [
			{
				name: 'Design Engineering',
				url: '#',
				icon: Frame
			},
			{
				name: 'Sales & Marketing',
				url: '#',
				icon: ChartPie
			},
			{
				name: 'Travel',
				url: '#',
				icon: Map
			}
		]
	};
</script>

<script lang="ts">
	import NavMain from '$lib/components/nav-main.svelte';
	import NavProjects from '$lib/components/nav-projects.svelte';
	import NavUser from '$lib/components/nav-user.svelte';
	import TeamSwitcher from '$lib/components/team-switcher.svelte';
	import type { ComponentProps } from 'svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index';
	// import { Icons } from '$lib/components/icons/index';
	// import { useSidebar } from '$lib/components/ui/sidebar/index';
	// import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	// import type { ComponentProps } from 'svelte';
	//
	// let sidebarState = useSidebar();

	// sidebarState.toggle();

	// const items = [
	// 	{
	// 		title: 'Home',
	// 		url: '/',
	// 		icon: Icons.house
	// 	},
	// 	{
	// 		title: 'Raffle',
	// 		url: '/raffle',
	// 		icon: Icons.tickets
	// 	},
	// 	{
	// 		title: 'Duel',
	// 		url: '/duel',
	// 		icon: Icons.swords
	// 	}
	// ];

	let {
		ref = $bindable(null),
		collapsible = 'icon',
		...restProps
	}: ComponentProps<typeof Sidebar.Root> = $props();

	// let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();
</script>

<Sidebar.Root bind:ref {collapsible} variant="inset" {...restProps}>
	<!-- <Sidebar.Header> -->
	<!-- 	<TeamSwitcher teams={data.teams} /> -->
	<!-- </Sidebar.Header> -->
	<Sidebar.Content>
		<NavMain items={data.navMain} />
		<!-- <NavProjects projects={data.projects} /> -->
	</Sidebar.Content>
	<!-- <Sidebar.Footer> -->
	<!-- 	<NavUser user={data.user} /> -->
	<!-- </Sidebar.Footer> -->
	<Sidebar.Rail />
</Sidebar.Root>

<!-- <Sidebar.Root bind:ref variant="inset" collapsible="icon" {...restProps}> -->
<!-- 	<Sidebar.Content> -->
<!-- 		<Sidebar.Group> -->
<!-- 			<Sidebar.GroupLabel>Quicc-Stream</Sidebar.GroupLabel> -->
<!-- 			<Sidebar.GroupContent> -->
<!-- 				<Sidebar.Menu> -->
<!-- 					{#each items as item (item.title)} -->
<!-- 						<Sidebar.MenuItem> -->
<!-- 							<Sidebar.MenuButton> -->
<!-- 								{#snippet child({ ...props })} -->
<!-- 									<a href={item.url} class="my-1 flex items-center gap-4" {...props}> -->
<!-- 										<item.icon /> -->
<!-- 										{#if sidebarState.open} -->
<!-- 											<span>{item.title}</span> -->
<!-- 										{/if} -->
<!-- 									</a> -->
<!-- 								{/snippet} -->
<!-- 							</Sidebar.MenuButton> -->
<!-- 						</Sidebar.MenuItem> -->
<!-- 					{/each} -->
<!-- 				</Sidebar.Menu> -->
<!-- 			</Sidebar.GroupContent> -->
<!-- 		</Sidebar.Group> -->
<!-- 	</Sidebar.Content> -->
<!-- 	<Sidebar.Footer> -->
<!-- 		<Sidebar.Menu></Sidebar.Menu> -->
<!-- 		<Sidebar.MenuItem> -->
<!-- 			<DropdownMenu.Root> -->
<!-- 				<DropdownMenu.Trigger> -->
<!-- 					{#snippet child({ props })} -->
<!-- 						<Sidebar.MenuButton {...props}>LOGIN</Sidebar.MenuButton> -->
<!-- 					{/snippet} -->
<!-- 				</DropdownMenu.Trigger> -->
<!-- 				<DropdownMenu.Content class="w-[--bits-dropdown-menu-anchor-width]"> -->
<!-- 					<DropdownMenu.Item><span>User Login</span></DropdownMenu.Item> -->
<!-- 				</DropdownMenu.Content> -->
<!-- 			</DropdownMenu.Root> -->
<!-- 		</Sidebar.MenuItem> -->
<!-- 	</Sidebar.Footer> -->
<!-- </Sidebar.Root> -->
