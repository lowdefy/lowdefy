# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [3.0.0](https://github.com/lowdefy/lowdefy/compare/@lowdefy/cli@3.0.0-alpha.7...@lowdefy/cli@3.0.0) (2020-12-15)


### Bug Fixes

* **cli:** Use startUp function in clean-cache command ([cc6ffa0](https://github.com/lowdefy/lowdefy/commit/cc6ffa07930792a574ee76f657b61eefcf9d1156))
* **deps:** update dependency commander to v6.2.1 ([71d62c9](https://github.com/lowdefy/lowdefy/commit/71d62c9e69024139043ee6aab3c6903c0a643c35))


### Features

* **cli:** add app and machine ids to telemetry ([a3a2bc0](https://github.com/lowdefy/lowdefy/commit/a3a2bc0e1500e9bb0f9feed507d54d356d7a1859))
* **cli:** add disable telemetry flag ([c97cde4](https://github.com/lowdefy/lowdefy/commit/c97cde45117a3bcc0dc11711a81cc7f5f5e5f275))
* **cli:** add telemetry ([3ce6dc5](https://github.com/lowdefy/lowdefy/commit/3ce6dc5b5b0f50733fffb92d6f4f0a9fa7b8c560))
* **cli:** Clean block meta cache on build and dev commands. ([4fb5fbd](https://github.com/lowdefy/lowdefy/commit/4fb5fbd3c35aeaab75238298e95b88676d63e2b6))
* **cli:** Log cli errors to lowdefy api. ([4e8ef7b](https://github.com/lowdefy/lowdefy/commit/4e8ef7b34615de4c3da7015721188b5d5bfa3224))
* **cli:** Shutdown development server if .env file changed. ([1a89a11](https://github.com/lowdefy/lowdefy/commit/1a89a11a3bf75c1c311f03bd00ebe3974274f240))





# 3.0.0-alpha.7 (2020-12-10)


### Bug Fixes

* **cli:** fix build script mf path ([1548905](https://github.com/lowdefy/lowdefy/commit/1548905af936bae93a249be73fb2ae5e51047150))
* **cli:** fix clean cache description and error messages ([a3a9ffc](https://github.com/lowdefy/lowdefy/commit/a3a9ffccb63ac4097da91a1feb08636caf5c4c81))
* **cli:** fix dev server static path ([b963569](https://github.com/lowdefy/lowdefy/commit/b963569387152af24938c2435319df4d6873da08))
* **cli:** fix test imports ([93d35e4](https://github.com/lowdefy/lowdefy/commit/93d35e453f596fdc10bc17d65511fa0ca982ef79))
* **cli:** node_modules should be moved to project root in build-netlify ([9c46108](https://github.com/lowdefy/lowdefy/commit/9c461084f847a9cb2c3bb11f1b923f323bb96ddd))
* **cli:** react and @lowdefy/block-tools should be dev deps ([3859a43](https://github.com/lowdefy/lowdefy/commit/3859a436fa476610c0c1ed0a97a9961394be9379))
* **cli:** update block-tools package version ([c24e31e](https://github.com/lowdefy/lowdefy/commit/c24e31efac6780f0378a9f557ac524154a6bf3b7))
* **deps:** update apollo graphql packages to v2.19.0 ([a620fb0](https://github.com/lowdefy/lowdefy/commit/a620fb077f6f2b5f826de3638246de9dbae9568a))
* **deps:** update dependency js-yaml to v3.14.1 ([935ad89](https://github.com/lowdefy/lowdefy/commit/935ad894cd221901784360bee684189a60a2d386))
* @lowdefy/block-tools version in cli ([2cc6ae2](https://github.com/lowdefy/lowdefy/commit/2cc6ae217ff81ffb5f6b024eb2e4ce89909fc9a6))
* ci test fixes ([1f2d71b](https://github.com/lowdefy/lowdefy/commit/1f2d71b50171bae23d835278cce6332b7815dc65))
* **deps:** update dependency chokidar to v3.4.3 ([89bcb1f](https://github.com/lowdefy/lowdefy/commit/89bcb1fda83e974f7ca360a7728736a2c784d1d7))
* **deps:** update dependency commander to v6.2.0 ([01781af](https://github.com/lowdefy/lowdefy/commit/01781af6d89c073fa6e0738f3fed713f2b2f6273))


### Features

* **blockTools:** bump version ([b450047](https://github.com/lowdefy/lowdefy/commit/b450047478ba55d93e233c839c77677c0114847a))
* **blockTools:** move module fed functions to blockTools ([5e6cebf](https://github.com/lowdefy/lowdefy/commit/5e6cebf6d0eaef1360ba1637e7135df52858fd16)), closes [#219](https://github.com/lowdefy/lowdefy/issues/219)
* **cli:** add build-netlify command ([c779ac7](https://github.com/lowdefy/lowdefy/commit/c779ac7c8aff9c43676b0a51fb31f2f83f055047))
* **cli:** add clean cache command ([1a97665](https://github.com/lowdefy/lowdefy/commit/1a976659c8fd0a0c27076a8b71fd5360f8907ee9))
* **cli:** add errorBoundary and getLowdefyVersion utils ([519e604](https://github.com/lowdefy/lowdefy/commit/519e6047714a8e32072eaacaa111eff666b69e71))
* **cli:** add ora spinners ([5ac00f5](https://github.com/lowdefy/lowdefy/commit/5ac00f50da8a7f4577291e4b0a2f1064c0686c51))
* **cli:** add output directory option to build ([6a09779](https://github.com/lowdefy/lowdefy/commit/6a097793f3c6d5cb6cf1f83c2ae8c4321fe4b28c))
* **cli:** add suport for user public assets in netlify build ([e11a9de](https://github.com/lowdefy/lowdefy/commit/e11a9de120f5d23ae62d3471cfba7e87060f74a7))
* **cli:** console output improvements ([9ea1c22](https://github.com/lowdefy/lowdefy/commit/9ea1c2279adcbe1d62412dde43dc1243e13d2b08))
* **cli:** dev server running ([8d33183](https://github.com/lowdefy/lowdefy/commit/8d331836156c9d16af4cb0adb637bd89d17b3043))
* **cli:** do not print in color in netlify builds ([ce5b29e](https://github.com/lowdefy/lowdefy/commit/ce5b29ed6392c94f086c299fda9c4a47be176695))
* **cli:** improve cli console logs ([7ca7509](https://github.com/lowdefy/lowdefy/commit/7ca7509e2696e2380a02aded5b22d6bd9b1ec62f)), closes [#247](https://github.com/lowdefy/lowdefy/issues/247)
* **cli:** improve errors ([dfa9629](https://github.com/lowdefy/lowdefy/commit/dfa96290e3e01371d12dd16182adc8dc7e21e905))
* **cli:** improve module federation, use @lowdefy/graphql-federated ([1139232](https://github.com/lowdefy/lowdefy/commit/11392323082b9c4105ebfc393aa83802f91f487c))
* **cli:** init cli with build command ([92fff8f](https://github.com/lowdefy/lowdefy/commit/92fff8f157ce6ac2d2df09dac7f8f2073e120b63))
* **cli:** init dev server ([7eae1a8](https://github.com/lowdefy/lowdefy/commit/7eae1a80f456f0987c8835a3966ca5a7a6a80018))
* **cli:** init loadBuildScriptToCache ([f2eabfa](https://github.com/lowdefy/lowdefy/commit/f2eabfae9232d151e1f9001d012b7e39c0fcdb13))
* **cli:** init module federation of build script ([34dba01](https://github.com/lowdefy/lowdefy/commit/34dba017246b38b940f6614d66def34844f9e961))
* **cli:** print tests, ux polish ([9b6a3e1](https://github.com/lowdefy/lowdefy/commit/9b6a3e199861301cd00a071f77f8c8e352f72c33))
* **cli:** read secrets from env, add dotenv ([6b9bd63](https://github.com/lowdefy/lowdefy/commit/6b9bd63e6f4f471450febae52e1149179dc3509d))
* **servers:** add logos, favicons and pwa icons ([fc8610e](https://github.com/lowdefy/lowdefy/commit/fc8610e7f529071fd9ce3961b3991cab2d7911bd))
