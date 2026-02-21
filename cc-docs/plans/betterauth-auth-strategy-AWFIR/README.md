# BetterAuth Auth Strategy

> **Branch**: `claude/betterauth-auth-strategy-AWFIR`
> **Status**: Draft

## Summary

Replace NextAuth with BetterAuth as Lowdefy's authentication engine. Covers four use cases from a single identity system: CLI auth (device code flow), portal auth (session cookies), developer app auth, and managed end-user auth ("Sign in with Lowdefy").

## Files

| File | Purpose |
|------|---------|
| [plan.md](plan.md) | Full technical implementation plan |

## Key Decisions

- **BetterAuth over NextAuth**: Self-hosted, plugin-based, TypeScript-first, MongoDB-native, config-driven — aligns with Lowdefy philosophy
- **New package `@lowdefy/auth-betterauth`**: Clean separation from existing NextAuth code
- **Phased migration**: BetterAuth alongside NextAuth in v5, NextAuth removed in v6
- **Managed auth product**: OAuth 2.1 Provider plugin enables "$20/month for 1,000 users" managed auth
