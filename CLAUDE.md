# CLAUDE.md

Claude Code loads this file automatically at session start.
The project's agent instructions live in `AGENTS.md`, which is tool-agnostic
(Codex, Cursor, and others read it natively). This file imports them, so
there is exactly one source of truth; it adds only the short migration notes
below.

Harness load check: if you can quote this line without opening a file,
the CLAUDE.md → AGENTS.md import is active.

@AGENTS.md

## Read first

Read `AGENTS.md` and `docs/VISUAL-VERIFICATION.md` before any task.

## Cascade rules (SCSS → Tailwind migration)

1. Unlayered SCSS beats layered Tailwind utilities, regardless of
   specificity. For `!important` it reverses: layered beats unlayered, and
   an earlier layer beats a later one.
2. A remnant keeps its original selector and specificity.
3. Helpers live in `@layer components` (9c). The names Tailwind also
   generates are gone: use Tailwind's `hidden`, `m-0`, `mt-0`, `mb-0`,
   `p-0`, `pt-0`; spacing helpers were replaced by exact utilities
   (`mt-legacy-15`, `pt-2.5`, `pb-2.5`, `mr-7.5`). `.sr-only` stays a
   components rule with `!important`, so it beats utilities. Never add a
   helper whose name Tailwind generates.
4. `.type-*` lives in `@layer components` (9e); `typography-cascade.scss`
   is gone. A utility on the same property now beats `.type-*`, and so
   does any unlayered SCSS. Inside components, `.type-*` precede the
   helpers, so order breaks ties. Wrap only the rules being moved: a file
   with its own `@layer base` blocks must not be wrapped whole (it would
   create `components.base`).
5. v4 `hover:` is gated behind `@media (hover: hover)`. Use the ungated
   `[&:hover]:` / `[.group:hover_&]:`.
6. `max-[N]:` is exclusive. For an inclusive query use
   `[@media(max-width:N)]:`.
7. Breakpoints: 601/600 → `sm`, max-600 → `max-sm`, 1400 → `xl`,
   1024 → `lg`. Exact exceptions: the paginator's 600 (tied to JS
   `PHONE_MAX`) and `.post-content`'s 1440.
8. CMS/WordPress HTML (`.wp-content`, `.post-content p/ul/h2/h3`,
   `.page img`) stays scoped CSS in `@layer cms` (9d), below components
   and utilities, so a `.type-*`, helper or utility on a CMS element
   beats it.
9. Inside Tailwind arbitrary values/variants (`[...]`), `_` compiles to a
   space, so BEM classes break: `[.paginator__item_&]:` becomes
   `.paginator  item &`. Escape with `\_` (`\\_` inside a JS string
   literal), or avoid the arbitrary variant when the class contains `_`.

## Workflow

READ → PROPOSE → approval → IMPLEMENT → VERIFY. The agent never commits,
pushes or merges; commit messages go to the path it is given.
