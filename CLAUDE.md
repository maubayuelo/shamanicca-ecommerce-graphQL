# CLAUDE.md

Claude Code loads this file automatically at session start.
The project's agent instructions live in `AGENTS.md`, which is tool-agnostic
(Codex, Cursor, and others read it natively). This file exists only to import
them, so there is exactly one source of truth and no drift between the two.

Harness load check: if you can quote this line without opening a file,
the CLAUDE.md → AGENTS.md import is active.

@AGENTS.md