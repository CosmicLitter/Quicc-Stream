import { browser } from '$app/environment'
import { PUBLIC_TWITCH_APP_CLIENT_ID } from '$env/static/public'
import { ApiClient } from '@twurple/api'
import { StaticAuthProvider } from '@twurple/auth'
import { PubSubClient } from '@twurple/pubsub'
import { ChatClient } from '@twurple/chat'

let twitchApi: ApiClient;
let pubSubClient: PubSubClient;
let chatClient: ChatClient;

if (browser) {
	const token = localStorage.getItem('Token')
	const authProvider = new StaticAuthProvider(PUBLIC_TWITCH_APP_CLIENT_ID, token!);
	pubSubClient = new PubSubClient({ authProvider });
	twitchApi = new ApiClient({ authProvider });
	chatClient = new ChatClient({ authProvider });
}

export { twitchApi, pubSubClient, chatClient }
