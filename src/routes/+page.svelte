<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Icons } from '$lib/components/icons/index';
	import { onMount, onDestroy } from 'svelte';
	import { dndzone } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import { qQueue } from '$lib/stores/stores';
	import { viewers } from '$lib/stores/stores';
	import { get } from 'svelte/store';
	import { count } from '$lib/stores/stores';
	import { party } from '$lib/stores/stores';
	import type { Viewer } from '$lib/types';

	// let queue = $qQueue;

	const flipDurationMs = 100;
	$: authenticated = false;
	$: userID = 0;
	let sessionID: string;

	let inputValue = '';

	// console.log('count:', get(count));
	function HandleInput() {
		if (inputValue.trim() !== '') {
			AddUser(inputValue);
		}
		inputValue = '';
	}

	function AddUser(name: string) {
		// Add new viewer to all viwers list if they are not on the list
		// console.log('Adding', name);
		if (!$viewers.some((item) => item.viewer.toLowerCase() === name.toLowerCase())) {
			// console.log(name, 'is a new viewer. Adding them to the viewer list');
			$viewers = [...$viewers, { id: $count, viewer: name, participation_count: 0 }];
			$count++;
		}

		// Add viewer to queue
		if (!$qQueue.some((item) => item.viewer.toLowerCase() === name.toLowerCase())) {
			const viewer = $viewers.find((user) => user.viewer.toLowerCase() === name.toLowerCase());
			if (viewer) $qQueue = [...$qQueue, viewer];
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
			await GetUserID();
			InitializeWebSocket();
		}
	});

	// console.log(userID);

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
		};

		socket.onclose = (event) => {
			console.log('WebSocket closed:', event);
			socket = null;
		};

		socket.onerror = (error) => {
			console.error('WebSocket Error', error);
		};
	}

	onDestroy(() => {
		if (socket) {
			socket.close();
			socket = null;
		}
	});

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
		console.log(data);
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

	function RemoveViewer(id: number) {
		$qQueue = $qQueue.filter((t) => t.id != id);
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
			// console.log(viewerID);
			$viewers.map((viewer) => {
				if (viewer.id === viewerID) {
					viewer.participation_count++;
				}
			});
		}
		$party.members = [];
	}
</script>

<div class="mx-auto h-screen w-full max-w-6xl overflow-y-auto bg-muted/35">
	<div class=" flex border-b border-secondary">
		<!-- <h2 class="place-self-center font-bold">Quicc Stream</h2> -->
		<div class="mx-auto gap-2 p-4">
			<Button
				href="https://id.twitch.tv/oauth2/authorize?response_type=token&client_id=wryq0ptbcqok7crz9ajvlj25e05tqp&redirect_uri=http://localhost:5173/oauth&scope=user%3Aread%3Achat"
			>
				<Icons.twitch class="mr-1 h-5 w-5" />
				Get Token
			</Button>
			{#if authenticated}
				<Button variant="destructive" on:click={RemoveToken}>
					<Icons.trash class="mr-1 h-5 w-5" />
				</Button>
			{/if}
		</div>
	</div>
	<!-- {userID} -->
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
								on:click={() => RemoveViewer(viewer.id)}><Icons.x class="w-3, h-3" /></Button
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
								on:click={() => RemoveViewer(viewer.id)}><Icons.x class="w-3, h-3" /></Button
							>
						</div>
					</div>
				{/each}
			</section>
		</div>
	</div>
</div>
