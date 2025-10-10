<TITLE>_object</TITLE>
<METADATA>env: Shared</METADATA>
<DESCRIPTION>The `_object` operator can be used to run javascript [`Object`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) methods.</DESCRIPTION>
<USAGE>The `_object` operator can be used to run javascript [`Object`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) methods.</USAGE>
<EXAMPLES>###### Merge three objects:
```yaml
_object.assign:
  - firstName: Rachel
    lastName: Green
    series: Friends
  - firstName: Monica
    lastName: Geller
    address:
      street: 90 Bedford St
      city: New York
      zipCode: '10014'
      country: US
  - friends:
      - Ross Geller
      - Rachel Green
      - Chandler Bing
      - Phoebe Buffay
      - Joey Tribbiani
```
Returns:
```yaml
firstName: Monica
lastName: Geller
series: Friends
address:
  street: 90 Bedford St
  city: New York
  zipCode: '10014'
  country: US
friends:
  - Ross Geller
  - Rachel Green
  - Chandler Bing
  - Phoebe Buffay
  - Joey Tribbiani
```
###### Set a value to a object key:
```yaml
_object.defineProperty:
  on:
    firstName: Rachel
    series: Friends
  key: lastName
  descriptor:
    value: Green
```
Returns:
```yaml
firstName: Rachel
lastName: Green
series: Friends
```
###### Get the entries of an object:
```yaml
_object.entries:
  firstName: Monica
  lastName: Geller
```
Returns:
```yaml
- - firstName
  - Monica
- - lastName
  - Geller
```
###### Get the entries of an object:
```yaml
_object.fromEntries:
  - - firstName
    - Monica
  - - lastName
    - Geller
```
Returns:
```yaml
firstName: Monica
lastName: Geller
```
###### Get the keys of an object:
```yaml
_object.keys:
  firstName: Monica
  lastName: Geller
  address:
    street: 90 Bedford St
    city: New York
    zipCode: '10014'
    country: US
  friends:
    - Ross Geller
    - Rachel Green
    - Chandler Bing
    - Phoebe Buffay
    - Joey Tribbiani
```
Returns:
```yaml
- firstName
- lastName
- address
- friends
```
###### Get the values of an object:
```yaml
_object.values:
  firstName: Monica
  lastName: Geller
  address:
    street: 90 Bedford St
    city: New York
    zipCode: '10014'
    country: US
  friends:
    - Ross Geller
    - Rachel Green
    - Chandler Bing
    - Phoebe Buffay
    - Joey Tribbiani
```
Returns:
```yaml
- Monica
- Geller
- street: 90 Bedford St
  city: New York
  zipCode: '10014'
  country: US
- - Ross Geller
  - Rachel Green
  - Chandler Bing
  - Phoebe Buffay
  - Joey Tribbiani
```</EXAMPLES>
