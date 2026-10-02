---
'@lowdefy/build': minor
'@lowdefy/docs': patch
---

GitHub module sources in private repositories can now be fetched with an SSH key instead of a token. Set `GITHUB_SSH_KEY` to a private key, such as a read-only deploy key on the module's repository. When the GitHub API returns 401, 403 or 404 for a repository, the build fetches it with `git` over SSH using that key and GitHub's pinned host keys. Public repositories are still downloaded through the API, so apps that mix public and private modules work with a deploy key. Over SSH, the `ref` must be a tag, a branch or a full commit SHA, and the build machine needs `git` and `ssh`.
