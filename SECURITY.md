# Security Policy

Lowdefy is maintained by a small team at Lowdefy, Inc. We take reports seriously and fix real problems, but we handle them on a best-effort basis. There is no service-level agreement.

## Supported versions

Only the latest release of the current major version receives security fixes. Older major versions and older minor releases are not patched. Fixes are released as a new version, never as patches to earlier ones.

## Reporting a vulnerability

Report privately through [GitHub's private vulnerability reporting](https://github.com/lowdefy/lowdefy/security/advisories/new). If you can't use GitHub, email `security [at] lowdefy [dot] com`.

Please don't open a public issue, pull request or discussion about a vulnerability.

A useful report includes:

- the Lowdefy version and the package affected;
- the app configuration needed to reproduce it, as a minimal `lowdefy.yaml`;
- steps you have run against the latest release, and what you observed;
- who the attacker is, what they need to have, and what they gain.

Check the [published advisories](https://github.com/lowdefy/lowdefy/security/advisories) and the `develop` branch first: the problem may already be known or fixed. Send one report per problem.

Reports produced with automated tools or AI are welcome, as long as you have checked them yourself and run the reproduction. We may close reports without a working reproduction or a realistic impact without further discussion.

## What happens next

- We aim to acknowledge a report within 10 business days.
- If we confirm it, we fix it in the next release we can, and tell you when the fix is merged and released.
- For a confirmed vulnerability with real impact, we publish a GitHub security advisory and credit you, unless you ask us not to. We request a CVE when the impact warrants one.
- If we don't consider the report a vulnerability, we close it and say why.

## Disclosure

Please give us 90 days from your report, or until a release that fixes it, whichever comes first, before you publish anything. If you plan to publish, tell us the date in the report thread so we can publish our advisory first and link to your write-up.

## Scope

In scope: the Lowdefy packages that run a production app, such as `@lowdefy/server`, `@lowdefy/api`, the build, the client, and the official plugins, used in a realistic configuration.

Out of scope:

- **The development server and dev tools** (`lowdefy dev`, `@lowdefy/server-dev`, the agent tools it serves). They run on a developer's own machine, listen only on `localhost`, and are not designed to be exposed to a network.
- **Choices made in an app's configuration.** Lowdefy runs the config the app's developer writes. If the developer passes a client-supplied value into a request URL, a database query, a file path or HTML, the app is responsible for checking that value. We may still add hardening, but these are not vulnerabilities in Lowdefy.
- **Hardening suggestions without a demonstrated impact**, such as missing headers, version disclosure or theoretical issues in an unreachable code path.
- **Vulnerabilities in third-party dependencies** that Lowdefy does not reach in a way an attacker can trigger. Report those upstream.
- **Denial of service** by sending a high volume of requests, and missing rate limits.
- **Unsupported versions** (see above).

## Testing rules

Only test against apps and data you own. Don't access, change or delete other people's data, and don't run social engineering, physical or volume-based attacks.
