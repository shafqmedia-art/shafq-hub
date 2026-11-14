-- شفق ميديا · تشغيل الإشعارات كل ساعة
-- شغّله لوحده بعد ما تفعّل pg_cron و pg_net وتنشر دالة push.
select cron.unschedule('shafq-push') where exists (select 1 from cron.job where jobname = 'shafq-push');
select cron.schedule('shafq-push', '2 * * * *', $$
  select net.http_post(
    url := 'https://rwadscqezwbzjawuopye.supabase.co/functions/v1/push',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"action": "cron"}'::jsonb
  );
$$);
