# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [4.0.0-alpha.6](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.5...v4.0.0-alpha.6) (2022-01-20)


### Bug Fixes

* **blocks-markdown:** Upgraded react markdown dependencies. ([9eb7c3a](https://github.com/lowdefy/lowdefy/commit/9eb7c3acbd8ab4088db75637ec8f17e36289787f))
* Fix antd styles. ([62a752d](https://github.com/lowdefy/lowdefy/commit/62a752d66c9b7cf4ebfd07fcc92d8a195ed43be4))
* Fix blocks-echarts yarn berry packageExtensions. ([a908c1c](https://github.com/lowdefy/lowdefy/commit/a908c1c1f8ccaab37643bf8a043a6cec8f82f243))
* Fix blocks-markdown package dependencies. ([035b0c1](https://github.com/lowdefy/lowdefy/commit/035b0c108b9447570fe7d37a5386d9ea414714fa))
* Fix static files. ([d2e343e](https://github.com/lowdefy/lowdefy/commit/d2e343eb8b644d953babac628470e785af641237))
* **server:** Home is also returned in getRootConfig. ([b138485](https://github.com/lowdefy/lowdefy/commit/b13848527749eb6f030bd944b1b169e8bd04af5d))


### Features

* 404 page working with next server ([270c92e](https://github.com/lowdefy/lowdefy/commit/270c92e16a42a5e9988b890f2abd41b16da6f673))
* Add icons and webmanifest to next server. ([6a254ed](https://github.com/lowdefy/lowdefy/commit/6a254ed88282a4965aa6e7399250668a409310a3))
* Add secrets to v4 servers ([9ef2ccd](https://github.com/lowdefy/lowdefy/commit/9ef2ccd131149e72ba87aee20f1720a99dbd9e07))
* Add server manager and file watcher in reload event stream. ([8474aaf](https://github.com/lowdefy/lowdefy/commit/8474aaf63c0475cb19a76ca3df9459c05f263986))
* **build:** Move app.style.lessVariables to config.theme.lessVariables. ([cb14f17](https://github.com/lowdefy/lowdefy/commit/cb14f1712f9f064e96d2f71bf12bb3922aff46eb))
* **server-dev:** Reload client window if dev server is restarted. ([b8c1d58](https://github.com/lowdefy/lowdefy/commit/b8c1d58ea8b0056fdd9ce042590f7c7f90bcc439))


### BREAKING CHANGES

* The 404 page is now always publically accessible.





# [4.0.0-alpha.5](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.4...v4.0.0-alpha.5) (2021-11-27)


### Bug Fixes

* Fix home page route in server. ([640ab8a](https://github.com/lowdefy/lowdefy/commit/640ab8a6528019bc2f2ace818053f2f3fbb3955f))
* V4 fixes. ([088e210](https://github.com/lowdefy/lowdefy/commit/088e210620ffd8d7735cc785483845d082d5485d))


### Features

* Allow Less variables to be specified in server. ([bd8ccbd](https://github.com/lowdefy/lowdefy/commit/bd8ccbdaf75fa320e5f6ee6abf3fb7480a3dc180)), closes [#893](https://github.com/lowdefy/lowdefy/issues/893)
* Import operator plugins in server. ([f913e9e](https://github.com/lowdefy/lowdefy/commit/f913e9e261777a0c7f4b0a79995ef18290186b2e))
* Update server package.json if plugin deps change. ([09f7bca](https://github.com/lowdefy/lowdefy/commit/09f7bca3a29ff186783197692e988cb315ff7483)), closes [#943](https://github.com/lowdefy/lowdefy/issues/943)





# [4.0.0-alpha.4](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.3...v4.0.0-alpha.4) (2021-11-25)


### Bug Fixes

* Plugin import fixes. ([e1becad](https://github.com/lowdefy/lowdefy/commit/e1becad08704833b2a8f559e8c88bcd7172ea622))





# [4.0.0-alpha.3](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.2...v4.0.0-alpha.3) (2021-11-25)

**Note:** Version bump only for package @lowdefy/server





# [4.0.0-alpha.2](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.1...v4.0.0-alpha.2) (2021-11-25)


### Bug Fixes

* Fixes for CLI build. ([3e58d59](https://github.com/lowdefy/lowdefy/commit/3e58d599829e1393de52e94e6e1e82f6876231ec))


### Features

* Fetch, install and build @lowdefy/server from CLI. ([7966538](https://github.com/lowdefy/lowdefy/commit/7966538468b4e9ac65003876b30ad1302132f1c3))





# [4.0.0-alpha.1](https://github.com/lowdefy/lowdefy/compare/v3.23.1...v4.0.0-alpha.1) (2021-11-25)


### Bug Fixes

* **api:** Add tests ([db478c9](https://github.com/lowdefy/lowdefy/commit/db478c970ef2360e512ad5c9e7872440f238a4c3))
* Authorisation flows working. ([5b32ca8](https://github.com/lowdefy/lowdefy/commit/5b32ca86bae8a13fea477d4d7ef19a4c5ad4fdc8))
* Clean up server configuration. ([dea25de](https://github.com/lowdefy/lowdefy/commit/dea25dec2303f19937253a0d9c699b56b28fb82b))
* **deps:** Update fastify dependencies. ([b1b321e](https://github.com/lowdefy/lowdefy/commit/b1b321e67582ebfaa0a594e4769eafe56001a40c))
* Next server fixes ([d5ab3d9](https://github.com/lowdefy/lowdefy/commit/d5ab3d92f24b09a59e6c20e31a8b01dce9d1056f))
* Remove Root component in server. ([8182775](https://github.com/lowdefy/lowdefy/commit/818277567f5465b72fac61a5ef65d929328d8570))
* Render app using blockIds generated at build. ([4e46145](https://github.com/lowdefy/lowdefy/commit/4e46145d8fdbd4f1c49891202f7182a6bb35e6f7))
* Replace all front end testing with @testing-library/react, jest and other updates. ([22ec295](https://github.com/lowdefy/lowdefy/commit/22ec2954047853096aabcddba7a2c509342f95f2))
* **server:** Move document and window to LowdefyContext component. ([db21b58](https://github.com/lowdefy/lowdefy/commit/db21b58b46202d07ca7ec66c3bf70d8982ebbfeb))


### Features

* Add authentication flows ([15e1be9](https://github.com/lowdefy/lowdefy/commit/15e1be90d063ca4e0b315ed8be1641897b694d5c))
* Add requests to client and server. ([320c4a1](https://github.com/lowdefy/lowdefy/commit/320c4a10a14b14488f13bb3b98bb100c7e6227af))
* **api:** Add api tests and fixes. ([457890b](https://github.com/lowdefy/lowdefy/commit/457890bea65b103e82ee758d96109cc3e5198c54))
* **api:** Add authorization functions. ([a039f41](https://github.com/lowdefy/lowdefy/commit/a039f41526352d11889414f679221da5b185821f))
* Build html files for each page, and serve from api ([3f53d8b](https://github.com/lowdefy/lowdefy/commit/3f53d8b20f89b2179ffe18a510e8d5415de2be39))
* **build:** Write plugin imports and types.json during build. ([14247ea](https://github.com/lowdefy/lowdefy/commit/14247eab075cea1ffde8e84f134b0f3b66920cbe))
* Fixes fro requests in next server ([e341d8d](https://github.com/lowdefy/lowdefy/commit/e341d8ded222902ce07ea1ea1d18940ac000c4da))
* Init @lowdefy/client package ([909cef7](https://github.com/lowdefy/lowdefy/commit/909cef766d8e48634b6cc0a048f71bd82565cbf4))
* Init server using next. ([bfe749f](https://github.com/lowdefy/lowdefy/commit/bfe749f442e5cb976d6c186d57efd5c94287afdd))
* Make @lowdefy/build a dev dependency of server. ([fa97eb6](https://github.com/lowdefy/lowdefy/commit/fa97eb6a34ae0ea08ae341959c461d5be4f4ba49))
* Mount home page on the home route if configured. ([ff23ea8](https://github.com/lowdefy/lowdefy/commit/ff23ea82cf8399ff012ca07a58520cda1b5853ac))
* Next server fixes. ([9e6518a](https://github.com/lowdefy/lowdefy/commit/9e6518a89e95a894b2c680146e0de15aa6f3513e))
* Next server rendering blocks ([e625e07](https://github.com/lowdefy/lowdefy/commit/e625e07a29b5ae3f09f74c629f35fe52ce73dace))
* Pass components to blocks in server, setup Icon. ([7db2640](https://github.com/lowdefy/lowdefy/commit/7db2640974dd1f77ef42be1b5ba7e4b348da24f6))
* Requests working on next server ([8d6abe2](https://github.com/lowdefy/lowdefy/commit/8d6abe27f967be6c11d1f4c29e8af73c4734dd68))
* Restructure plugin files. ([f651ed7](https://github.com/lowdefy/lowdefy/commit/f651ed7639181fb0a3db91706cb1c13950bfe654))
* Root config and link working on next server. ([cf2562b](https://github.com/lowdefy/lowdefy/commit/cf2562b088075290ddf3c354624c3c5c6d89ecf9))
* **server:** Add auth routes to server. ([4a97f4c](https://github.com/lowdefy/lowdefy/commit/4a97f4c3be64fbb0cc5e8625bb35cf34217e0e89))
* **server:** Add mount events and simplify loading states. ([104642d](https://github.com/lowdefy/lowdefy/commit/104642dc58d4c221cace0c32a3cff67f8e78d527))
* **server:** Convert server to fastify. ([0d2c1c3](https://github.com/lowdefy/lowdefy/commit/0d2c1c34d969fab5049fb501f027bea60bce54ed))





## [3.23.1](https://github.com/lowdefy/lowdefy/compare/v3.23.0...v3.23.1) (2021-11-20)

**Note:** Version bump only for package @lowdefy/server





# [3.23.0](https://github.com/lowdefy/lowdefy/compare/v3.23.0-alpha.0...v3.23.0) (2021-11-19)

**Note:** Version bump only for package @lowdefy/server





# [3.23.0-alpha.0](https://github.com/lowdefy/lowdefy/compare/v3.22.0...v3.23.0-alpha.0) (2021-11-09)

**Note:** Version bump only for package @lowdefy/server





# [3.22.0](https://github.com/lowdefy/lowdefy/compare/v3.22.0-alpha.1...v3.22.0) (2021-09-27)

**Note:** Version bump only for package @lowdefy/server





# [3.22.0-alpha.1](https://github.com/lowdefy/lowdefy/compare/v3.22.0-alpha.0...v3.22.0-alpha.1) (2021-09-20)

**Note:** Version bump only for package @lowdefy/server





# [3.22.0-alpha.0](https://github.com/lowdefy/lowdefy/compare/v3.21.2...v3.22.0-alpha.0) (2021-09-08)

**Note:** Version bump only for package @lowdefy/server





## [3.21.2](https://github.com/lowdefy/lowdefy/compare/v3.21.2-alpha.0...v3.21.2) (2021-08-31)

**Note:** Version bump only for package @lowdefy/server





## [3.21.2-alpha.0](https://github.com/lowdefy/lowdefy/compare/v3.21.1...v3.21.2-alpha.0) (2021-08-31)

**Note:** Version bump only for package @lowdefy/server





## [3.21.1](https://github.com/lowdefy/lowdefy/compare/v3.21.0...v3.21.1) (2021-08-26)

**Note:** Version bump only for package @lowdefy/server





# [3.21.0](https://github.com/lowdefy/lowdefy/compare/v3.20.4...v3.21.0) (2021-08-25)


### Bug Fixes

* **server:** replaceAll not a function, closes [#789](https://github.com/lowdefy/lowdefy/issues/789) ([055a2ac](https://github.com/lowdefy/lowdefy/commit/055a2ac4bad52402ebb200ebff02dea183af56e2))





## [3.20.4](https://github.com/lowdefy/lowdefy/compare/v3.20.3...v3.20.4) (2021-08-21)

**Note:** Version bump only for package @lowdefy/server





## [3.20.3](https://github.com/lowdefy/lowdefy/compare/v3.20.1...v3.20.3) (2021-08-20)

**Note:** Version bump only for package @lowdefy/server





## [3.20.2](https://github.com/lowdefy/lowdefy/compare/v3.20.1...v3.20.2) (2021-08-20)

**Note:** Version bump only for package @lowdefy/server





## [3.20.1](https://github.com/lowdefy/lowdefy/compare/v3.20.0...v3.20.1) (2021-08-20)

**Note:** Version bump only for package @lowdefy/server





# [3.20.0](https://github.com/lowdefy/lowdefy/compare/v3.19.0...v3.20.0) (2021-08-20)


### Bug Fixes

* Fixes for configurable basePath. ([63955bb](https://github.com/lowdefy/lowdefy/commit/63955bbd1131da3b27b537d4e0d72dc943119287))


### Features

* Make server basepath configurable ([3981f8c](https://github.com/lowdefy/lowdefy/commit/3981f8c60b9a2e6f5429a5fba499c65c16ccf30f))





# [3.19.0](https://github.com/lowdefy/lowdefy/compare/v3.18.1...v3.19.0) (2021-07-26)


### Bug Fixes

* Increase bodyParserConfig limit to 5mb. ([fc688a2](https://github.com/lowdefy/lowdefy/commit/fc688a237f27eb52f94425bf59bce0be7af92be1))





## [3.18.1](https://github.com/lowdefy/lowdefy/compare/v3.18.0...v3.18.1) (2021-06-30)

**Note:** Version bump only for package @lowdefy/server





# [3.18.0](https://github.com/lowdefy/lowdefy/compare/v3.17.2...v3.18.0) (2021-06-17)

**Note:** Version bump only for package @lowdefy/server





## [3.17.2](https://github.com/lowdefy/lowdefy/compare/v3.17.1...v3.17.2) (2021-06-11)

**Note:** Version bump only for package @lowdefy/server





## [3.17.1](https://github.com/lowdefy/lowdefy/compare/v3.17.0...v3.17.1) (2021-06-11)


### Bug Fixes

* **server-netlify:** Fix Netlify server express GraphQL path. ([f3959ad](https://github.com/lowdefy/lowdefy/commit/f3959adfe191198fbe958ecb2a14da61a8c26764))





# [3.17.0](https://github.com/lowdefy/lowdefy/compare/v3.17.0-alpha.3...v3.17.0) (2021-06-11)

**Note:** Version bump only for package @lowdefy/server





# [3.17.0-alpha.3](https://github.com/lowdefy/lowdefy/compare/v3.17.0-alpha.2...v3.17.0-alpha.3) (2021-06-09)

**Note:** Version bump only for package @lowdefy/server





# [3.17.0-alpha.2](https://github.com/lowdefy/lowdefy/compare/v3.17.0-alpha.1...v3.17.0-alpha.2) (2021-06-09)

**Note:** Version bump only for package @lowdefy/server





# [3.17.0-alpha.1](https://github.com/lowdefy/lowdefy/compare/v3.17.0-alpha.0...v3.17.0-alpha.1) (2021-06-09)

**Note:** Version bump only for package @lowdefy/server





# [3.17.0-alpha.0](https://github.com/lowdefy/lowdefy/compare/v3.16.5...v3.17.0-alpha.0) (2021-06-09)


### Features

* Add configurable public directory to servers. ([7c2beeb](https://github.com/lowdefy/lowdefy/commit/7c2beeb049d647452d4b6838427ae609e6d91b46))
* Init @lowdefy/server package. ([f4699be](https://github.com/lowdefy/lowdefy/commit/f4699be366912f8730c74036bbfbd5b2bb915b4a))
* Init @lowdefy/shell package ([1c188a0](https://github.com/lowdefy/lowdefy/commit/1c188a052f203d89241ea23c90c5b74759849343))
* Use @lowdefy/server package in dev server. ([dc4848a](https://github.com/lowdefy/lowdefy/commit/dc4848a28f70b969865e7a207d0ccfd01c9f69d4))
* Use lowdefy server in netlify server. ([4a78a97](https://github.com/lowdefy/lowdefy/commit/4a78a9753c54ef217a14e99924a0f02b4bdddf9f))
* Use shell package in dev and docker servers ([d9abe05](https://github.com/lowdefy/lowdefy/commit/d9abe05ef7267527f4fb1140557905d243246a92))
