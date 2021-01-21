# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [3.4.0](https://github.com/lowdefy/lowdefy/compare/v3.3.0...v3.4.0) (2021-01-20)


### Bug Fixes

* **block-tools:** Fix test snapshot. ([e70fc5c](https://github.com/lowdefy/lowdefy/commit/e70fc5c1b95cecfc2b1214f59b9ba969640a239c))
* **build:** Fix app schema test tests. ([86917c0](https://github.com/lowdefy/lowdefy/commit/86917c0f79ca75321af5d89e2f29e9328debec50))
* **build:** Fix lowdefy app schema. ([f33c151](https://github.com/lowdefy/lowdefy/commit/f33c151dfbe1a2ea55ead94c0fc6ef2573f34875))
* **graphql:** Add request deserialize tests for entire inputs. ([98cdbd8](https://github.com/lowdefy/lowdefy/commit/98cdbd895bc038ac49e75554fccf3110b9bed504))
* **graphql:** Deserialize request input variables. ([82e8475](https://github.com/lowdefy/lowdefy/commit/82e8475c2757e35adf24d489627738de736984d4))
* **graphql:** Update tests operator error message. ([c534328](https://github.com/lowdefy/lowdefy/commit/c53432827c2ba05ae4cd6ac16d94c1fa108e374a))
* **operators:** getFromObject should copy object if getting entire obj ([32f0cbc](https://github.com/lowdefy/lowdefy/commit/32f0cbcf813376ad48bd50e375065a536e8f0e35))
* **operators:** Update test error message snapshots. ([1b49ba2](https://github.com/lowdefy/lowdefy/commit/1b49ba233110265db8fb26a8f6294e6e4518b46f))
* _lt, _lte, _gt, _gte not to throw on non numerics. ([0bad71d](https://github.com/lowdefy/lowdefy/commit/0bad71d2276cdab85b37bba6ada7e859ec7f51fb))
* Temporarily log parser errors to console. ([a43b386](https://github.com/lowdefy/lowdefy/commit/a43b3860354142815e173fc6875f663e018525c7))


### Features

* **build:** Add licence field to app schema. ([a6f7c91](https://github.com/lowdefy/lowdefy/commit/a6f7c910f629884942424f0f177614ca8c3c45ae))





# [3.3.0](https://github.com/lowdefy/lowdefy/compare/v3.1.1...v3.3.0) (2021-01-18)


### Bug Fixes

* Fix location not defined. ([90f1e25](https://github.com/lowdefy/lowdefy/commit/90f1e25594f5ef9cb8f0a6c75e51809a0cb2da6d))
* Give defaultFunction to runClass and error in undefined methodName. ([38af83b](https://github.com/lowdefy/lowdefy/commit/38af83b3fc8fed64427b79ee17275585151259a8))
* Make all method operators work with runClass and runInstance. ([ef58619](https://github.com/lowdefy/lowdefy/commit/ef58619e87d7dd50d045f7dd04587209f8a7679a))
* Update error message for unsupported method. ([285a6cb](https://github.com/lowdefy/lowdefy/commit/285a6cb9284d0d07e02712004539622484797f8b))
* Update tests in engie to work with new operator format. ([4f626a1](https://github.com/lowdefy/lowdefy/commit/4f626a1c543daa0f6fa3fdb0cd6316d642e49700))
* **deps:** update apollo server packages to v2.19.1 ([#326](https://github.com/lowdefy/lowdefy/issues/326)) ([8b977e3](https://github.com/lowdefy/lowdefy/commit/8b977e363930b2c5b639fd4455751d81e3487570))
* **deps:** update dependency aws-sdk to v2.828.0 ([a94debd](https://github.com/lowdefy/lowdefy/commit/a94debd1781ad749218560076901bde6c2587016))
* **deps:** update dependency axios to v0.21.1 [security] ([99d91ed](https://github.com/lowdefy/lowdefy/commit/99d91edce62a5e7c9d98f94f12bbcc1754cee303))
* **deps:** update dependency axios to v0.21.1 [security] yarn pnp ([69807c2](https://github.com/lowdefy/lowdefy/commit/69807c2e20d4e8b460157aa1a94846606b93dcda))
* **deps:** update dependency chokidar to v3.5.0 ([#329](https://github.com/lowdefy/lowdefy/issues/329)) ([3e79f6f](https://github.com/lowdefy/lowdefy/commit/3e79f6f55419995437210f091d39775d3e6fd47d))
* **deps:** update dependency query-string to v6.13.8 ([17bdbb8](https://github.com/lowdefy/lowdefy/commit/17bdbb8ad2e67dd10c0749beb838090985f0ec66))
* **deps:** Update js-yaml from 3.14.1 to 4.0.0. ([1a9e1f9](https://github.com/lowdefy/lowdefy/commit/1a9e1f9e1057c14a3638bdd140de1b50d2721cd0))
* project operator import typo ([84ea45e](https://github.com/lowdefy/lowdefy/commit/84ea45e0c169194352a716910ecb9a3fc9312114))
* Update runInstance and runClass to cover all function types. ([bc49186](https://github.com/lowdefy/lowdefy/commit/bc491863e311f32fd30f6f46af412d5a09edd6ca))
* **cli:** add dev server port option ([744ce51](https://github.com/lowdefy/lowdefy/commit/744ce51e9f0318211764d12d82c5e47a7f93c09a))
* **deps:** update apollo server packages to v2.19.2 ([68f89d0](https://github.com/lowdefy/lowdefy/commit/68f89d0b9a131bfd031af5a95f9b71b276efa275))
* **deps:** update dependency @apollo/client to v3.3.7 ([390dbb1](https://github.com/lowdefy/lowdefy/commit/390dbb1d75a9225d4cdcb74c68e4b70aebae9d4c))
* **deps:** Update package @wojtekmaj/enzyme-adapter-react-17 to v0.4.1 ([251102e](https://github.com/lowdefy/lowdefy/commit/251102e986b3e18804a8c94dbde2e93d3a7a85e9))
* Change allowed properties and methods to Sets. ([8b91c21](https://github.com/lowdefy/lowdefy/commit/8b91c211806303ec16a07f23fea50836e91e27c6))
* Change to mingo system import file. ([a540435](https://github.com/lowdefy/lowdefy/commit/a540435870977a3274c5a057f08dbbe6dca929f4))
* Evaluate _math using runMethod. ([3f06967](https://github.com/lowdefy/lowdefy/commit/3f06967282a456290907f30586f6e4dcdc7b94b2))
* packages/graphql/package.json to reduce vulnerabilities ([63aab05](https://github.com/lowdefy/lowdefy/commit/63aab0545dacf36d9e1a29c92a73f576565fb081))
* packages/graphql/package.json to reduce vulnerabilities ([942fa1e](https://github.com/lowdefy/lowdefy/commit/942fa1e11fd8b067dffff97319072449b1c7cdc3))
* Rename _base64_encode and _base64_decode to _base64.encode and _base64.decode. ([8ded919](https://github.com/lowdefy/lowdefy/commit/8ded919d17653852ad764d9210a9c0ae020086aa))
* Rename _uri_encode and _uri_decode to _uri.encode and _uri.decode. ([bb0e9b4](https://github.com/lowdefy/lowdefy/commit/bb0e9b4df16fa6ca89c6060d1698db76cd6720e0))


### Features

* Add _diff operator on NodeParser. ([ea65823](https://github.com/lowdefy/lowdefy/commit/ea6582330998834deaeb6d1a5184573fb15700a3))
* Rewrite date to us runClass. ([9fe2698](https://github.com/lowdefy/lowdefy/commit/9fe2698f19b3cc622bb2da95c8c43c9df2a819d8))
* Throw error on _divide by zero. ([3d0047d](https://github.com/lowdefy/lowdefy/commit/3d0047d8f9924d513a6cd0afd617275e4f2234ac))
* **build:** Add transformer function option to _ref. ([27c9114](https://github.com/lowdefy/lowdefy/commit/27c9114678bcc4ba41ed42ef9e1e96a86b76cb28))
* **build:** add vars parameter to transformer function. ([c0782fe](https://github.com/lowdefy/lowdefy/commit/c0782fee22180a178ee647cfc1b700ba394b38cc))
* **cli:** Rename version field in lowdefy.yaml to lowdefy. ([51ed277](https://github.com/lowdefy/lowdefy/commit/51ed277a0525c1fd6eca426f709a50852b764ece))
* Add _array, _object and _string operators. ([39197f7](https://github.com/lowdefy/lowdefy/commit/39197f760119c16ad6036259a30060a3c67f2e82))
* Add _base64_encode and _base64_decode operators. ([25eb55a](https://github.com/lowdefy/lowdefy/commit/25eb55a5cd920bc219d24a25126faf227068e196))
* Add _divide operator. ([cc57d5d](https://github.com/lowdefy/lowdefy/commit/cc57d5dd01879ed019cdc190694fd54e1eb3babc))
* Add _gt, _gte, _lt, _lte operators. ([e9d3bba](https://github.com/lowdefy/lowdefy/commit/e9d3bba6ef12facc16d70d3f1bf6e0c752d0c3ad))
* Add _if_none operator. ([6ee7e42](https://github.com/lowdefy/lowdefy/commit/6ee7e42c27dcdd2def6f73a06fd022d4a67e223c))
* Add _json.parse and _json.stringify to replace _json_parse and _json_stringify. ([b83749f](https://github.com/lowdefy/lowdefy/commit/b83749f7655eb21dcdfed57c2cb968bac45e5227))
* Add _log operator. ([735cea0](https://github.com/lowdefy/lowdefy/commit/735cea080dbb34a0f91f6a3d112bc6e274d1a216))
* Add _math operator. ([9c447f7](https://github.com/lowdefy/lowdefy/commit/9c447f7ebbb4d1824b97c661c65addb7fd5d4c42))
* Add _media operator. ([fc860ad](https://github.com/lowdefy/lowdefy/commit/fc860ad7091b7b7b74c9b347a2674c98daa4feac))
* Add _mql to replace _mql_aggregate, _mql_test, _mql_expr. ([20e16bc](https://github.com/lowdefy/lowdefy/commit/20e16bc2bf18c71b7ae0dac6252966982e7c11b7))
* Add _product operator. ([54704de](https://github.com/lowdefy/lowdefy/commit/54704de97629096118e75f5e19cb38c03024b1c0))
* Add _random operator. ([41d1960](https://github.com/lowdefy/lowdefy/commit/41d19608b437c0cc6b81a530343dea3450b2942c))
* Add _subtract operator. ([0f1c1c6](https://github.com/lowdefy/lowdefy/commit/0f1c1c6d8bf750b78aec38b375dbe18761553dbe))
* Add _sum operator. ([05e5a8d](https://github.com/lowdefy/lowdefy/commit/05e5a8d44098c2433e7c2e60379e3c4f02de25c5))
* Add _uri_encode and _uri_decode operators. ([bdb0eb8](https://github.com/lowdefy/lowdefy/commit/bdb0eb8e49768d9f3b1f969b4503e488a2db340d))
* Add _uuid operator to NodeParser. ([0f562fe](https://github.com/lowdefy/lowdefy/commit/0f562feff59167be3431c04cb1aa65a678eba400))
* Add .env file support for serverDev. ([d533726](https://github.com/lowdefy/lowdefy/commit/d533726993296454d8faa288ca8ea169854ce4b4))
* Add copy option to get. ([9d5b40f](https://github.com/lowdefy/lowdefy/commit/9d5b40f922c95929203b641457231af82d69b6f2))
* Allow method dot notation for operations, and parser performance improvement. ([f0c1711](https://github.com/lowdefy/lowdefy/commit/f0c171179a06152cf756542166c0c37005a7ba29))
* Ignore operator objects with more than one key. ([225a543](https://github.com/lowdefy/lowdefy/commit/225a543a1ecc27b0c624726add3b014d24cec68c))
* Rename _parse to _json_parse, _stringify to _json_stringify, _dump_yaml to _yaml_stringify,  _load_yaml to _yaml_parse. ([ac6eb0a](https://github.com/lowdefy/lowdefy/commit/ac6eb0ab1af02854d93eedfdfb643f0bc664663a))
* Replace _yaml_parse and _yaml_stringify with _yaml.parse and _yaml.stringify. ([d61a316](https://github.com/lowdefy/lowdefy/commit/d61a3165631c97c075b1f8c8f0bf6285d6d8958f))
* Update default block versions to ^3.0.0. ([78f1200](https://github.com/lowdefy/lowdefy/commit/78f1200382f3d2f262ab562c6baf63c68283b692))





# [3.2.0](https://github.com/lowdefy/lowdefy/compare/v3.1.1...v3.2.0) (2021-01-18)


### Bug Fixes

* Fix location not defined. ([90f1e25](https://github.com/lowdefy/lowdefy/commit/90f1e25594f5ef9cb8f0a6c75e51809a0cb2da6d))
* Give defaultFunction to runClass and error in undefined methodName. ([38af83b](https://github.com/lowdefy/lowdefy/commit/38af83b3fc8fed64427b79ee17275585151259a8))
* Make all method operators work with runClass and runInstance. ([ef58619](https://github.com/lowdefy/lowdefy/commit/ef58619e87d7dd50d045f7dd04587209f8a7679a))
* Update error message for unsupported method. ([285a6cb](https://github.com/lowdefy/lowdefy/commit/285a6cb9284d0d07e02712004539622484797f8b))
* Update tests in engie to work with new operator format. ([4f626a1](https://github.com/lowdefy/lowdefy/commit/4f626a1c543daa0f6fa3fdb0cd6316d642e49700))
* **deps:** update apollo server packages to v2.19.1 ([#326](https://github.com/lowdefy/lowdefy/issues/326)) ([8b977e3](https://github.com/lowdefy/lowdefy/commit/8b977e363930b2c5b639fd4455751d81e3487570))
* **deps:** update dependency aws-sdk to v2.828.0 ([a94debd](https://github.com/lowdefy/lowdefy/commit/a94debd1781ad749218560076901bde6c2587016))
* **deps:** update dependency axios to v0.21.1 [security] ([99d91ed](https://github.com/lowdefy/lowdefy/commit/99d91edce62a5e7c9d98f94f12bbcc1754cee303))
* **deps:** update dependency axios to v0.21.1 [security] yarn pnp ([69807c2](https://github.com/lowdefy/lowdefy/commit/69807c2e20d4e8b460157aa1a94846606b93dcda))
* **deps:** update dependency chokidar to v3.5.0 ([#329](https://github.com/lowdefy/lowdefy/issues/329)) ([3e79f6f](https://github.com/lowdefy/lowdefy/commit/3e79f6f55419995437210f091d39775d3e6fd47d))
* **deps:** update dependency query-string to v6.13.8 ([17bdbb8](https://github.com/lowdefy/lowdefy/commit/17bdbb8ad2e67dd10c0749beb838090985f0ec66))
* **deps:** Update js-yaml from 3.14.1 to 4.0.0. ([1a9e1f9](https://github.com/lowdefy/lowdefy/commit/1a9e1f9e1057c14a3638bdd140de1b50d2721cd0))
* project operator import typo ([84ea45e](https://github.com/lowdefy/lowdefy/commit/84ea45e0c169194352a716910ecb9a3fc9312114))
* Update runInstance and runClass to cover all function types. ([bc49186](https://github.com/lowdefy/lowdefy/commit/bc491863e311f32fd30f6f46af412d5a09edd6ca))
* **cli:** add dev server port option ([744ce51](https://github.com/lowdefy/lowdefy/commit/744ce51e9f0318211764d12d82c5e47a7f93c09a))
* **deps:** update apollo server packages to v2.19.2 ([68f89d0](https://github.com/lowdefy/lowdefy/commit/68f89d0b9a131bfd031af5a95f9b71b276efa275))
* **deps:** update dependency @apollo/client to v3.3.7 ([390dbb1](https://github.com/lowdefy/lowdefy/commit/390dbb1d75a9225d4cdcb74c68e4b70aebae9d4c))
* **deps:** Update package @wojtekmaj/enzyme-adapter-react-17 to v0.4.1 ([251102e](https://github.com/lowdefy/lowdefy/commit/251102e986b3e18804a8c94dbde2e93d3a7a85e9))
* Change allowed properties and methods to Sets. ([8b91c21](https://github.com/lowdefy/lowdefy/commit/8b91c211806303ec16a07f23fea50836e91e27c6))
* Change to mingo system import file. ([a540435](https://github.com/lowdefy/lowdefy/commit/a540435870977a3274c5a057f08dbbe6dca929f4))
* Evaluate _math using runMethod. ([3f06967](https://github.com/lowdefy/lowdefy/commit/3f06967282a456290907f30586f6e4dcdc7b94b2))
* packages/graphql/package.json to reduce vulnerabilities ([63aab05](https://github.com/lowdefy/lowdefy/commit/63aab0545dacf36d9e1a29c92a73f576565fb081))
* packages/graphql/package.json to reduce vulnerabilities ([942fa1e](https://github.com/lowdefy/lowdefy/commit/942fa1e11fd8b067dffff97319072449b1c7cdc3))
* Rename _base64_encode and _base64_decode to _base64.encode and _base64.decode. ([8ded919](https://github.com/lowdefy/lowdefy/commit/8ded919d17653852ad764d9210a9c0ae020086aa))
* Rename _uri_encode and _uri_decode to _uri.encode and _uri.decode. ([bb0e9b4](https://github.com/lowdefy/lowdefy/commit/bb0e9b4df16fa6ca89c6060d1698db76cd6720e0))


### Features

* Add _diff operator on NodeParser. ([ea65823](https://github.com/lowdefy/lowdefy/commit/ea6582330998834deaeb6d1a5184573fb15700a3))
* Rewrite date to us runClass. ([9fe2698](https://github.com/lowdefy/lowdefy/commit/9fe2698f19b3cc622bb2da95c8c43c9df2a819d8))
* Throw error on _divide by zero. ([3d0047d](https://github.com/lowdefy/lowdefy/commit/3d0047d8f9924d513a6cd0afd617275e4f2234ac))
* **build:** Add transformer function option to _ref. ([27c9114](https://github.com/lowdefy/lowdefy/commit/27c9114678bcc4ba41ed42ef9e1e96a86b76cb28))
* **build:** add vars parameter to transformer function. ([c0782fe](https://github.com/lowdefy/lowdefy/commit/c0782fee22180a178ee647cfc1b700ba394b38cc))
* **cli:** Rename version field in lowdefy.yaml to lowdefy. ([51ed277](https://github.com/lowdefy/lowdefy/commit/51ed277a0525c1fd6eca426f709a50852b764ece))
* Add _array, _object and _string operators. ([39197f7](https://github.com/lowdefy/lowdefy/commit/39197f760119c16ad6036259a30060a3c67f2e82))
* Add _base64_encode and _base64_decode operators. ([25eb55a](https://github.com/lowdefy/lowdefy/commit/25eb55a5cd920bc219d24a25126faf227068e196))
* Add _divide operator. ([cc57d5d](https://github.com/lowdefy/lowdefy/commit/cc57d5dd01879ed019cdc190694fd54e1eb3babc))
* Add _gt, _gte, _lt, _lte operators. ([e9d3bba](https://github.com/lowdefy/lowdefy/commit/e9d3bba6ef12facc16d70d3f1bf6e0c752d0c3ad))
* Add _if_none operator. ([6ee7e42](https://github.com/lowdefy/lowdefy/commit/6ee7e42c27dcdd2def6f73a06fd022d4a67e223c))
* Add _json.parse and _json.stringify to replace _json_parse and _json_stringify. ([b83749f](https://github.com/lowdefy/lowdefy/commit/b83749f7655eb21dcdfed57c2cb968bac45e5227))
* Add _log operator. ([735cea0](https://github.com/lowdefy/lowdefy/commit/735cea080dbb34a0f91f6a3d112bc6e274d1a216))
* Add _math operator. ([9c447f7](https://github.com/lowdefy/lowdefy/commit/9c447f7ebbb4d1824b97c661c65addb7fd5d4c42))
* Add _media operator. ([fc860ad](https://github.com/lowdefy/lowdefy/commit/fc860ad7091b7b7b74c9b347a2674c98daa4feac))
* Add _mql to replace _mql_aggregate, _mql_test, _mql_expr. ([20e16bc](https://github.com/lowdefy/lowdefy/commit/20e16bc2bf18c71b7ae0dac6252966982e7c11b7))
* Add _product operator. ([54704de](https://github.com/lowdefy/lowdefy/commit/54704de97629096118e75f5e19cb38c03024b1c0))
* Add _random operator. ([41d1960](https://github.com/lowdefy/lowdefy/commit/41d19608b437c0cc6b81a530343dea3450b2942c))
* Add _subtract operator. ([0f1c1c6](https://github.com/lowdefy/lowdefy/commit/0f1c1c6d8bf750b78aec38b375dbe18761553dbe))
* Add _sum operator. ([05e5a8d](https://github.com/lowdefy/lowdefy/commit/05e5a8d44098c2433e7c2e60379e3c4f02de25c5))
* Add _uri_encode and _uri_decode operators. ([bdb0eb8](https://github.com/lowdefy/lowdefy/commit/bdb0eb8e49768d9f3b1f969b4503e488a2db340d))
* Add _uuid operator to NodeParser. ([0f562fe](https://github.com/lowdefy/lowdefy/commit/0f562feff59167be3431c04cb1aa65a678eba400))
* Add .env file support for serverDev. ([d533726](https://github.com/lowdefy/lowdefy/commit/d533726993296454d8faa288ca8ea169854ce4b4))
* Add copy option to get. ([9d5b40f](https://github.com/lowdefy/lowdefy/commit/9d5b40f922c95929203b641457231af82d69b6f2))
* Allow method dot notation for operations, and parser performance improvement. ([f0c1711](https://github.com/lowdefy/lowdefy/commit/f0c171179a06152cf756542166c0c37005a7ba29))
* Ignore operator objects with more than one key. ([225a543](https://github.com/lowdefy/lowdefy/commit/225a543a1ecc27b0c624726add3b014d24cec68c))
* Rename _parse to _json_parse, _stringify to _json_stringify, _dump_yaml to _yaml_stringify,  _load_yaml to _yaml_parse. ([ac6eb0a](https://github.com/lowdefy/lowdefy/commit/ac6eb0ab1af02854d93eedfdfb643f0bc664663a))
* Replace _yaml_parse and _yaml_stringify with _yaml.parse and _yaml.stringify. ([d61a316](https://github.com/lowdefy/lowdefy/commit/d61a3165631c97c075b1f8c8f0bf6285d6d8958f))
* Update default block versions to ^3.0.0. ([78f1200](https://github.com/lowdefy/lowdefy/commit/78f1200382f3d2f262ab562c6baf63c68283b692))
