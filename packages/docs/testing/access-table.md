The **access table** is the one check of who can reach which page and endpoint. It is a file in your app, `tests/access.yaml`, with one row per page and endpoint and one cell per caller. `lowdefy test` builds the same table from your app's production build and compares the two. A page or endpoint that opens to a new role fails the run, and accepting the change shows it as a one-line diff in the pull request.

```yaml
# tests/access.yaml
data: roles
pages:
  billing-runs: { finance: allow, no-role: deny, none: deny, technician: deny }
endpoints:
  billing-run-approve: { finance: allow, no-role: deny, none: deny, technician: deny }
```

You never write the file by hand. `lowdefy test --update-access` writes it, and you commit it.

## The file

- **`data`** names the [data set](/journey-data-sets) in `tests/data/` whose users the table is checked as.
- **`pages`** has a row for every page, by page id. **`endpoints`** has a row for every API endpoint, by endpoint id.
- Each row has a cell for each user of the data set, by name, and one for `none`, a signed out caller.
- Each cell is `allow`, `deny` or `enrol_required`.

Rows and cells are sorted, and each row is one line, so a change of reach changes one line of the file.

The table asks the app's authorization gate, the one the page and endpoint routes ask, in the CLI's own process. It starts no server and no database, and answers hundreds of pages for tens of users in milliseconds. What it does not show:

- An `InternalApi` endpoint is `deny` for every caller, since no caller can call one.
- A user is `enrol_required` only when the data set user carries `two_factor_enrolled: false`.
- A page whose path has placeholders is one row, by its page id. An [endpoint test](/endpoint-tests#page-requests) checks one path with `session.as(user).page(path)`.
- The table does not show the redirect a browser makes, or which surface (web or mobile) serves a page. Keep one or two [journeys](/config-tests) for the redirect.

## Which runs check it

The table is read from the production build, in `.lowdefy/server` or the folder `--server-directory` names. Only the runs that read that build check it:

| Run                               | The access table                                                                             |
| --------------------------------- | -------------------------------------------------------------------------------------------- |
| `lowdefy test --headless --build` | Checked first, before any journey. A difference fails the run, and the journeys still run.   |
| `lowdefy test --access`           | Checked alone. No journeys run.                                                              |
| `lowdefy test --update-access`    | Rewritten from the build. Nothing else runs.                                                 |
| `lowdefy test`, `--headless`      | Not checked: these run on the development server. When the file exists, they print one line. |
| `lowdefy test --lint`             | Not checked: a lint reads no build.                                                          |

A run that checks the table checks all of it. Journey paths, `--filter`, `--tag` and `--tier` choose journeys only. An app with no journeys is checked too.

The line a development server run prints is:

```
tests/access.yaml is checked on the production build, not the dev server: run "lowdefy build --no-client-build && lowdefy test --access" to check it.
```

A missing build, a build of another Lowdefy version and a build older than the config refuse the run before any journey, with the command to run. The check for an old build is best effort: see [A config edit needs a build first](/endpoint-tests#a-config-edit-needs-a-build-first).

## A difference

When the table matches the file, the run prints:

```
PASS  access table  (12 pages, 30 endpoints)
```

When they differ, the run exits with code `1` and prints a line for each difference, then the command that accepts them:

```
FAIL  access table: tests/access.yaml differs from the build
      caller auditor: added
      pages.billing-report: added
      endpoints.billing-run-approve.technician: deny → allow
      If these changes are meant, run "lowdefy test --update-access" and commit tests/access.yaml.
```

| Line                                 | Means                                                                                                  |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `<section>.<id>.<caller>: <a> → <b>` | One cell changed. `<section>` is `pages` or `endpoints`.                                               |
| `<section>.<id>: added`              | A page or endpoint the file does not have. `removed` is one the build no longer has.                   |
| `caller <name>: added`               | A user the data set gained, or `removed` for one it lost. Listed once, not once for each of its cells. |

When the app is not the working directory, the commands the access check prints carry `--config-directory <app>`, and when the run was given `--server-directory`, they carry it too, so they read the same build.

## `--access` and `--update-access`

`lowdefy test --access` checks the table and runs nothing else. With no `tests/access.yaml` it fails:

```
No tests/access.yaml to check. Write it with "lowdefy build --no-client-build && lowdefy test --update-access", then commit the files it writes.
```

`lowdefy test --update-access` rewrites `tests/access.yaml` from the build and runs nothing else. It keeps the file's `data`, and lists the lines it changed, as a failed check does, under `Updated tests/access.yaml:`. With nothing changed it prints `tests/access.yaml is up to date.`

Each takes only `--config-directory`, `--server-directory`, `--log-level` and `--disable-telemetry`. Journey paths and every other `lowdefy test` option refuse the run before the build opens, with the command you more likely meant:

```
--access checks the access table alone: drop --tag, or run "lowdefy test --headless --build --tag <tag>" to check the table and run those journeys.
```

The options refused are `--headless`, `--build`, `--lint`, `--repeat`, `--filter`, `--tag`, `--tier`, `--usage-window`, `--journeys-directory`, `--url`, `--port`, `--dev-directory` and `--ref-resolver`, when typed on the command line. A `PORT` in the environment, or a value in `lowdefy.yaml`'s `cli` config, is not refused. The two flags together are refused too.

## The first file

A `lowdefy test --headless --build` run of an app with auth configured and no `tests/access.yaml` warns:

```
This app has auth and no tests/access.yaml, so who reaches which page and endpoint is not checked. Write it with "lowdefy build --no-client-build && lowdefy test --update-access", then commit the files it writes.
```

Run that command once. With no `tests/access.yaml`, `--update-access` does two things:

1. **When the app has no `tests/data/roles.yaml`, it writes one.** It holds one user for each role the build declares, named after the role and holding only it, and `no-role`, a signed-in user with no roles, which shows what any signed-in user reaches. The roles are the ids in `auth.roles` and the roles `auth.pages.roles` and `auth.api.roles` name.
2. **It writes `tests/access.yaml`, checked as the `roles` data set.**

```yaml
# tests/data/roles.yaml
users:
  finance: { id: finance, roles: [finance] }
  no-role: { id: no-role, roles: [] }
  technician: { id: technician, roles: [technician] }
```

A role whose id a data set user cannot have, or one another user already has, gets a `role-` prefix: a role `none` is the user `role-none`, since `none` means signed out; a role `_admin` is `role-_admin`; a role `no-role` is `role-no-role`.

When the app already has a `roles` data set, it is kept as it is and the table is checked as its users. To check as another data set, change `data` in `tests/access.yaml` and run `lowdefy test --update-access`.

Commit both files.

## After a change to access

After a change to auth, roles, or the set of pages or endpoints, check the table once before you call the change done, not after each edit:

```
lowdefy build --no-client-build && lowdefy test --access
```

When the changed cells are the ones you meant, run `lowdefy test --update-access`, commit `tests/access.yaml`, and say in the pull request which cells changed and why. When the app is not the working directory, add `--config-directory <app>` to each command. In CI, `lowdefy test --headless --build` checks the table with the journeys.

## One check, in one place

Do not test who can reach which page and endpoint any other way: no snapshot of the table in an [endpoint test](/endpoint-tests), and no journey for each role over every page. Two copies of one table drift. The committed `tests/access.yaml` is the one access check.

If your app keeps an endpoint test that snapshots `accessMatrix`, delete the test and its `.snapshot` file, and run `lowdefy build --no-client-build && lowdefy test --update-access` to write the table in its place.

To test what a role does once it is in, such as a write it may or may not make, use a [journey](/config-tests), page-less for an endpoint ([calls, requests and the database](/config-tests#calls-requests-and-the-database)).
