---
'@lowdefy/server-dev': patch
---

fix(server-dev): A journey's exercised pages name page ids, so harden finds the mutants of a page with a path

The client fetches a page's config by its request path, and a journey counted those paths as page ids: a journey through two tickets reported `tickets/s/2` and `tickets/s/5` rather than `ticket`, and `lowdefy journeys harden` listed no page mutants for any page with a `path`. The journey now matches each page path it loaded to its page through the build's route table, the same match the page route makes, so every instance of a patterned page names the one page and a page with a fixed path names its id.
