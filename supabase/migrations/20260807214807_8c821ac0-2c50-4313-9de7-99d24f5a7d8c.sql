select cron.schedule(
  'route-verify-daily',
  '0 9 * * *',
  $$
  select net.http_post(
    url := 'https://bbmhrgpsyiahefnxqwfg.supabase.co/functions/v1/route-verify',
    headers := '{"Content-Type": "application/json", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJibWhyZ3BzeWlhaGVmbnhxd2ZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1Njc5ODcsImV4cCI6MjA3OTE0Mzk4N30.zPuWahf5g140hdR__asVINWBvYJaxZmVvDQTvIAjLww"}'::jsonb,
    body := '{"trigger":"cron"}'::jsonb
  ) as request_id;
  $$
);