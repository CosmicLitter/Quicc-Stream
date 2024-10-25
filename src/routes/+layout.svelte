<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import '../app.css';
	import { PUBLIC_TWITCH_APP_CLIENT_ID } from '$env/static/public';
	import {
		qQueue,
		q_queue,
		viewers,
		fire_team,
		duels,
		duel_id,
		clan,
		next_id
	} from '$lib/stores/stores';
	import type { Member } from '$lib/types';
	import Header from '$lib/components/header/Header.svelte';
	import { browser } from '$app/environment';
	import { PubSubHandler } from '@twurple/pubsub';
	import { api, pubsub_client } from '$lib/twitchauth';

	let reward_id = '0';

	let token;
	if (browser) {
		token = localStorage.getItem('Token');
	}

	const use_mock_server = false;
	let redeem_handler: PubSubHandler;

	let client_id: string;
	let client_secret: string;
	let user_id: string;
	let socket: WebSocket | null;
	let session_id: string;
	let twitch_authenticated = false;
	let user: string;
	$: twitch_connected = false;

	onMount(async () => {
		twitch_authenticated = IsAuthenticated();
		if (use_mock_server) {
			await GetAccessToken();
		}
		if (twitch_authenticated) {
			console.log('User Access token present, connecting to Twitch...');
			await GetUserID();
			InitializeWebSocket();
		}
		InitializePubSub();
	});

	onDestroy(() => {
		if (socket) {
			socket.close();
			socket = null;
			// twitch_connected = false;
		}
		// pubsub_client.removeHandler(redeem_handler);
	});

	async function GetUser(username: string) {
		try {
			const user = await api.users.getUserByName(username);
			// return {
			// 	broadcasterType: user?.broadcasterType,
			// 	displayName: user?.displayName,
			// 	description: user?.description,
			// 	userId: user?.id,
			// 	profilePictureUrl: user?.profilePictureUrl,
			// 	type: user?.type,
			// 	name: user?.name
			// };
			if (user) return user.id;
		} catch (error) {
			console.error('Failed to fetch user:', error);
			return null;
		}
	}

	async function InitializePubSub() {
		const user_id = await GetUser('q_quicc');
		pubsub_client.onListenError((handler, error, userInitiated) => {
			console.log(handler);
			console.log(error);
			console.log(userInitiated);
		});

		redeem_handler = pubsub_client.onRedemption(user_id!, (redemption) => {
			console.log(redemption);
			if (redemption.id === reward_id || redemption.rewardId === reward_id) {
				console.log(`${redemption.userDisplayName} has redeemed a duel!`);
				$duels = [...$duels, { id: $duel_id, name: redemption.userDisplayName }];
				$duel_id++;
				SendChatMessage(`@${redemption.userDisplayName} has been added to the duel list`);
			}
		});
	}

	function GetToken() {
		return localStorage.getItem('Token');
	}

	function IsAuthenticated() {
		return !!GetToken();
	}

	function DeleteToken() {
		localStorage.removeItem('Token');
		twitch_authenticated = false;
	}

	async function GetUserID() {
		const res = await fetch('https://api.twitch.tv/helix/users', {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${localStorage.getItem('Token')}`,
				'Client-Id': PUBLIC_TWITCH_APP_CLIENT_ID
			}
		});
		const data = await res.json();
		user_id = data.data[0].id;
	}

	async function GetAccessToken() {
		const res = await fetch('http://localhost:8000/units/clients');
		const data = await res.json();
		client_id = data.data[0].ID;
		client_secret = data.data[0].Secret;

		if (!client_id || !client_secret) {
			console.error('Failed to get client id & secrete');
			return;
		}

		const user_id = await GetUsers();
		// console.log(user_id);

		const response = await fetch(
			`http://localhost:8000/auth/authorize?client_id=${client_id}&client_secret=${client_secret}&grant_type=user_token&user_id=${user_id}&scope=channel:read:redemptions`,
			{
				method: 'POST'
			}
		);
		const token_data = await response.json();
		console.log(token_data);
	}

	async function GetUsers() {
		const res = await fetch('http://localhost:8000/units/users');
		const data = await res.json();
		// console.log(data);
		return data.data[0].id;
	}

	function InitializeWebSocket() {
		if (socket) return;

		if (use_mock_server) {
			socket = new WebSocket('ws://localhost:8080/ws');
		} else {
			socket = new WebSocket('wss://eventsub.wss.twitch.tv/ws');
		}

		socket.onopen = () => {
			console.log('Connected to the Twitch Websocket');
			twitch_connected = true;
		};

		socket.onmessage = (event) => {
			const data = JSON.parse(event.data);
			console.log('Message received from server: ', data);
			HandleWebSocketMessage(data);
		};

		socket.onclose = (event) => {
			console.log('WebSocket closed: ', event);
			twitch_connected = false;
			socket = null;
		};

		socket.onerror = (error) => {
			console.error('Websocket Error', error);
			twitch_connected = false;
			socket = null;
		};
	}

	async function ChatSubscription() {
		const type = 'channel.chat.message';
		const version = '1';
		const condition = {
			broadcaster_user_id: user_id,
			user_id
		};
		const transport = {
			method: 'websocket',
			session_id: session_id
		};
		const res = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${localStorage.getItem('Token')}`,
				'Client-Id': PUBLIC_TWITCH_APP_CLIENT_ID,
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
		console.log('Chat Subscription', data);
	}

	async function PointRedeemSubscription() {
		const type = 'channel.channel_points_automatic_reward_redemption.add';
		const version = '1';
		const condition = {
			broadcaster_user_id: user_id.toString()
		};
		const transport = {
			method: 'websocket',
			session_id: session_id
		};
		const res = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${localStorage.getItem('Token')}`,
				'Client-Id': PUBLIC_TWITCH_APP_CLIENT_ID,
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

	function HandleWebSocketMessage(data: any) {
		switch (data.metadata.message_type) {
			case 'session_welcome':
				session_id = data.payload.session.id;
				ChatSubscription();
				// PointRedeemSubscription();
				break;
			case 'notification':
				switch (data.metadata.subscription_type) {
					case 'channel.chat.message':
						const message = data.payload.event.message.text;
						const username = data.payload.event.chatter_user_login;

						// Twitch Display name, only used for checking old queue
						const twitch_display_name = data.payload.event.chatter_user_name;
						console.log(`${username}: ${message}`);

						// Join queue command
						// NOTE : Check the old queue, once that queue is empty this can be removed
						if (message == '!dibs') {
							if ($qQueue.find((item) => item.viewer === twitch_display_name)) {
								SendChatMessage(`@${twitch_display_name} You are currently in the queue`);
								break;
							}

							// Check if viewer is in the queue
							if ($q_queue.find((item) => item.twitch_username === username)) {
								SendChatMessage(`@${twitch_display_name} You are currently in the queue`);
								break;
							}

							// Check if the viewer is a member, if so add to queue if they are not already in the queue or the party
							const member = $clan.find((item) => item.twitch_username === username);
							if (member) {
								// Add to queue
								if ($fire_team.members.find((item) => item.twitch_username === username)) {
									SendChatMessage(
										`@${twitch_display_name} You're in the fireteam! Wait until the party has ended then use the !dibs command again`
									);
									break;
								}
								$q_queue = [...$q_queue, member];
								SendChatMessage(`@${twitch_display_name} You have been added to the queue`);
							} else {
								SendChatMessage(
									`@${twitch_display_name} Please use the !link command to let us know your destiny username with its 4 digit number and then call dibs again. :)`
								);
							}
						}

						// link command missing argument, display usage
						if (message == '!link') {
							const existing_member = $clan.find((item) => item.twitch_username === username);
							if (existing_member) {
								SendChatMessage(
									`@${twitch_display_name} You are already linked with destiny account: ${existing_member.d2_username}#${existing_member.d2_id}`
								);
							} else {
								SendChatMessage(
									`@${twitch_display_name} Include your destiny account name when using the !link command, like so: !link YourUsername#1234`
								);
							}
						}

						// verify command arguments
						if (message.startsWith('!link ')) {
							// Check if twitch user is already on the list and return their linked account, else add and link the specified username
							const existing_member_by_twitch = $clan.find(
								(item) => item.twitch_username === username
							);
							if (existing_member_by_twitch) {
								// TODO : If we wanted we can change the logic here to update the linked account name instead
								SendChatMessage(
									`You are already linked with destiny account: ${existing_member_by_twitch.d2_username}#${existing_member_by_twitch.d2_id}`
								);
							} else {
								// Validate d2 username and return a member if they exist, otherwise create a new member. Null if command usage was incorrect
								let member: Member | null = LinkD2Account(message);
								console.log(member);

								if (member) {
									const existing_index = $clan.findIndex(
										(item) => item.d2_username === member.d2_username && item.d2_id == member.d2_id
									);

									if (existing_index !== -1) {
										if (!$clan[existing_index].twitch_username) {
											$clan[existing_index] = {
												...$clan[existing_index],
												twitch_username: username
											};
											console.log(
												`Updating existing member ${$clan[existing_index].d2_username} with twitch username ${username}`
											);
											SendChatMessage(
												`@${twitch_display_name} I found an existing link to this username from youtube, updating your existing entry`
											);
										} else {
											// Destiny account linked to another user, hopefully this doesn't happen
											console.log(
												`${member.d2_username}#${member.d2_id} already associated with twitch user ${$clan[existing_index].twitch_username}`
											);
										}
									} else {
										member.twitch_username = username;
										$clan = [...$clan, member];
										$next_id++;
										SendChatMessage(
											`@${twitch_display_name} Success! Use the !dibs command to join the queue`
										);
									}
									// if (!member.twitch_username) {
									// 	member.twitch_username = username;
									// 	$clan = [...$clan, member];
									// 	$next_id++;
									// 	SendChatMessage('Successfully linked!');
									// } else {
									// 	SendChatMessage(
									// 		`Uh oh, your destiny username is already linked with twitch user: ${member.twitch_username}!`
									// 	);
									// }
								} else {
									SendChatMessage(
										`@${twitch_display_name} Sorry, I was unable to link your account. Please try again and ensure it is a valid Destiny 2 account name with the 4 digit account number: YourUsername#1234`
									);
								}
							}
						}
						break;

					// case 'channel.channel_points_automatic_reward_redemption.add':
					// 	const twitch_login = data.payload.event.user_login;
					// 	const reward_redeemed = data.payload.event.reward.type;
					// 	console.log(`${twitch_login} has redeemed ${reward_redeemed}`);
					// 	console.log('CHANNEL REDEEM DATA: ', data);
					//
					// 	// Find backend name for the duel redeem
					// 	if (reward_redeemed.toLowerCase() == 'a_duel') {
					// 		console.log(`${twitch_login} has requested a duel!`);
					// 		$duels = [...$duels, { id: $duel_id, name: twitch_login }];
					// 		$duel_id++;
					// 	}
				}
		}
	}

	async function SendChatMessage(text: string) {
		const res = await fetch('https://api.twitch.tv/helix/chat/messages', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${localStorage.getItem('Token')}`,
				'Client-Id': PUBLIC_TWITCH_APP_CLIENT_ID,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				broadcaster_id: user_id,
				sender_id: user_id,
				message: text
			})
		});

		if (!res.ok) {
			const data = await res.json();
			console.error('Failed to send chat message');
			console.error(data);
		} else {
			console.log('Sent chat message: ' + text);
		}
	}

	function Queue(name: string) {
		if (!$viewers.some((viewer) => viewer.viewer === name)) {
			console.log('New viewer! Adding ' + name + ' to the viewers list');
			// AddMember(name);
		}
	}

	function AddMember(member: Member) {
		// if (
		// 	!$clan.some(
		// 		(item) => `${item.d2_username}#${item.d2_id}` === `${member.d2_username}#${member.d2_id}`
		// 	)
		// ) {
		$clan = [...$clan, member];
		return 'Successfully Added!';
		// }
		// {
		// 	return 'Already Linked!';
		// }
	}

	function LinkD2Account(message: string) {
		const account_name = message.split('!link ')[1];

		if (account_name && account_name.includes('#')) {
			const [display_name, account_number] = account_name.split('#');

			if (/^\d{4}$/.test(account_number)) {
				console.log(`${display_name}#${account_number}`);

				const existing_member = $clan.find(
					(item) => item.d2_username === display_name && item.d2_id == account_number
				);

				if (existing_member) {
					return existing_member;
				} else {
					const new_member: Member = {
						id: $next_id,
						d2_username: display_name,
						d2_id: account_number,
						participation_count: 0,
						win_count: 0,
						loss_count: 0
					};
					return new_member;
				}
			}
		}
		return null;
	}
</script>

<Header />
<div class="absolute -top-1 right-0">
	Twitch:
	{#if twitch_connected}
		<span class="text-green-400">connected</span>
	{:else}
		<span class="text-red-400">disconnected</span>
	{/if}
</div>

<slot />
