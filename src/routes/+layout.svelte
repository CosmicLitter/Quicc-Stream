<script lang="ts">
	import '../app.css';
	import * as Sidebar from '$lib/components/ui/sidebar/index';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import { Toaster } from '$lib/components/ui/sonner/index';
	import { Button } from '$lib/components/ui/button';
	import { Icons } from '$lib/components/icons';
	import { onDestroy, onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { PUBLIC_TWITCH_APP_CLIENT_ID, PUBLIC_YOUTUBE_API_KEY } from '$env/static/public';
	import { qQueue, roster } from '$lib/states/global.svelte';
	import { DestinyService } from '$lib/services/destiny';
	import type { Member } from '$lib/types';
	import { toast } from 'svelte-sonner';
	import { PubSubHandler } from '@twurple/pubsub';
	import { twitchApi, pubSubClient } from '$lib/twitchauth';
	import { duelList, nextDuelId } from '$lib/states/duels.svelte';

	// TODO :
	// - Style sonner
	// - Clean up return messages from api endpoints to provide feedback through sonner
	// Before going full production:
	// - Move API calls to the server:

	// TODO :
	// Priority:
	//  - Duel page

	let twitchConnected = $state(false);
	const CHANNEL_ID = 'UCs3qwo3NWpC9WviUuQfmlBw';
	let poll_youtube = $state(false);

	let { children, data } = $props();
	let userId: string;
	let socket: WebSocket | null;
	let sessionId: string;

	let redeem_handler: PubSubHandler;

	let reward_id = '00a32847-d11e-4997-bb9d-99209415728f';

	const destinyService = new DestinyService();

	onMount(async () => {
		roster.FetchMembers();
		twitchConnected = IsAuthenticated();
		if (IsAuthenticated()) {
			console.log('User Access token present, connecting to twitch...');
			await GetUserID();
			InitializeWebSocket();
		}

		InitializePubSub();
	});

	onDestroy(async () => {
		roster.Destroy();
		if (socket) {
			socket.close();
			socket = null;
		}

		// pubSubClient.removeHandler(redeem_handler);
	});

	async function InitializePubSub() {
		const user_id = await GetUser('q_quicc');
		pubSubClient.onListenError((handler, error, userInitiated) => {
			console.log(handler);
			console.log(error);
			console.log(userInitiated);
		});

		redeem_handler = pubSubClient.onRedemption(user_id!, (redemption) => {
			console.log(redemption);
			console.log('DUEL REDEMPTION ID:', reward_id);
			console.log('RECEIVED REDEMPTION ID 1: ', redemption.id, '2: ', redemption.rewardId);
			if (redemption.rewardId == reward_id) {
				console.log(`${redemption.userDisplayName} has redeemed a duel!`);
				duelList.value.push({ id: nextDuelId.value, username: redemption.userDisplayName });
				nextDuelId.value++;
				// SendChatMessage(`@${redemption.userDisplayName} has been added to the duel list`);
			} else if (
				redemption.rewardTitle == 'A Duel' ||
				redemption.rewardTitle == 'a_duel' ||
				redemption.rewardTitle == 'a duel'
			) {
				console.log(`${redemption.userDisplayName} has redeemed a duel!`);
				duelList.value.push({ id: nextDuelId.value, username: redemption.userDisplayName });
				nextDuelId.value++;
			}
		});
	}

	async function GetUser(username: string) {
		try {
			const user = await twitchApi.users.getUserByName(username);
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

	async function YoutubeStuff() {
		const res = await fetch(
			`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&order=date&maxResults=50&type=video&key=${PUBLIC_YOUTUBE_API_KEY}`
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
		console.log('Live broadcast video id', video_id);

		if (video_id) {
			const res = await fetch(
				`https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails,snippet&id=${video_id}&key=${PUBLIC_YOUTUBE_API_KEY}`
			);
			const streamdata = await res.json();
			console.log('streamdata', streamdata);

			// console.log(streamdata.items[0].liveStreamingDetails.activeLiveChatId);

			const live_chat_id = streamdata.items[0].liveStreamingDetails.activeLiveChatId;
			console.log('live Chat Id', live_chat_id);

			await PollChatMessages(live_chat_id);
		}
	}

	async function PollChatMessages(live_chat_id: string) {
		let next_page_token = '';
		let polling_interval = 20000;

		poll_youtube = true;

		while (poll_youtube) {
			console.log('polling chat');
			const url = `https://www.googleapis.com/youtube/v3/liveChat/messages?liveChatId=${live_chat_id}&part=snippet,authorDetails&maxResults=2000${next_page_token ? `&pageToken=${next_page_token}` : ``}&key=${PUBLIC_YOUTUBE_API_KEY}`;

			const res = await fetch(url);
			const data = await res.json();
			console.log(data);

			if (data.items) {
				for (let item of data.items) {
					let username = item.authorDetails.displayName;
					let message = item.snippet.displayMessage;

					if (message == '!dibs') {
						if (qQueue.open) {
							if (qQueue.GetQueue().some((item) => item.youtubeUsername === username)) {
								console.log(`${username} already in queue!`);
							} else {
								const member = roster
									.GetMembers()
									.find((item) => item.youtubeUsername === username);
								if (member) {
									// Add to queue
									console.log('Add to queue');
									const memberToQueue = roster
										.GetMembers()
										.find((viewer) => viewer.youtubeUsername === username);
									if (!memberToQueue) return;
									qQueue.AddViewer(
										memberToQueue.d2Username,
										memberToQueue.d2Id,
										memberToQueue.sessionCount,
										memberToQueue.twitchUsername,
										memberToQueue.youtubeUsername
									);
									console.log('adding to queue:', memberToQueue);
									toast(`${memberToQueue.d2Username}#${memberToQueue.d2Id} was added`);
								} else {
									console.log('Destiny 2 name has not yet be linked!');
								}
							}
						} else {
							console.log('Queue is not currently open!');
						}
					}

					// link command missing argument, display usage
					// TODO : No youtube chat bot yet, display toast notifications for youtube commands instead.
					if (message == '!link') {
						const existingMember = roster
							.GetMembers()
							.find((item) => item.youtubeUsername === username);
						if (existingMember) {
							console.log('User already linked with: ', existingMember.d2Username);
							toast(
								`${username} used the !link command, but it already linked with ${existingMember.d2Username}#${existingMember.d2Id}`
							);
						} else {
							console.log('User used link command incorrectly');
							toast(
								`${username} used the link command but either did not provide their account name and ID `
							);
						}
					}

					// verify command arguments
					if (message.startsWith('!link ')) {
						// Check if twitch user is already on the list and return their linked account, else add and link the specified username
						const existing_member_by_youtube = roster
							.GetMembers()
							.find((item) => item.youtubeUsername === username);
						if (existing_member_by_youtube) {
							// TODO : If we wanted we can change the logic here to update the linked account name instead
							console.log(
								`User already linked with destiny account: ${existing_member_by_youtube.d2Username}#${existing_member_by_youtube.d2Id}`
							);
							toast(
								`${username} is already linked with destiny account: ${existing_member_by_youtube.d2Username}#${existing_member_by_youtube.d2Id}`
							);
						} else {
							// Validate d2 username and return a member if they exist, otherwise create a new member. Null if command usage was incorrect
							let member: Member | undefined = await LinkD2Account(message);
							console.log(member);

							if (member) {
								const existing_index = roster
									.GetMembers()
									.findIndex(
										(item) => item.d2Username === member.d2Username && item.d2Id == member.d2Id
									);

								if (existing_index !== -1) {
									if (!roster.GetMembers()[existing_index].youtubeUsername) {
										// roster.GetMembers()[existing_index] = {
										// 	...roster.GetMembers()[existing_index],
										// 	youtubeUsername: username
										// };
										member.youtubeUsername = username;
										const response = await fetch('./api/db/updatemember', {
											method: 'POST',
											headers: {
												'Content-Type': 'application/json'
											},
											body: JSON.stringify({ member: member })
										});
										console.log(`Updated existing Destiny account link to: ${username}`);
										toast(
											`Updating existing Destiny account link to ${username}: ${member.d2Username}#${member.d2Id}`
										);
									} else {
										console.log(
											`${username} is associated with another Youtube user: ${roster.GetMembers()[existing_index].youtubeUsername}`
										);
									}
								} else {
									// Associate new member to the clan
									member.youtubeUsername = username;
									const response = await fetch('./api/db/addmember', {
										method: 'POST',
										headers: {
											'Content-Type': 'application/json'
										},
										body: JSON.stringify({ member: member })
									});

									if (!response.ok) {
										const error = await response.json();
										throw new Error(error.message || 'Failed to add member');
									}

									toast(`${member.d2Username}#${member.d2Id} was successfully added`);
									console.log(response.json());
								}
							} else {
								toast(
									`Account link failed. Could not verify the destiny account provided by ${username}`
								);
							}
						}
					}
				}

				next_page_token = data.nextPageToken || '';
				// polling_interval = data.pollingIntervalMillis || 5000;

				await new Promise((resolve) => setTimeout(resolve, polling_interval));
			}
		}
	}

	function StartYoutubePolling() {
		YoutubeStuff();
	}

	function StopYoutubePolling() {
		poll_youtube = false;
	}

	function InitializeWebSocket() {
		if (socket) return;

		socket = new WebSocket('wss://eventsub.wss.twitch.tv/ws');

		socket.onopen = () => {
			console.log('Connected to the Twitch Websocket');
			twitchConnected = true;
		};

		socket.onmessage = (event) => {
			const data = JSON.parse(event.data);
			// console.log('Message received from server: ', data);
			HandleWebSocketMessage(data);
		};

		socket.onclose = (event) => {
			console.log('WebSocket closed: ', event);
			twitchConnected = false;
			socket = null;
		};

		socket.onerror = (error) => {
			console.error('Websocket Error', error);
			twitchConnected = false;
			socket = null;
		};
	}

	async function ChatSubscription() {
		const type = 'channel.chat.message';
		const version = '1';
		const condition = {
			broadcaster_user_id: userId,
			user_id: userId
		};
		const transport = {
			method: 'websocket',
			session_id: sessionId
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

	async function HandleWebSocketMessage(data: any) {
		switch (data.metadata.message_type) {
			case 'session_welcome':
				sessionId = data.payload.session.id;
				ChatSubscription();
				// PointRedeemSubscription();
				break;
			case 'notification':
				switch (data.metadata.subscription_type) {
					case 'channel.chat.message':
						const message = data.payload.event.message.text;
						const username = data.payload.event.chatter_user_login;
						const twitchDisplayName = data.payload.event.chatter_user_name;

						if (message == '!dibs') {
							// The dibs command will add a viewer to the queue so long as the queue is enabled
							//  - Viewers should only be added to queue if they are on the roster after linking their destiny account name
							//    - Provide instructions on linking their account if they are not on the roster
							//  - break out of the case if they are already in the queue
							if (!roster.GetMembers().some((viewer) => viewer.twitchUsername === username)) {
								SendChatMessage(
									`@${twitchDisplayName} Please provide your destiny account name with "!link YourUsername#1234" and then use the !dibs command again`
								);
								break;
							}
							if (qQueue.GetQueue().some((viewer) => viewer.twitchUsername === username)) {
								console.log(`${username} is already in the queue`);
							} else {
								if (qQueue.open) {
									const memberToQueue = roster
										.GetMembers()
										.find((viewer) => viewer.twitchUsername === username);
									if (!memberToQueue) break;
									qQueue.AddViewer(
										memberToQueue.d2Username,
										memberToQueue.d2Id,
										memberToQueue.sessionCount,
										memberToQueue.twitchUsername,
										memberToQueue.youtubeUsername
									);
									console.log('adding to queue:', memberToQueue);
									// $state.snapshot(memberToQueue);
									toast(`${memberToQueue.d2Username}#${memberToQueue.d2Id} was added`);
								} else {
									console.log('Queue is not currently open!');
								}
							}
							break;
						}

						if (message == '!link') {
							// The link command without an argument will verify if the viewer has already linked their destiny account, if not, it provides them with usage instructions
							const existingMember = roster
								.GetMembers()
								.find((member) => member.twitchUsername === username);

							if (existingMember) {
								SendChatMessage(
									`@${twitchDisplayName} You are already linked with destiny account ${existingMember.d2Username}#${existingMember.d2Id}`
								);
							} else {
								SendChatMessage(
									`@${twitchDisplayName} Include your destiny account name when using the !link command, like so: !link YourUsername#1234`
								);
							}
						}

						if (message.startsWith('!link ')) {
							// Send the message to the LinkD2Account function, which will be shared with the youtube chat. It will validate the d2 username and id number and return either a new member, or an existing member of the roster
							let member: Member | undefined = await LinkD2Account(message);
							console.log('Member:', member);

							if (member) {
								// A valid member was returned, check if they are already on the roster and get their position in the array
								const existingIndex = roster
									.GetMembers()
									.findIndex((item) => item.bungieNetMembershipId === member.bungieNetMembershipId);

								if (existingIndex !== -1) {
									// If the viewer is found in the roster, check if the twitch username field can be populated
									if (!roster.GetMembers()[existingIndex].twitchUsername) {
										console.log('Existing user, probably added from youtube.');
										member.twitchUsername = username;
										const response = await fetch('./api/db/updatemember', {
											method: 'POST',
											headers: {
												'Content-Type': 'application/json'
											},
											body: JSON.stringify({ member: member })
										});

										if (!response.ok) {
											const error = await response.json();
											throw new Error(error.message || 'Failed to update member');
										}

										toast(`${member.d2Username}#${member.d2Id} has been successfully updated`);
									} else {
										// twitchusername field is already populated with a different viewer. Since we're going off twitch account name instead of display name, hopefully this won't happen.
										console.log('Destiny account linked with another twitch username!');
									}
								} else {
									// Viewer is not on the roster, populate the twitch username field and add them to the database
									member.twitchUsername = username;
									const response = await fetch('./api/db/addmember', {
										method: 'POST',
										headers: {
											'Content-Type': 'application/json'
										},
										body: JSON.stringify({ member: member })
									});

									if (!response.ok) {
										const error = await response.json();
										throw new Error(error.message || 'Failed to add member');
									}

									toast(`${member.d2Username}#${member.d2Id} was successfully added`);

									console.log(response.json());
									SendChatMessage(
										`@${twitchDisplayName} Success! You can now use the !dibs command to join the queue when it is open`
									);
								}
							} else {
								// Could not find a valid D2 account
								SendChatMessage(
									`@${twitchDisplayName} I was not able to locate a valid destiny account. Make sure the username and account ID are correct.`
								);
							}
						}
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
				broadcaster_id: userId,
				sender_id: userId,
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

	async function LinkD2Account(message: string) {
		const accountName = message.split('!link ')[1];

		if (accountName && accountName.includes('#')) {
			const [displayName, accountNumber] = accountName.split('#');

			if (/^\d{4}$/.test(accountNumber)) {
				console.log(`${displayName}#${accountNumber}`);

				const existingMember = roster
					.GetMembers()
					.find((member) => displayName === member.d2Username && accountNumber === member.d2Id);

				if (existingMember) {
					return existingMember;
				} else {
					console.log(displayName);
					const searchResponse = await destinyService.searchUser(displayName);
					console.log(searchResponse);
					const matchingUser = searchResponse.Response.searchResults.find(
						(result) => result.bungieGlobalDisplayNameCode === Number(accountNumber)
					);
					if (matchingUser) {
						const activeMembership = await destinyService.determineActiveMembership(matchingUser);

						console.log(activeMembership);
						const newMember: Member = {
							d2Username: displayName,
							d2Id: accountNumber,
							// twitchUsername: member.twitch_username,
							// youtubeUsername: member.youtube_username,
							sessionCount: 0,
							isActive: true,
							bungieNetMembershipId: activeMembership.bungieNetMembershipId,
							membershipId: activeMembership.membershipId,
							membershipType: activeMembership.membershipType
						};
						return newMember;
					}
				}
			}
		}
	}

	function GetToken() {
		if (browser) return localStorage.getItem('Token');
	}

	function IsAuthenticated() {
		return !!GetToken();
	}

	function DeleteToken() {
		if (browser) {
			localStorage.removeItem('Token');
			twitchConnected = false;
		}
	}

	function OpenRaffle() {
		qQueue.open = true;
		SendChatMessage(
			`Looking for fireteam members! If you want to join use the !dibs command for a chance to be selected. Be sure to !link your account if you haven't done so already!`
		);
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
		userId = data.data[0].id;
	}
</script>

<Toaster />

<Sidebar.Provider>
	<AppSidebar />
	<Sidebar.Inset>
		<main class="h-full overflow-y-auto rounded-xl border">
			<header class="flex h-[60px] shrink-0 items-center gap-2">
				<div class="flex w-full items-center gap-2 px-4">
					<Sidebar.Trigger class="-ml-1" />
					{#if twitchConnected}
						<Button onclick={DeleteToken} variant="destructive"><Icons.twitch /></Button>
					{:else}
						<Button
							href="https://id.twitch.tv/oauth2/authorize?response_type=token&client_id=wryq0ptbcqok7crz9ajvlj25e05tqp&redirect_uri=http://localhost:4173/oauth&scope=user%3Aread%3Achat+user%3Awrite%3Achat+channel%3Aread%3Aredemptions"
							><Icons.twitch /></Button
						>
					{/if}
					{#if poll_youtube}
						<Button variant="destructive" onclick={StopYoutubePolling}>
							<Icons.youtube class="h-5 w-5" />
						</Button>
					{:else}
						<Button onclick={StartYoutubePolling}>
							<Icons.youtube class="h-5 w-5 " />
						</Button>
					{/if}
					<!-- <Button><Icons.youtube /></Button> -->
					<div class="ml-auto">
						{#if qQueue.open}
							<Button variant="destructive" onclick={() => (qQueue.open = false)}
								><Icons.tickets /></Button
							>
						{:else}
							<Button onclick={OpenRaffle}><Icons.tickets /></Button>
						{/if}
					</div>
				</div>
			</header>

			{@render children()}
		</main>
	</Sidebar.Inset>
</Sidebar.Provider>
