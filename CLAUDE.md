# CLAUDE.md

Claude Code loads this file automatically at session start.
The project's agent instructions live in `AGENTS.md`, which is tool-agnostic
(Codex, Cursor, and others read it natively). This file imports them, so
there is exactly one source of truth; it adds only the current styling
constraints below.

Harness load check: if you can quote this line without opening a file,
the CLAUDE.md → AGENTS.md import is active.

@AGENTS.md

## Read first

Read `AGENTS.md` and `docs/VISUAL-VERIFICATION.md` before any task.

## Cascade rules (Tailwind v4 + plain layered CSS)

The migration is complete at PR #48 / merge `362bb921`. Preflight stays OFF.
Canonical layer order: `properties, theme, base, cms, components, utilities`.

1. Unlayered CSS beats layered Tailwind utilities, regardless of
   specificity. For `!important` it reverses: layered beats unlayered, and
   an earlier layer beats a later one.
2. A remnant keeps its original selector and specificity.
3. Helpers live in `@layer components`. The names Tailwind also
   generates are gone: use Tailwind's `hidden`, `m-0`, `mt-0`, `mb-0`,
   `p-0`, `pt-0`; spacing helpers were replaced by exact utilities
   (`mt-legacy-15`, `pt-2.5`, `pb-2.5`, `mr-7.5`). `.sr-only` stays a
   components rule with `!important`, so it beats utilities. Never add a
   helper whose name Tailwind generates.
4. `.type-*` lives in `@layer components`. A utility on the same
   property beats `.type-*`, as does any unlayered CSS. Inside components,
   `.type-*` precede the
   helpers, so order breaks ties. Wrap only the rules being moved: a file
   with its own `@layer base` blocks must not be wrapped whole (it would
   create `components.base`).
5. v4 `hover:` is gated behind `@media (hover: hover)`. Use the ungated
   `[&:hover]:` / `[.group:hover_&]:`.
6. `max-[N]:` is exclusive. For an inclusive query use
   `[@media(max-width:N)]:`.
7. Tailwind breakpoints are `sm` 640, `md` 768, `lg` 1024, `xl` 1280,
   `2xl` 1536px. Preserve scoped exceptions: the paginator's exact 600px
   query and 1024px layout boundary are tied to JS `PHONE_MAX` /
   `DESKTOP_MIN`; typography retains inclusive max-width 600/1024px,
   responsive helpers min-width 1024px, and `.page img` min-width 601px.
   The earlier `.post-content` 1440px exception is historical: current
   scoped rules only reset margins and contain no 1440px media query.
   Do not introduce a breakpoint or shift these boundaries as cleanup.
8. CMS/WordPress HTML (`.wp-content`, `.post-content p/ul/h2/h3`,
   `.page img`) stays scoped CSS in `@layer cms`, below components
   and utilities, so a `.type-*`, helper or utility on a CMS element
   beats it.
9. Inside Tailwind arbitrary values/variants (`[...]`), `_` compiles to a
   space, so BEM classes break: `[.paginator__item_&]:` becomes
   `.paginator  item &`. Escape with `\_` (`\\_` inside a JS string
   literal), or avoid the arbitrary variant when the class contains `_`.

## Workflow

READ → PROPOSE → approval → IMPLEMENT → VERIFY. The agent never commits,
pushes or merges; commit messages go to the path it is given.
