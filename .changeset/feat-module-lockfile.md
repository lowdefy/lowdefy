---
'@lowdefy/build': minor
'lowdefy': minor
---

Lock GitHub module refs to commits in `lowdefy-modules.lock.yaml`.

A module source with a branch ref such as `github:acme/modules/team-users@main` used to be refetched on every build, so two builds of the same app commit could contain different module config and nothing recorded which module commit a build used.

The build now resolves each GitHub module ref to a commit sha and records it in `lowdefy-modules.lock.yaml` in the config directory, next to `lowdefy.yaml`. Commit this file. When an entry is present the build fetches that exact commit, so the module cache is permanent and no GitHub request is made. Each entry records the source it was resolved from, so changing a module's owner, repo, path or ref invalidates its lock. `file:` sources are never locked.

`lowdefy dev` writes the lockfile as it builds. A production build never writes into the config directory: `lowdefy build` fails when a module entry uses a branch ref and has no lock entry, naming the commit it resolved and telling you to run `lowdefy modules update`. Immutable refs (tags and commit shas) never trigger this.

New command: `lowdefy modules update [name]` invalidates the named lock entry (or all of them), rebuilds so they are re-resolved, and prints what moved.
