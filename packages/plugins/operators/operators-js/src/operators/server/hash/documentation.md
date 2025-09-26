<TITLE>_hash</TITLE>
<METADATA>env: Server</METADATA>
<DESCRIPTION>The `_hash` operator generates hashes using various algorithms.</DESCRIPTION>
<USAGE>md5: (value: string): string
sha1: (value: string): string
sha256: (value: string): string
sha512: (value: string): string
ripemd160: (value: string): string</USAGE>
<EXAMPLES>###### Hash a string with MD5:
```yaml
_hash.md5: Hello World!
```
Returns: `"ed076287532e86365e841e92bfc50d8c"`.

###### Hash a string with SHA1:

```yaml
_hash.sha1: Hello World!
```

Returns: `"2ef7bde608ce5404e97d5f042f95f89f1c232871"`.

###### Hash a string with SHA256:

```yaml
_hash.sha256: Hello World!
```

Returns: `"7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069"`.

###### Hash a string with SHA512:

```yaml
_hash.sha512: Hello World!
```

Returns: `"861844d6704e8573fec34d967e20bcfef3d424cf48be04e6dc08f2bd58c729743371015ead891cc3cf1c9d34b49264b510751b1ff9e537937bc46b5d6ff4ecc8"`.

###### Hash a string with RIPEMD-160:

```yaml
_hash.ripemd160: Hello World!
```

Returns: `"8476ee4631b9b30ac2754b0ee0c47e161d3f724c"`.</EXAMPLES>
