import type { UnlinkedDuellers } from "$lib/types";
import { persistedState } from "./persistedState.svelte";

export const duelList = persistedState<UnlinkedDuellers[]>('duelList', [])
export const nextDuelId = persistedState('nextDuelId', 0)
