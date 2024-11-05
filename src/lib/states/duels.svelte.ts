import type { UnlinkedDuellers } from "$lib/types";
import { persistedState } from "./persistedState.svelte";

export const duelList = persistedState<UnlinkedDuellers[]>('duels', [])
export const nextDuelId = persistedState('duel_id', 0)
