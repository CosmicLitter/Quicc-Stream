import { browser } from "$app/environment";
import { PUBLIC_TWITCH_APP_CLIENT_ID } from "$env/static/public";
import { ApiClient } from "@twurple/api";
import { StaticAuthProvider } from "@twurple/auth";
import { PubSubClient } from "@twurple/pubsub";


let api: ApiClient;
let pubsub_client: PubSubClient

if (browser) {
	const token = localStorage.getItem('Token')
	const auth_provider = new StaticAuthProvider(PUBLIC_TWITCH_APP_CLIENT_ID, token!);
	pubsub_client = new PubSubClient({ authProvider: auth_provider });
	api = new ApiClient({ authProvider: auth_provider })
}

export { api, pubsub_client }


