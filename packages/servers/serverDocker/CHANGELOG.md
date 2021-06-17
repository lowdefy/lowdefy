# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [3.18.0](https://github.com/lowdefy/lowdefy/compare/v3.17.2...v3.18.0) (2021-06-17)

**Note:** Version bump only for package @lowdefy/server-docker





## [3.17.2](https://github.com/lowdefy/lowdefy/compare/v3.17.1...v3.17.2) (2021-06-11)

**Note:** Version bump only for package @lowdefy/server-docker





## [3.17.1](https://github.com/lowdefy/lowdefy/compare/v3.17.0...v3.17.1) (2021-06-11)

**Note:** Version bump only for package @lowdefy/server-docker





# [3.17.0](https://github.com/lowdefy/lowdefy/compare/v3.17.0-alpha.3...v3.17.0) (2021-06-11)

**Note:** Version bump only for package @lowdefy/server-docker





# [3.17.0-alpha.3](https://github.com/lowdefy/lowdefy/compare/v3.17.0-alpha.2...v3.17.0-alpha.3) (2021-06-09)


### Bug Fixes

* **servers:** .babelrc file should not be in .dockerignore ([994c13f](https://github.com/lowdefy/lowdefy/commit/994c13f97459c8d9986213b1a73dca6068d5cb48))





# [3.17.0-alpha.2](https://github.com/lowdefy/lowdefy/compare/v3.17.0-alpha.1...v3.17.0-alpha.2) (2021-06-09)

**Note:** Version bump only for package @lowdefy/server-docker





# [3.17.0-alpha.1](https://github.com/lowdefy/lowdefy/compare/v3.17.0-alpha.0...v3.17.0-alpha.1) (2021-06-09)

**Note:** Version bump only for package @lowdefy/server-docker





# [3.17.0-alpha.0](https://github.com/lowdefy/lowdefy/compare/v3.16.5...v3.17.0-alpha.0) (2021-06-09)


### Bug Fixes

* Remove yarn cache clean from docker builds. ([e5d8d9d](https://github.com/lowdefy/lowdefy/commit/e5d8d9da4d7d5f4979d036c2207741da4e0f034b))
* **server-docker:** Use port 3000 as default port. ([53bbc5f](https://github.com/lowdefy/lowdefy/commit/53bbc5fc1343832a26e60d189e080e0f13b1ede5))
* **servers:** Use a empty app config instead of starter config for lowdefy default. ([db4b7f9](https://github.com/lowdefy/lowdefy/commit/db4b7f902835dcfe49d0f4cf0402b5b8435528c5))


### Features

* Add configurable public directory to servers. ([7c2beeb](https://github.com/lowdefy/lowdefy/commit/7c2beeb049d647452d4b6838427ae609e6d91b46))
* Add docker ignore files ([441b150](https://github.com/lowdefy/lowdefy/commit/441b150e7528a5b4efae3b73d129091e690116de))
* Init aws lambda server. ([f48021e](https://github.com/lowdefy/lowdefy/commit/f48021ea38184708ede63f306dad2684e948925e))
* Update docker server dockerfile. ([0f52b35](https://github.com/lowdefy/lowdefy/commit/0f52b350483f1e6157040eb6539266839bb563c4))
* use lowdefy server in docker and lambda servers ([4854f74](https://github.com/lowdefy/lowdefy/commit/4854f74733d3d3d5de0426b17669760e41785508))
* Use shell package in dev and docker servers ([d9abe05](https://github.com/lowdefy/lowdefy/commit/d9abe05ef7267527f4fb1140557905d243246a92))
* **server-docker:** Update lowdefy app directory in dockerfile ([cedea93](https://github.com/lowdefy/lowdefy/commit/cedea93f6b22dfb255e40aefc50172b01bafdfea))





## [3.16.5](https://github.com/lowdefy/lowdefy/compare/v3.16.4...v3.16.5) (2021-05-31)


### Bug Fixes

* **deps:** update apollo server packages to v2.24.1. ([a538a22](https://github.com/lowdefy/lowdefy/commit/a538a22b6d5526678f3d8a1a7c86363a91b96992))
* **deps:** update apollo server packages to v2.25.0 ([bbe713d](https://github.com/lowdefy/lowdefy/commit/bbe713d1bb584e1dcba6db9b9bd46a8531d2e2e6))





## [3.16.4](https://github.com/lowdefy/lowdefy/compare/v3.16.3...v3.16.4) (2021-05-28)

**Note:** Version bump only for package @lowdefy/server-docker





## [3.16.3](https://github.com/lowdefy/lowdefy/compare/v3.16.2...v3.16.3) (2021-05-27)


### Bug Fixes

* **servers:** Append html when serving index from url root ([12cb782](https://github.com/lowdefy/lowdefy/commit/12cb7829460e05479fc7376f49b0defa0819afea))





## [3.16.2](https://github.com/lowdefy/lowdefy/compare/v3.16.1...v3.16.2) (2021-05-26)

**Note:** Version bump only for package @lowdefy/server-docker





## [3.16.1](https://github.com/lowdefy/lowdefy/compare/v3.16.0...v3.16.1) (2021-05-26)

**Note:** Version bump only for package @lowdefy/server-docker





# [3.16.0](https://github.com/lowdefy/lowdefy/compare/v3.15.0...v3.16.0) (2021-05-26)


### Bug Fixes

* Rename appendHeader to appendHead. ([4e79736](https://github.com/lowdefy/lowdefy/commit/4e797363540bd0f5cfbe65928585012316b05a58))
* webpack config so that index.html is not minified. ([d9cbf8d](https://github.com/lowdefy/lowdefy/commit/d9cbf8df56f97116832a7038f026058f1d528dc6))
* **servers:** Express function changed to async. ([6df571b](https://github.com/lowdefy/lowdefy/commit/6df571b0475d946e6864c2824af36450b70a7fa0))


### Features

* Include contenthash in webpack output. ([dd2adbb](https://github.com/lowdefy/lowdefy/commit/dd2adbbaa195899c6986ca99934e19c4f6aeca21)), closes [#575](https://github.com/lowdefy/lowdefy/issues/575)
* **server:** Add head and body load scripts. ([ad195b4](https://github.com/lowdefy/lowdefy/commit/ad195b409b1780ac1bb3e194de5c106dbdb0b2b3))
* **servers:** Load header and body html on server. ([a5b070f](https://github.com/lowdefy/lowdefy/commit/a5b070f03b1d69991e9bfa7a4ccd571972d344df))





# [3.15.0](https://github.com/lowdefy/lowdefy/compare/v3.14.1...v3.15.0) (2021-05-11)

**Note:** Version bump only for package @lowdefy/server-docker





## [3.14.1](https://github.com/lowdefy/lowdefy/compare/v3.14.0...v3.14.1) (2021-04-28)

**Note:** Version bump only for package @lowdefy/server-docker





# [3.14.0](https://github.com/lowdefy/lowdefy/compare/v3.13.0...v3.14.0) (2021-04-26)

**Note:** Version bump only for package @lowdefy/server-docker





# [3.13.0](https://github.com/lowdefy/lowdefy/compare/v3.12.6...v3.13.0) (2021-04-16)


### Bug Fixes

* Update react, react-dom and react-test-renderer to v17.0.2 ([78969ab](https://github.com/lowdefy/lowdefy/commit/78969abd39e8b04a7cddb39472985da6da50c7b9))





## [3.12.6](https://github.com/lowdefy/lowdefy/compare/v3.12.5...v3.12.6) (2021-04-06)

**Note:** Version bump only for package @lowdefy/server-docker





## [3.12.5](https://github.com/lowdefy/lowdefy/compare/v3.12.4...v3.12.5) (2021-03-31)

**Note:** Version bump only for package @lowdefy/server-docker





## [3.12.4](https://github.com/lowdefy/lowdefy/compare/v3.12.3...v3.12.4) (2021-03-30)

**Note:** Version bump only for package @lowdefy/server-docker





## [3.12.3](https://github.com/lowdefy/lowdefy/compare/v3.12.2...v3.12.3) (2021-03-26)

**Note:** Version bump only for package @lowdefy/server-docker





## [3.12.2](https://github.com/lowdefy/lowdefy/compare/v3.12.1...v3.12.2) (2021-03-24)

**Note:** Version bump only for package @lowdefy/server-docker





## [3.12.1](https://github.com/lowdefy/lowdefy/compare/v3.12.0...v3.12.1) (2021-03-24)

**Note:** Version bump only for package @lowdefy/server-docker





# [3.12.0](https://github.com/lowdefy/lowdefy/compare/v3.11.4...v3.12.0) (2021-03-24)

**Note:** Version bump only for package @lowdefy/server-docker





## [3.11.4](https://github.com/lowdefy/lowdefy/compare/v3.11.3...v3.11.4) (2021-03-19)

**Note:** Version bump only for package @lowdefy/server-docker





## [3.11.3](https://github.com/lowdefy/lowdefy/compare/v3.11.2...v3.11.3) (2021-03-12)

**Note:** Version bump only for package @lowdefy/server-docker





## [3.11.2](https://github.com/lowdefy/lowdefy/compare/v3.11.1...v3.11.2) (2021-03-11)

**Note:** Version bump only for package @lowdefy/server-docker





## [3.11.1](https://github.com/lowdefy/lowdefy/compare/v3.11.0...v3.11.1) (2021-03-11)

**Note:** Version bump only for package @lowdefy/server-docker





# [3.11.0](https://github.com/lowdefy/lowdefy/compare/v3.10.2...v3.11.0) (2021-03-11)


### Features

* Init OpenID Connect flow. ([e2e29d0](https://github.com/lowdefy/lowdefy/commit/e2e29d0f165c148bbc27b5073612a6b4d50e1b87))
* Move all servers to expressed based apps. ([ffc6043](https://github.com/lowdefy/lowdefy/commit/ffc6043e0faf2812c31d3e25d794a64a154849d2))
* use setHeader plugin to set auth headers ([6238c6f](https://github.com/lowdefy/lowdefy/commit/6238c6f6ba6c1d24720f4867da7e5e577ff344d4))





## [3.10.2](https://github.com/lowdefy/lowdefy/compare/v3.10.1...v3.10.2) (2021-02-25)


### Bug Fixes

* **docs:** Fix links and improve docs content ([3019495](https://github.com/lowdefy/lowdefy/commit/30194956a5057b631865ebe4c977b4e5be492367))





## [3.10.1](https://github.com/lowdefy/lowdefy/compare/v3.10.0...v3.10.1) (2021-02-19)

**Note:** Version bump only for package @lowdefy/server-docker





# [3.10.0](https://github.com/lowdefy/lowdefy/compare/v3.9.0...v3.10.0) (2021-02-17)


### Bug Fixes

* **deps:** Update dependency apollo-server packages to v2.21.0 ([276012c](https://github.com/lowdefy/lowdefy/commit/276012c48283be64e60cbe00f7d8acf695773725))
* **deps:** Update dependency css-loader to v5.0.2. ([6dd6a82](https://github.com/lowdefy/lowdefy/commit/6dd6a82fa4e4975f201e0c22c6b5bf29cd0541e3))
* **deps:** Update dependency html-webpack-plugin to v5.1.0 ([d0dd688](https://github.com/lowdefy/lowdefy/commit/d0dd688816e3e9fc6ff56235698d3af4707eba5f))
* **deps:** Update dependency webpack to v5.22.0. ([bb9f69e](https://github.com/lowdefy/lowdefy/commit/bb9f69e29cbce728932ab512e12122ce3dc349cc))
* **deps:** Update dependency webpack-cli to v4.5.0. ([445d55c](https://github.com/lowdefy/lowdefy/commit/445d55ca12f720be9f09632a319c319323c7041c))





# [3.9.0](https://github.com/lowdefy/lowdefy/compare/v3.8.0...v3.9.0) (2021-02-16)

**Note:** Version bump only for package @lowdefy/server-docker





# [3.8.0](https://github.com/lowdefy/lowdefy/compare/v3.7.2...v3.8.0) (2021-02-12)

**Note:** Version bump only for package @lowdefy/server-docker





## [3.7.2](https://github.com/lowdefy/lowdefy/compare/v3.7.1...v3.7.2) (2021-02-09)


### Bug Fixes

* Fix package lifecycle scripts. ([af7f3a8](https://github.com/lowdefy/lowdefy/commit/af7f3a8ea29763defb20cfb4f28afba3b56d981c))





## [3.7.1](https://github.com/lowdefy/lowdefy/compare/v3.7.0...v3.7.1) (2021-02-09)

**Note:** Version bump only for package @lowdefy/server-docker





# [3.7.0](https://github.com/lowdefy/lowdefy/compare/v3.6.0...v3.7.0) (2021-02-09)

**Note:** Version bump only for package @lowdefy/server-docker





# [3.6.0](https://github.com/lowdefy/lowdefy/compare/v3.5.0...v3.6.0) (2021-02-05)


### Features

* 🐢Redirect all paths to blocks-cdn. ([a45447a](https://github.com/lowdefy/lowdefy/commit/a45447ad1dacf977e487a020bd56080ae2b09792))





# [3.5.0](https://github.com/lowdefy/lowdefy/compare/v3.4.0...v3.5.0) (2021-02-05)


### Bug Fixes

* **deps:** Update dependency copy-webpack-plugin to v7.0.0. ([901d412](https://github.com/lowdefy/lowdefy/commit/901d4126544dd4ee68d62bf520cdd4cc2b0d1dcc))
* **deps:** Update dependency graphql to v15.5.0 ([90acf72](https://github.com/lowdefy/lowdefy/commit/90acf7289c517f9afe066cd0706c64187a39648b))





# [3.4.0](https://github.com/lowdefy/lowdefy/compare/v3.3.0...v3.4.0) (2021-01-20)

**Note:** Version bump only for package @lowdefy/server-docker





# [3.3.0](https://github.com/lowdefy/lowdefy/compare/v3.1.1...v3.3.0) (2021-01-18)


### Bug Fixes

* **deps:** update apollo server packages to v2.19.1 ([#326](https://github.com/lowdefy/lowdefy/issues/326)) ([8b977e3](https://github.com/lowdefy/lowdefy/commit/8b977e363930b2c5b639fd4455751d81e3487570))
* **deps:** update apollo server packages to v2.19.2 ([68f89d0](https://github.com/lowdefy/lowdefy/commit/68f89d0b9a131bfd031af5a95f9b71b276efa275))





# [3.2.0](https://github.com/lowdefy/lowdefy/compare/v3.1.1...v3.2.0) (2021-01-18)


### Bug Fixes

* **deps:** update apollo server packages to v2.19.1 ([#326](https://github.com/lowdefy/lowdefy/issues/326)) ([8b977e3](https://github.com/lowdefy/lowdefy/commit/8b977e363930b2c5b639fd4455751d81e3487570))
* **deps:** update apollo server packages to v2.19.2 ([68f89d0](https://github.com/lowdefy/lowdefy/commit/68f89d0b9a131bfd031af5a95f9b71b276efa275))





## [0.0.1](https://github.com/lowdefy/lowdefy/compare/@lowdefy/server-docker@0.0.0-alpha.7...@lowdefy/server-docker@0.0.1) (2020-12-15)

**Note:** Version bump only for package @lowdefy/server-docker





# [0.0.0](https://github.com/lowdefy/lowdefy/compare/@lowdefy/server-docker@0.0.0-alpha.7...@lowdefy/server-docker@0.0.0) (2020-12-15)

**Note:** Version bump only for package @lowdefy/server-docker





# 0.0.0-alpha.7 (2020-12-10)


### Bug Fixes

* **server:** @lowdefy/block-tools should be a dev dependency ([e484a48](https://github.com/lowdefy/lowdefy/commit/e484a48eed9d983441bc19976553a6fd1d6cad61))
* **servers:** react is a dev dependency ([37a9a1e](https://github.com/lowdefy/lowdefy/commit/37a9a1ee0f84f4691a0ad7da43f05d15382fce6c))


### Features

* **server-docker:** add @lowdefy/server-docker package ([9ddf9eb](https://github.com/lowdefy/lowdefy/commit/9ddf9ebbe0b6c18c5c979572edaf04fcc663a4b0))
* **servers:** add logos, favicons and pwa icons ([fc8610e](https://github.com/lowdefy/lowdefy/commit/fc8610e7f529071fd9ce3961b3991cab2d7911bd))
