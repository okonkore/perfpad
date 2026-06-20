# Agent Notes

## Git and GitHub from Codex

This repository may need to be marked as safe for Git in the Codex shell before
running normal Git commands:

```powershell
git config --global --add safe.directory C:/Users/okonkore/Documents/PerfPad
```

In this Windows workspace, Codex may be unable to write directly inside `.git/`.
Creating files such as `.git/index.lock` can fail from the Codex shell even when
the user's own PowerShell can do it.

Use the Codex-specific Git database instead:

```powershell
git --git-dir=.codex-git-work --work-tree=. status --short --branch
git --git-dir=.codex-git-work --work-tree=. add <files>
git --git-dir=.codex-git-work --work-tree=. commit -m "<message>"
```

For GitHub authentication, use the Codex-specific GitHub CLI config:

```powershell
$env:GH_CONFIG_DIR = "C:\Users\okonkore\Documents\PerfPad\.codex-gh-auth"
```

When pushing from Codex, run Git through Git Bash so the Git credential helper
can find `sh.exe`:

```powershell
$env:GH_CONFIG_DIR = "C:\Users\okonkore\Documents\PerfPad\.codex-gh-auth"
& "C:\Program Files\Git\bin\bash.exe" -lc 'git --git-dir=.codex-git-work --work-tree=. push -v origin main'
```

`.codex-git-work/` and `.codex-gh-auth/` are intentionally ignored. Do not
commit them. `.codex-gh-auth/` contains local GitHub auth material.

After Codex pushes through `.codex-git-work`, the user's normal Git checkout may
need to be aligned from PowerShell:

```powershell
git fetch origin
git reset --mixed origin/main
```

## Deno Deploy

Use the Deno CLI from the project root for deploy tasks. Confirm the intended
project name and entry point before deploying.

Typical commands:

```powershell
deno task dev
deno task test
deno deploy
```

If this project uses a different deploy command, prefer the command documented
in `deno.json`, `deno.jsonc`, or the project's README.
