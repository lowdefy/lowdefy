---
'@lowdefy/build': minor
'@lowdefy/compile': minor
---

feat: Config compiler S1 — compiled refs run the full production build behind a flag.

`lowdefy build` with `options.compiler` or `LOWDEFY_BUILD_COMPILER=true`
resolves the config tree through `@lowdefy/compile` instead of the
walker. Compiled modules emit walker-compatible `~r`/`~l` markers —
instance ref ids are walker tree paths computed at run time with
build-injected allocation — so addKeys, keyMap/refMap artifacts,
validation, and page builds run unchanged. Ref forms the compiler does
not resolve itself (module `component`/`menu` refs, resolver refs,
non-YAML content files, dynamic paths) delegate to the walker through a
build-injected hook with identical refMap and id-counter state; builds
configured with a global `refResolver` fall back to the walker. A
byte-parity gate builds the entire success fixture corpus through both
paths and compares every artifact. The walker remains the default and
the dev/JIT path is unchanged.
