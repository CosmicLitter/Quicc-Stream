import Twitch from "lucide-svelte/icons/twitch";
import Trash from "lucide-svelte/icons/trash-2"
import X from "lucide-svelte/icons/x"
import Minus from "lucide-svelte/icons/minus"
import Plus from "lucide-svelte/icons/plus"
import Check from "lucide-svelte/icons/check"
import Swords from "lucide-svelte/icons/swords"
import SquareUser from "lucide-svelte/icons/square-user"
import ListStart from "lucide-svelte/icons/list-start"
import ListEnd from "lucide-svelte/icons/list-end"
import Youtube from "lucide-svelte/icons/youtube"
import ChevronsLeft from "lucide-svelte/icons/chevrons-left"
import ChevronsRight from "lucide-svelte/icons/chevrons-right"
import ClipboardCopy from "lucide-svelte/icons/clipboard-copy"
import UserRoundPen from "lucide-svelte/icons/user-round-pen"
import Settings from "lucide-svelte/icons/settings-2"
import House from "lucide-svelte/icons/house"
import Tickets from "lucide-svelte/icons/tickets"
import UserX from "lucide-svelte/icons/user-x"


import type { SvelteComponent } from "svelte";

// import Twitch from "./twitch.svelte"
export type Icon = SvelteComponent

export const Icons = {
  twitch: Twitch,
  trash: Trash,
  x: X,
  plus: Plus,
  minus: Minus,
  check: Check,
  swords: Swords,
  members: SquareUser,
  listStart: ListStart,
  listEnd: ListEnd,
  youtube: Youtube,
  chevronLeft: ChevronsLeft,
  chevronRight: ChevronsRight,
  clipboardCopy: ClipboardCopy,
  userEdit: UserRoundPen,
  settings: Settings,
  house: House,
  tickets: Tickets,
  userX: UserX
}
