# :parallel

```
({:parallel: routine[]}): void
```

The `:parallel` control executes multiple independent routines simultaneously. All routines within the `:parallel` array are started at the same time and the control waits for all of them to complete before continuing. If any routine returns with an error, rejection, or explicit return, the parallel control will exit early with that status (prioritizing errors first, then rejections, then returns).

#### Keys

- `:parallel: routine[]`: __Required__ - An array of routines that will be executed in parallel.

#### Examples

###### Fetch from multiple sources in parallel

```yaml
routine:
  - :parallel:
      - id: fetch_user_stats
        type: MongoDBAggregation
        connectionId: users
        properties:
          pipeline:
            - $match:
                account_id:
                  _payload: account_id
            - $group:
                _id: null
                total_users:
                  $sum: 1
                active_users:
                  $sum:
                    $cond:
                      - $eq: ['$status', 'active']
                      - 1
                      - 0

      - id: fetch_revenue
        type: KnexRaw
        connectionId: analytics_db
        properties:
          query: |
            SELECT
              SUM(amount) as total_revenue,
              COUNT(*) as transaction_count
            FROM transactions
            WHERE account_id = :account_id
              AND created_at >= NOW() - INTERVAL '30 days'
          parameters:
            account_id:
              _payload: account_id

      - id: fetch_tickets
        type: AxiosHttp
        connectionId: tickets-api
        properties:
          url: '/tickets'
          method: get
          params:
            organization_id:
              _payload: account_id
            status: 'open'
  - :return:
      user_stats:
        _step: fetch_user_stats
      revenue:
        _step: revenue
      tickets:
        _step: fetch_tickets
```
