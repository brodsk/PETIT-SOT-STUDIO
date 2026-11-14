-- Supabase Storage image request audit
-- Run in Supabase SQL Editor / Logs Explorer with source = Logs.
-- Adjust the dashboard time range to the period you want to inspect.
select
  log_attributes['request.method'] as http_verb,
  log_attributes['request.path'] as filepath,
  (log_attributes['response.headers.cf_cache_status'] = 'HIT') as cached,
  count() as num_requests
from logs
where source = 'edge_logs'
  and (
    log_attributes['request.path'] like '%storage/v1/object/%'
    or log_attributes['request.path'] like '%storage/v1/render/%'
  )
  and log_attributes['request.method'] = 'GET'
group by http_verb, filepath, cached
order by num_requests desc
limit 100;
