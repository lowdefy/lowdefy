<TITLE>
GeolocationCurrentPosition
<TITLE>

<DESCRIPTION>
The `GeolocationCurrentPosition` action is used to get the current position of the device.
<DESCRIPTION>

<USAGE>
```
(params: {
  enableHighAccuracy?: boolean,
  maximumAge?: number,
  timeout?: number,
}) : object
```

### object
- `enableHighAccuracy: boolean`: Indicates that the most accurate possible position should be returned. Defaults to false.
- `maximumAge: number`: The maximum age in milliseconds of a possible cached position that is acceptable to return. The default is 0.
- `timeout: number`: The maximum length of time in milliseconds the device is allowed to take to return a position. The default is infinity.

##### Successful response:
###### object
- `coords: object`: A GeolocationCoordinates object instance.
  - `accuracy: float`: The accuracy of the latitude and longitude properties, expressed in meters.
  - `altitude: float`: The position's altitude in meters, relative to sea level.
  - `altitudeAccuracy: float`: The accuracy of the altitude expressed in meters.
  - `heading: float`: The direction, in degrees clockwise from true North, towards which the device is facing.
  - `latitude: float`: The position's latitude in decimal degrees.
  - `longitude: float`: The position's longitude in decimal degrees.
  - `speed: float`: The velocity of the device in meters per second.
- `timestamp: number`: A Unix time in milliseconds.

##### Error response:
Note that this error response does not break the action chain. The possible errors can be viewed [here](https://developer.mozilla.org/en-US/docs/Web/API/GeolocationPositionError).
###### object
- `code: number`: The error code associated with the error.
- `error: string`: The constant associated with the error code.
- `message: string`: A string describing the details of the error.
</USAGE>

<EXAMPLES>
### Get geolocation with specified params:
```yaml
- id: get_geolocation
  type: GeolocationCurrentPosition
  params:
    enableHighAccuracy: true
    timeout: 5000
    maximumAge: 0
- id: set_data
  type: SetState
  params:
    geolocation:
      _actions: get_geolocation.response
```
</EXAMPLES>
