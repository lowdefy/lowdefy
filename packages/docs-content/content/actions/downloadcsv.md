# DownloadCsv

```
(params: {
  filename: string,
  data: any[],
  fields: string[]
}): void
```

The `DownloadCsv` action is used to generate and download a CSV file from a set of data.

#### Parameters

###### object
  - `filename: string`: __Required__ - The name for the generated CSV file.
  - `data: any[]`: __Required__ - The set of data used to generate the CSV file.
  - `fields: string[]`: __Required__ - The field definitions the set of data will be mapped to in the generated CSV file.

#### Examples

###### Generate a CSV using an array of data:
```yaml
- id: generate_csv
  type: Button
  properties:
    size: large
    title: Generate a CSV
    color: '#1890ff'
  events:
    onClick:
      - id: generate_csv
        type: DownloadCsv
        params:
          filename: profiles.csv
          data:
            - Username: booker12 # an array of data, usually a request
              Identifier: 9012
              FirstName: Rachel
              LastName: Booker
            - Username: grey07
              Identifier: 2070
              FirstName: Laura
              LastName: Grey
            - Username: johnson81
              Identifier: 4081
              FirstName: Craig
              LastName: Johnson
            - Username: jenkins46
              Identifier: 9346
              FirstName: Mary
              LastName: Jenkins
            - Username: smith79
              Identifier: 5079
              FirstName: Jamie
              LastName: Smith
          fields:
            - Username # an array of field definitions
            - Identifier
            - FirstName
            - LastName
```

###### Generate a CSV using a request:
```yaml
- id: generate_csv
  type: Button
  properties:
    size: large
    title: Generate a CSV
    color: '#1890ff'
  events:
    onClick:
      - id: fetch_data
        type: Request
        params:
          - get_data
      - id: generate_csv
        type: DownloadCsv
        params:
          filename: profiles.csv
          data:
            _request: get_data # an array of data, from a request
          fields:
            - Username # an array of field definitions
            - Identifier
            - FirstName
            - LastName
```
