-- شفق ميديا · تحديث ٦: تقوية الأمان
-- شغّل هذا الملف لوحده في استعلام جديد (New query). آمن إذا انشغّل أكثر من مرة.

-- ١) قيود على القيم: ما في مبالغ سالبة أو عملات غريبة أو نصوص ضخمة (حتى لو حدا تجاوز التطبيق)
--    NOT VALID = بتنطبق على كل شي جديد بدون ما توقف بسبب بيانات قديمة.
do $$ begin
  alter table public.moves add constraint moves_amount_ok check (amount >= 0 and amount < 1e12 and usd >= 0 and usd < 1e10) not valid;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.moves add constraint moves_kind_ok check (dir in ('in','out') and cur in ('USD','SYP') and (rate is null or rate > 0)) not valid;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.moves add constraint moves_text_ok check (length(coalesce(note,'')) <= 1000 and length(coalesce(cat,'')) <= 100 and length(coalesce(service,'')) <= 100 and length(coalesce(receipt,'')) <= 40) not valid;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.clients add constraint clients_ok check (value >= 0 and value < 1e9 and months >= 0 and months <= 120 and length(name) <= 200 and length(coalesce(notes,'')) <= 4000) not valid;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.profiles add constraint profiles_ok check (
    length(name) <= 120 and length(coalesce(title,'')) <= 80 and length(coalesce(bio,'')) <= 2000
    and length(coalesce(photo,'')) <= 300000 and length(coalesce(email,'')) <= 200 and length(coalesce(insta,'')) <= 200
    and length(coalesce(city,'')) <= 100 and length(coalesce(phone,'')) <= 30 and coalesce(contract,0) >= 0
    and coalesce(gender,'m') in ('m','f')) not valid;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.tasks add constraint tasks_ok check (length(title) <= 500) not valid;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.items add constraint items_size_ok check (pg_column_size(data) <= 50000 and length(kind) <= 40) not valid;
exception when duplicate_object then null; end $$;

-- ٢) أجهزة الإشعارات: بس عناوين خدمات الإشعارات الرسمية (يمنع استغلال الدالة لزيارة روابط غريبة)
create or replace function public.save_push_sub(p_endpoint text, p_p256dh text, p_auth text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if p_endpoint !~ '^https://(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|push\.services\.mozilla\.com|web\.push\.apple\.com|[a-z0-9.-]+\.notify\.windows\.com)/'
     or length(p_endpoint) > 1000 or length(p_p256dh) > 200 or length(p_auth) > 100 then
    raise exception 'bad push endpoint';
  end if;
  insert into public.push_subs (endpoint, user_id, p256dh, auth) values (p_endpoint, auth.uid(), p_p256dh, p_auth)
  on conflict (endpoint) do update set user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth;
end;
$$;
revoke all on function public.save_push_sub(text, text, text) from public, anon;
grant execute on function public.save_push_sub(text, text, text) to authenticated;

-- ٣) إنشاء المدير الأول: قفل يمنع إنشاء مديرين بنفس اللحظة
create or replace function public.bootstrap_manager(p_name text, p_phone text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  perform pg_advisory_xact_lock(424242);
  if exists (select 1 from public.profiles where role = 'manager') then raise exception 'manager already exists'; end if;
  insert into public.profiles (id, name, phone, login_phone, role, title, active)
  values (auth.uid(), left(p_name, 120), left(p_phone, 30), regexp_replace(p_phone, '[^0-9]', '', 'g'), 'manager', 'المدير', true);
end;
$$;
revoke all on function public.bootstrap_manager(text, text) from public, anon;
grant execute on function public.bootstrap_manager(text, text) to authenticated;

-- ٤) سجل النشاط: مين غيّر شو ومتى (المدير بس بيقرأه، وما حدا بيقدر يعدّله أو يمسحه من التطبيق)
create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor uuid,
  actor_name text,
  tbl text not null,
  op text not null,
  row_id text,
  summary text
);
alter table public.audit_log enable row level security;
drop policy if exists mgr_audit_read on public.audit_log;
create policy mgr_audit_read on public.audit_log for select to authenticated using (public.is_manager());
revoke insert, update, delete on public.audit_log from authenticated, anon;
grant select on public.audit_log to authenticated;

create or replace function public.audit_row() returns trigger
language plpgsql security definer set search_path = public as $$
declare r jsonb; s text; who text;
begin
  r := to_jsonb(coalesce(new, old));
  if tg_table_name = 'settings' and r->>'key' in ('push_state', 'forgot_rl') then return null; end if;
  select name into who from public.profiles where id = auth.uid();
  s := case tg_table_name
    when 'moves' then coalesce(r->>'dir','') || ' ' || coalesce(r->>'amount','') || ' ' || coalesce(r->>'cur','') || coalesce(' · ' || nullif(r->>'cat',''), '') || case when (r->>'is_void')::boolean then ' · ملغاة' else '' end
    when 'profiles' then coalesce(r->>'name','') || ' · ' || coalesce(r->>'role','') || case when (r->>'active')::boolean is false then ' · موقوف' else '' end
    when 'clients' then coalesce(r->>'name','')
    when 'settings' then coalesce(r->>'key','')
    else coalesce(r->>'kind','') || ' ' || coalesce(r->'data'->>'name', r->>'name', '') end;
  insert into public.audit_log (actor, actor_name, tbl, op, row_id, summary)
  values (auth.uid(), who, tg_table_name, lower(tg_op), coalesce(r->>'id', r->>'key'), left(s, 300));
  delete from public.audit_log where at < now() - interval '180 days';
  return null;
end;
$$;
do $$ declare t text; begin
  foreach t in array array['moves','profiles','clients','settings','items'] loop
    execute format('drop trigger if exists audit_%1$s on public.%1$s', t);
    execute format('create trigger audit_%1$s after insert or update or delete on public.%1$s for each row execute function public.audit_row()', t);
  end loop;
end $$;
revoke all on function public.audit_row() from public, anon, authenticated;

-- ٥) احتياط: ولا أي دالة جديدة مفتوحة للزوار بدون تسجيل دخول
revoke execute on all functions in schema public from anon;
grant execute on function public.has_manager() to anon, authenticated;
