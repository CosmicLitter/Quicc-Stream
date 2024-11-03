<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { qQueue } from '$lib/states/global.svelte';
	import QueueDashboard from '$lib/components/queue-dashboard/queue-dashboard.svelte';

	// qQueue.AddViewer('ShadowHunter', '0101', 5, 'Shadow_Twitch', undefined);
	// qQueue.AddViewer('WarlockPrime', '0102', 3, undefined, 'PrimeYT');
	// qQueue.AddViewer('TitanRider', '0103', 2, 'RiderTwitch', 'TitanRiderYT');
	// qQueue.AddViewer('GhostKiller', '0104', 7, undefined, 'GhostKillerD2');
	// qQueue.AddViewer('VexDestroyer', '0105', 4, 'Vex_Twitch', undefined);
	// qQueue.AddViewer('LightBringer', '0106', 3, undefined, 'LightBringerOfficial');
	// qQueue.AddViewer('FallenSniper', '0107', 6, 'SniperFallen', undefined);
	// qQueue.AddViewer('CabalCrusader', '0108', 2, undefined, 'Cabal_CrusaderYT');
	// qQueue.AddViewer('HiveHunter', '0109', 5, 'Hunter_TTV', undefined);
	// qQueue.AddViewer('SparrowRider', '0110', 8, undefined, 'SparrowYT');
	// qQueue.AddViewer('SolarBlade', '0111', 4, 'Blade_TTV', undefined);
	// qQueue.AddViewer('VoidWalker', '0112', 3, undefined, 'Void_WalkerYT');
	// qQueue.AddViewer('ArcStriker', '0113', 6, 'ArcStriker_Twitch', undefined);
	// qQueue.AddViewer('IronLord', '0114', 7, undefined, 'IronLord_YT');
	// qQueue.AddViewer('StormCaller', '0115', 2, 'StormCallerTV', undefined);
	// qQueue.AddViewer('NightStalker', '0116', 4, undefined, 'NightStalkerOfficial');
	// qQueue.AddViewer('DawnBringer', '0117', 5, 'Dawn_TTV', undefined);
	// qQueue.AddViewer('RogueRanger', '0118', 3, undefined, 'RogueRangerYT');
	// qQueue.AddViewer('GambitAce', '0119', 6, 'GambitAceLive', 'AceGambitYT');
	// qQueue.AddViewer('NovaMaster', '0120', 7, 'Nova_Master', undefined);
	// qQueue.AddViewer('LunaScout', '0121', 5, undefined, 'LunaScout_YT');
	// qQueue.AddViewer('DarkKnight', '0122', 4, 'DarkKnight_TTV', undefined);
	// qQueue.AddViewer('SolarSentinel', '0123', 3, undefined, 'Solar_SentinelYT');
	// qQueue.AddViewer('BlightHunter', '0124', 2, 'HunterOfBlight', undefined);
	// qQueue.AddViewer('CrimsonVex', '0125', 6, undefined, 'Crimson_VexYT');
	// qQueue.AddViewer('MercySavior', '0126', 5, 'MercySavior_Twitch', undefined);
	// qQueue.AddViewer('StormWarden', '0127', 8, undefined, 'StormWardenD2');
	// qQueue.AddViewer('NightReaper', '0128', 4, 'Reaper_TTV', undefined);
	// qQueue.AddViewer('SunStriker', '0129', 3, undefined, 'Sun_Striker_YT');
	// qQueue.AddViewer('GuardianKing', '0130', 7, 'KingGuardian_Twitch', undefined);

	qQueue.DebugSelection();
	let queue = $state(qQueue.GetQueue());
</script>

<!-- {#if qQueue.IsOpen().open} -->
<!-- {#if qQueue.open} -->
<!-- 	<Button variant="destructive" onclick={() => (qQueue.open = false)}>Close Raffle</Button> -->
<!-- {:else} -->
<!-- 	<Button onclick={() => (qQueue.open = true)}>Open Raffle</Button> -->
<!-- {/if} -->
<!-- {#each queue as member} -->
<!-- 	{member.destinyUsername} -->
<!-- {/each} -->

<div class="flex h-[calc(100vh-130px)] w-full justify-center">
	<QueueDashboard />
</div>
