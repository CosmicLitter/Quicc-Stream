<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Icons } from '$lib/components/icons';
	import { page } from '$app/stores';
	import { PUBLIC_YOUTUBE_API_KEY } from '$env/static/public';
	import { clan, next_id, q_queue } from '$lib/stores/stores';
	import type { Member } from '$lib/types';
	import { browser } from '$app/environment';

	// TODO :
	// Duel channel redeem and duel list
	// Create chat bot and revise responses

	const CHANNEL_ID = 'UCs3qwo3NWpC9WviUuQfmlBw';
	let poll_youtube = false;
	// console.log($page);

	function DeleteToken() {
		localStorage.removeItem('Token');
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
		let polling_interval = 60000;

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
						if ($q_queue.find((item) => item.youtube_username === username)) {
							console.log(`${username} already in queue!`);
						} else {
							const member = $clan.find((item) => item.youtube_username === username);
							if (member) {
								// Add to queue
								console.log('Add to queue');
								$q_queue = [...$q_queue, member];
							} else {
								console.log('Destiny 2 name has not yet be linked!');
							}
						}
					}

					// link command missing argument, display usage
					// TODO : No youtube chat bot yet, display toast notifications for youtube commands instead.
					if (message == '!link') {
						const existing_member = $clan.find((item) => item.twitch_username === username);
						if (existing_member) {
							console.log('User already linked with: ', existing_member.d2_username);
						} else {
							console.log('User used link command incorrectly');
						}
					}

					// verify command arguments
					if (message.startsWith('!link ')) {
						// Check if twitch user is already on the list and return their linked account, else add and link the specified username
						const existing_member_by_youtube = $clan.find(
							(item) => item.youtube_username === username
						);
						if (existing_member_by_youtube) {
							// TODO : If we wanted we can change the logic here to update the linked account name instead
							console.log(
								`User already linked with destiny account: ${existing_member_by_youtube.d2_username}#${existing_member_by_youtube.d2_id}`
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
									if (!$clan[existing_index].youtube_username) {
										$clan[existing_index] = {
											...$clan[existing_index],
											youtube_username: username
										};
										console.log(`Updated existing Destiny account link to: ${username}`);
									} else {
										console.log(
											`${username} is associated with another Youtube user: ${$clan[existing_index]}`
										);
									}
								} else {
									// Associate new member to the clan
									member.youtube_username = username;
									$clan = [...$clan, member];
									$next_id++;
								}
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

<div class="grid h-[60px] grid-cols-[1fr,1fr,1fr] border bg-muted-foreground/10 px-2">
	<div class="justify-start self-center">
		<Button variant="destructive" on:click={DeleteToken}><Icons.trash class="h-5 w-5" /></Button>
		<Button
			class=""
			href="https://id.twitch.tv/oauth2/authorize?response_type=token&client_id=wryq0ptbcqok7crz9ajvlj25e05tqp&redirect_uri=http://localhost:4173/oauth&scope=user%3Aread%3Achat+user%3Awrite%3Achat+channel%3Aread%3Aredemptions"
		>
			<Icons.twitch class="h-5 w-5" />
		</Button>
		{#if poll_youtube}
			<Button variant="destructive" on:click={StopYoutubePolling}>
				<Icons.youtube class="h-5 w-5" />
			</Button>
		{:else}
			<Button on:click={StartYoutubePolling}>
				<Icons.youtube class="h-5 w-5 " />
			</Button>
		{/if}
	</div>

	<nav class="mx-auto flex px-4">
		<a href="/" class="border-l border-r p-4 shadow-inner hover:bg-white/10"><Icons.members /></a>
		<a href="/queue/" class="p-4 shadow-inner hover:bg-white/10"><Icons.list_start /></a>
		<a href="/duels/" class="border-l border-r p-4 shadow-inner hover:bg-white/10"
			><Icons.swords /></a
		>
		<a href="/oldqueue/" class="border-l border-r p-4 shadow-inner hover:bg-white/10"
			><Icons.list_end /></a
		>
	</nav>
</div>
