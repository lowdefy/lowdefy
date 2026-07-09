# _hash

The `_hash` operator generates hashes using various algorithms.

> This operator can be used as a [`_build`](/_build) operator method.

# Operator methods:

## _hash.md5

```
(value: string): string
```

The `_hash.md5` method generates the [MD5](https://en.wikipedia.org/wiki/MD5) hash of the input value.

#### Arguments

###### string
The string to hash.

#### Examples

###### Hash a string:
```yaml
_hash.md5: Hello World!
```
Returns: `"ed076287532e86365e841e92bfc50d8c"`.

## _hash.sha1

```
(value: string): string
```

The `_hash.sha1` method generates the [SHA1](https://en.wikipedia.org/wiki/SHA1) hash of the input value.

#### Arguments

###### string
The string to hash.

#### Examples

###### Hash a string:
```yaml
_hash.sha1: Hello World!
```
Returns: `"2ef7bde608ce5404e97d5f042f95f89f1c232871"`.

## _hash.sha256

```
(value: string): string
```

The `_hash.sha256` method generates the [SHA256](https://en.wikipedia.org/wiki/SHA256) hash of the input value.

#### Arguments

###### string
The string to hash.

#### Examples

###### Hash a string:
```yaml
_hash.sha256: Hello World!
```
Returns: `"7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069"`.

## _hash.sha512

```
(value: string): string
```

The `_hash.sha512` method generates the [SHA512](https://en.wikipedia.org/wiki/SHA512) hash of the input value.

#### Arguments

###### string
The string to hash.

#### Examples

###### Hash a string:
```yaml
_hash.sha512: Hello World!
```
Returns: `"861844d6704e8573fec34d967e20bcfef3d424cf48be04e6dc08f2bd58c729743371015ead891cc3cf1c9d34b49264b510751b1ff9e537937bc46b5d6ff4ecc8"`.

## _hash.ripemd160

```
(value: string): string
```

The `_hash.ripemd160` method generates the [RIPEMD-160](https://en.wikipedia.org/wiki/RIPEMD160) hash of the input value.

#### Arguments

###### string
The string to hash.

#### Examples

###### Hash a string:
```yaml
_hash.ripemd160: Hello World!
```
Returns: `"8476ee4631b9b30ac2754b0ee0c47e161d3f724c"`.
