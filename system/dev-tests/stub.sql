do $$ begin
  if not exists (select from pg_roles where rolname='anon') then create role anon nologin; end if;
  if not exists (select from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
end $$;
create schema auth;
create table auth.users (id uuid primary key, email text unique, encrypted_password text, updated_at timestamptz);
create function auth.uid() returns uuid language sql stable as $$ select nullif(nullif(current_setting('request.jwt.claims', true),'')::json->>'sub','')::uuid $$;
grant usage on schema auth to anon, authenticated;
