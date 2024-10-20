import Twitch from "lucide-svelte/icons/twitch";
import Trash from "lucide-svelte/icons/trash-2"
import X from "lucide-svelte/icons/x"
import Minus from "lucide-svelte/icons/minus"
import Plus from "lucide-svelte/icons/plus"

import type { SvelteComponent } from "svelte";

// import Twitch from "./twitch.svelte"
export type Icon = SvelteComponent

export const Icons = {
  twitch: Twitch,
  trash: Trash,
  x: X,
  plus: Plus,
  minus: Minus
}
