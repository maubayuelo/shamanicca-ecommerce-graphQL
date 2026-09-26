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
3. Helper classes collide with Tailwind utility names. `.hidden`, `.m-0`,
   `.mb-0`, `.p-0` and `.sr-only` are `!important`; `.mt-15`, `.pt-10`,
   `.pb-10` and `.mr-30` mean different values in Tailwind.
4. `typography-cascade.scss` keeps `.type-*` late in the bundle; component
   rules depend on that order until typography moves into a layer.
5. v4 `hover:` is gated behind `@media (hover: hover)`. Use the ungated
   `[&:hover]:` / `[.group:hover_&]:`.
6. `max-[N]:` is exclusive. For an inclusive query use
   `[@media(max-width:N)]:`.
7. Breakpoints: 601/600 → `sm`, max-600 → `max-sm`, 1400 → `xl`,
   1024 → `lg`. Exact exceptions: the paginator's 600 (tied to JS
   `PHONE_MAX`) and `.post-content`'s 1440.
8. CMS/WordPress HTML (`.wp-content`, `.post-content` descendants,
   `.page img`) stays scoped CSS.
9. Inside Tailwind arbitrary values/variants (`[...]`), `_` compiles to a
   space, so BEM classes break: `[.paginator__item_&]:` becomes
   `.paginator  item &`. Escape with `\_` (`\\_` inside a JS string
   literal), or avoid the arbitrary variant when the class contains `_`.

## Workflow

READ → PROPOSE → approval → IMPLEMENT → VERIFY. The agent never commits,
pushes or merges; commit messages go to the path it is given.
