# DESIGN-SYSTEM

## 🛑 Repository Conventions & Workflow Policy

1. **Squash Merge Only**: All pull requests must be merged into `main` using **Squash and Merge** exclusively.
2. **Delete Branch on Merge**: Feature branches must be automatically deleted immediately upon merge into `main`.
3. **Linear History**: Maintain a strictly linear history. Rebase feature branches onto `main` before merging.
4. **Direct Push Protection**: Direct pushes to `main` are blocked; PR mechanism required.
5. **Local Temp & Worktree Directory**: All temporary files, databases, and worktrees go in `/temp/` (gitignored).
6. **Local Task Notes**: Keep local task notes in the ignored `TODO.md`.
7. **Auto-Merge Enabled**: PRs may enable auto-merge (squash) so they merge automatically once required checks pass.
8. **Pinned Action SHAs**: All GitHub Actions workflows MUST use 40-character commit SHAs instead of mutable tags.
9. **Script Language Policy**: Automation scripts in `scripts/` MUST use TypeScript or JavaScript (`.ts`, `.js`, `.mjs`) executed via Node/pnpm. Alien scripting runtimes (e.g., `.sh`/`.ps1` everywhere) are prohibited.
