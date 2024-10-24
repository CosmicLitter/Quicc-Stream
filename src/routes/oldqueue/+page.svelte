<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Icons } from '$lib/components/icons/index';
	import { onMount, onDestroy } from 'svelte';
	import { dndzone } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import { qQueue, viewers, count, party, duels } from '$lib/stores/stores';
	import { fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { PUBLIC_YOUTUBE_API_KEY } from '$env/static/public';
	import type { Viewer, Dueller } from '$lib/types';
	import * as fs from 'node:fs';

	// let queue = $qQueue;

	const CHANNEL_ID = 'UCs3qwo3NWpC9WviUuQfmlBw';

	const flipDurationMs = 100;
	$: authenticated = false;
	$: twitch_connected = false;
	$: userID = 0;
	let sessionID: string;

	let user = 'q_quicc';
	let user_id = '';

	let inputValue = '';

	// console.log('count:', get(count));
	function HandleInput() {
		if (inputValue.trim() !== '') {
			AddUser(inputValue);
		}
		inputValue = '';
	}

	async function GetUser() {
		const res = await fetch(`https://api.twitch.tv/helix/users?login=${user}`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${localStorage.getItem('Token')}`,
				'Client-Id': clientID
			}
		});
		const data = await res.json();
		console.log('User ID: ', data);
		user_id = data.data[0].id;
	}

	// Maybe rename to AddToQueue
	function AddUser(name: string) {
		AddViewer(name);
		// Add viewer to queue
		if (
			!$qQueue.some((item) => item.viewer.toLowerCase() === name.toLowerCase()) &&
			!$party.members.some((item) => item.viewer.toLowerCase() === name.toLowerCase())
		) {
			const viewer = $viewers.find((user) => user.viewer.toLowerCase() === name.toLowerCase());
			if (viewer) $qQueue = [...$qQueue, viewer];
		}
	}

	function AddViewer(name: string) {
		// Add new viewer to all viwers list if they are not on the list
		// console.log('Adding', name);
		if (!$viewers.some((item) => item.viewer.toLowerCase() === name.toLowerCase())) {
			// console.log(name, 'is a new viewer. Adding them to the viewer list');
			$viewers = [...$viewers, { id: $count, viewer: name, participation_count: 0 }];
			$count++;
		}
	}

	const clientID = 'wryq0ptbcqok7crz9ajvlj25e05tqp';
	let socket: WebSocket | null;
	// const user = 'Q_Quicc';

	function GetToken() {
		return localStorage.getItem('Token');
	}

	function IsAuthenticated() {
		return !!GetToken();
	}

	onMount(async () => {
		authenticated = IsAuthenticated();

		if (authenticated) {
			// await GetUserID();
			// InitializeWebSocket();
			// await GetUser();
		}
		// YoutubeStuff();
	});

	async function YoutubeStuff() {
		const res = await fetch(
			`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&order=date&type=video&key=${PUBLIC_YOUTUBE_API_KEY}`
		);
		const data = await res.json();
		console.log(data);

		let items = data.items;
		console.log('Items: ', items);

		// If there is a video id, then there is a live stream happening.
		let video_id;

		if (items) {
			for (let item of items) {
				if (item.snippet.liveBroadcastContent === 'live') {
					video_id = item.id.videoId;
				}
			}
		}

		if (video_id) {
			const res = await fetch(
				`https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails,snippet&id=${video_id}&key=${PUBLIC_YOUTUBE_API_KEY}`
			);
			const streamdata = await res.json();

			// console.log(streamdata.items[0].liveStreamingDetails.activeLiveChatId);

			const live_chat_id = streamdata.items[0].liveStreamingDetails.activeLiveChatId;

			await PollChatMessages(live_chat_id);
		}
	}

	async function PollChatMessages(live_chat_id: string) {
		let next_page_token = '';
		let polling_interval = 5000;

		while (true) {
			console.log('polling chat');
			const url = `https://www.googleapis.com/youtube/v3/liveChat/messages?liveChatId=${live_chat_id}&part=snippet,authorDetails&maxResults=2000${next_page_token ? `&pageToken=${next_page_token}` : ``}&key=${PUBLIC_YOUTUBE_API_KEY}`;

			const res = await fetch(url);
			const data = await res.json();

			if (data.items && data.items.launch > 0) {
				data.items.forEach((message: any) => {
					console.log('New Message: ', message.snippet.displayMessage);
				});
			}

			next_page_token = data.nextPageToken || '';
			polling_interval = data.pollingIntervalMillis || 5000;

			await new Promise((resolve) => setTimeout(resolve, polling_interval));
		}
	}

	function InitializeWebSocket() {
		if (socket) return;

		socket = new WebSocket('wss://eventsub.wss.twitch.tv/ws');

		socket.onopen = () => {
			console.log('Connected to the Twitch WebSocket');
		};

		socket.onmessage = (event) => {
			const data = JSON.parse(event.data);
			console.log('Message received from server:', data);

			if (data.metadata.message_type == 'session_welcome') {
				sessionID = data.payload.session.id;
				ChatSubscription();
				PointRedeemSubscription();
			}

			if (
				data.metadata.message_type == 'notification' &&
				data.payload.subscription.type == 'channel.chat.message'
			) {
				console.log(data.payload.event.chatter_user_name, 'says:', data.payload.event.message.text);
				if (
					data.payload.event.message.text.toLowerCase() == '!dibs' &&
					!$qQueue.some(
						(item) =>
							item.viewer.toLowerCase() === data.payload.event.chatter_user_name.toLowerCase()
					)
				) {
					// $qQueue = [
					// 	...$qQueue,
					// 	{ id: $count, viewer: data.payload.event.chatter_user_name, participation_count: 0 }
					// ];
					// console.log(data.payload.event.chatter_user_name, 'is not in the queue, adding..');
					AddUser(data.payload.event.chatter_user_name);
				}
			}

			if (
				data.metadata.message_type == 'notifaction' &&
				data.payload.subscription.type == 'channel.channel_points_automatic_reward_redemption.add'
			) {
				const username = data.payload.event.user_name;
				console.log(username, ' redeedmed a duel!');
				AddViewer(username);

				const viewer = $viewers.find(
					(user) => user.viewer.toLowerCase() === username.toLowerCase()
				);
				if (viewer) {
					$duels = [...$duels, viewer];
				}
			}
		};

		socket.onclose = (event) => {
			console.log('WebSocket closed:', event);
			twitch_connected = false;
			socket = null;
		};

		socket.onerror = (error) => {
			console.error('WebSocket Error', error);
			twitch_connected = false;
		};
	}

	onDestroy(() => {
		if (socket) {
			socket.close();
			socket = null;
		}
		// BackupData();
	});

	// function BackupData() {
	// 	const queue_data = JSON.stringify($qQueue);
	// 	const viewer_data = JSON.stringify($viewers);
	// 	fs.writeFileSync('queue.json', queue_data);
	// 	fs.writeFileSync('viewer.json', viewer_data);
	// }

	async function GetUserID() {
		const res = await fetch('https://api.twitch.tv/helix/users', {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${localStorage.getItem('Token')}`,
				'Client-Id': clientID
			}
		});
		const data = await res.json();
		// console.log(data);
		userID = data.data[0].id;
		// console.log(userID);
	}

	async function ChatSubscription() {
		const type = 'channel.chat.message';
		const version = '1';
		const condition = {
			broadcaster_user_id: userID.toString(),
			user_id: userID.toString()
		};
		const transport = {
			method: 'websocket',
			session_id: sessionID
		};
		const res = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${localStorage.getItem('Token')}`,
				'Client-Id': clientID,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				type,
				version,
				condition,
				transport
			})
		});
		const data = await res.json();
		twitch_connected = !!(data.data[0].status === 'enabled');
		console.log('Chat Subscription', data);
	}

	async function PointRedeemSubscription() {
		const type = 'channel.channel_points_automatic_reward_redemption.add';
		const version = '1';
		const condition = {
			broadcaster_user_id: userID.toString()
		};
		const transport = {
			method: 'websocket',
			session_id: sessionID
		};
		const res = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${localStorage.getItem('Token')}`,
				'Client-Id': clientID,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				type,
				version,
				condition,
				transport
			})
		});
		const data = await res.json();
		console.log('Channel Point Redeem Subscription: ', data);
	}

	function RemoveToken() {
		localStorage.removeItem('Token');
		authenticated = false;

		if (socket) {
			socket.close();
			socket = null;
		}
	}

	let dropFromOthersDisabled = false;

	const handleConsiderQueue = (evt: CustomEvent<DndEvent<Viewer>>) => {
		$qQueue = evt.detail.items;
		if ($party.members.length < $party.max_size) {
			dropFromOthersDisabled = false;
		} else {
			dropFromOthersDisabled = true;
		}
	};

	const handleFinalizeQueue = (evt: CustomEvent<DndEvent<Viewer>>) => {
		$qQueue = evt.detail.items;
		dropFromOthersDisabled = $party.members.length >= $party.max_size;
	};

	const handleConsiderParty = (evt: CustomEvent<DndEvent<Viewer>>) => {
		$party.members = evt.detail.items;
		if ($party.members.length < $party.max_size) {
			dropFromOthersDisabled = false;
		} else {
			dropFromOthersDisabled = true;
		}
	};

	const handleFinalizeParty = (evt: CustomEvent<DndEvent<Viewer>>) => {
		$party.members = evt.detail.items;
		dropFromOthersDisabled = $party.members.length >= $party.max_size;
	};

	function RemoveFromQueue(id: number) {
		$qQueue = $qQueue.filter((t) => t.id != id);
		$party.members = $party.members.filter((t) => t.id != id);
	}

	function RemoveViewer(id: number) {
		viewers.update((viewers) => {
			return viewers.map((viewer) => {
				if (viewer.id === id) {
					return { ...viewer, participation_count: viewer.participation_count + 1 };
				}
				return viewer;
			});
		});
		$party.members = $party.members.filter((t) => t.id != id);
	}

	function IncrementPartySize() {
		$party.max_size++;
	}

	function DecrementPartySize() {
		$party.max_size--;
	}

	function EndParty() {
		for (let member in $party.members) {
			const viewerID = $party.members[member].id;
			viewers.update((currentViewers) => {
				return currentViewers.map((viewer) => {
					if (viewer.id === viewerID) {
						return { ...viewer, participation_count: viewer.participation_count + 1 };
					}
					return viewer;
				});
			});
		}
		$party.members = [];
	}
</script>

<div class="flex justify-center">
	<div class="h-screen overflow-y-auto bg-muted/35">
		<!-- <div class=" flex border-b border-secondary"> -->
		<!-- 	<div class="px-4 py-2"> -->
		<!-- 		Twitch: -->
		<!-- 		{#if twitch_connected} -->
		<!-- 			<span class="text-green-400">connected</span> -->
		<!-- 		{:else} -->
		<!-- 			<span class="text-red-400">disconnected</span> -->
		<!-- 		{/if} -->
		<!-- 	</div> -->
		<!-- 	<!-- <h2 class="place-self-center font-bold">Quicc Stream</h2> -->
		<!-- 	<div class="mx-auto gap-2 p-4"> -->
		<!-- 		<Button -->
		<!-- 			href="https://id.twitch.tv/oauth2/authorize?response_type=token&client_id=wryq0ptbcqok7crz9ajvlj25e05tqp&redirect_uri=http://localhost:5173/oauth&scope=user%3Aread%3Achat+channel%3Aread%3Aredemptions" -->
		<!-- 		> -->
		<!-- 			<Icons.twitch class="mr-1 h-5 w-5" /> -->
		<!-- 			Get Token -->
		<!-- 		</Button> -->
		<!-- 		{#if authenticated} -->
		<!-- 			<Button variant="destructive" on:click={RemoveToken}> -->
		<!-- 				<Icons.trash class="mr-1 h-5 w-5" /> -->
		<!-- 			</Button> -->
		<!-- 		{/if} -->
		<!-- 	</div> -->
		<!-- </div> -->
		<div class="flex justify-center gap-14">
			<div class="w-96">
				<div class="flex items-center focus-visible:ring-0">
					<Input
						bind:value={inputValue}
						on:keydown={(event) => event.key === 'Enter' && HandleInput()}
						class="my-4 focus-visible:ring-0"
					/>
					<Button on:click={HandleInput} variant="ghost" size="sm"
						><Icons.plus class="h-5 w-5" /></Button
					>
				</div>
				<section
					use:dndzone={{ items: $qQueue, flipDurationMs: flipDurationMs, dropTargetStyle: {} }}
					on:consider={handleConsiderQueue}
					on:finalize={handleFinalizeQueue}
					class="h-full"
				>
					{#each $qQueue as viewer (viewer.id)}
						<div
							in:fly={{ duration: 200, y: 500, opacity: 0.5, easing: quintOut }}
							animate:flip={{ duration: flipDurationMs }}
						>
							<div
								class="my-2 flex w-full items-center justify-between rounded border drop-shadow hover:bg-primary hover:drop-shadow-lg"
							>
								<div class="flex w-full items-center justify-between px-4">
									<span>
										{viewer.viewer}
									</span>
									<span class="text-xs font-light">
										Participation: {viewer.participation_count}
									</span>
								</div>
								<Button
									variant="ghost"
									size="sm"
									class="rounded-sm"
									on:click={() => RemoveFromQueue(viewer.id)}><Icons.x class="w-3, h-3" /></Button
								>
							</div>
						</div>
					{/each}
				</section>
			</div>
			<div class="w-96">
				<div class="border-b">
					<div class="relative flex">
						<h2 class="w-full text-center text-2xl font-bold">Available Positions</h2>
						<Button
							on:click={EndParty}
							size="sm"
							variant="destructive"
							class="absolute right-0 font-bold">End</Button
						>
					</div>
					<div class="flex items-center justify-center gap-4">
						<Button on:click={DecrementPartySize} size="icon" variant="ghost">
							<Icons.minus class="h-4 w-4" />
						</Button>
						<span class="text-center text-xl">
							{$party.max_size}
						</span>
						<Button on:click={IncrementPartySize} size="icon" variant="ghost">
							<Icons.plus class="h-4 w-4" />
						</Button>
					</div>
				</div>
				<section
					use:dndzone={{
						items: $party.members,
						flipDurationMs: flipDurationMs,
						dropTargetStyle: {},
						dropFromOthersDisabled
					}}
					on:consider={handleConsiderParty}
					on:finalize={handleFinalizeParty}
					class="h-full"
				>
					{#each $party.members as viewer (viewer.id)}
						<div animate:flip={{ duration: flipDurationMs }}>
							<div
								class="my-2 flex w-full items-center justify-between rounded border drop-shadow hover:bg-primary hover:drop-shadow-lg"
							>
								<div class="flex w-full items-center justify-between px-4">
									<span>
										{viewer.viewer}
									</span>
									<span class="text-xs font-light">
										Participation: {viewer.participation_count}
									</span>
								</div>
								<Button
									variant="ghost"
									size="sm"
									class="rounded-sm"
									on:click={() => RemoveViewer(viewer.id)}><Icons.check class="w-3, h-3" /></Button
								>
							</div>
						</div>
					{/each}
				</section>
			</div>
		</div>
	</div>
	<!-- <div -->
	<!-- 	class="my-auto max-h-[700px] w-full max-w-sm flex-col justify-center overflow-y-auto border border-l-0 p-6" -->
	<!-- > -->
	<!-- 	<section -->
	<!-- 		use:dndzone={{ items: $duels, flipDurationMs: flipDurationMs, dropTargetStyle: {} }} -->
	<!-- 		on:consider={handleConsiderDuel} -->
	<!-- 		on:finalize={handleFinalizeDuel} -->
	<!-- 	> -->
	<!-- 		{#each $duels as viewer (viewer.id)} -->
	<!-- 			<div -->
	<!-- 				in:fly={{ duration: 200, y: 500, opacity: 0.5, easing: quintOut }} -->
	<!-- 				animate:flip={{ duration: flipDurationMs }} -->
	<!-- 				class="relative my-2 flex w-full items-center justify-center rounded bg-destructive/15 py-2 drop-shadow hover:bg-destructive hover:drop-shadow-lg" -->
	<!-- 			> -->
	<!-- 				<div class=""> -->
	<!-- 					{viewer.viewer} -->
	<!-- 				</div> -->
	<!-- 				<Button -->
	<!-- 					variant="destructive" -->
	<!-- 					size="sm" -->
	<!-- 					class="absolute left-0 rounded-sm" -->
	<!-- 					on:click={() => RemoveFromDuel(viewer.id)}><Icons.x class="w-3, h-3" /></Button -->
	<!-- 				> -->
	<!-- 			</div> -->
	<!-- 		{/each} -->
	<!-- 	</section> -->
	<!-- </div> -->
</div>
