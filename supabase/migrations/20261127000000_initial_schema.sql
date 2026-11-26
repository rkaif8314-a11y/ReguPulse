create extension if not exists pgcrypto;

create table if not exists public.guest_workspaces (
  id uuid primary key default gen_random_uuid(),
  workspace_hash text not null unique,
  credits_remaining integer not null default 50 check (credits_remaining >= 0),
  is_founder boolean not null default false,
  subscription_plan text not null default 'free' check (subscription_plan in ('free', 'starter', 'growth', 'agency')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.audit_scans (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.guest_workspaces(id) on delete cascade,
  target_url text not null,
  score smallint not null check (score between 0 and 100),
  findings jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_scans_workspace_created_idx on public.audit_scans (workspace_id, created_at desc);

alter table public.guest_workspaces enable row level security;
alter table public.audit_scans enable row level security;
revoke all on table public.guest_workspaces from anon, authenticated;
revoke all on table public.audit_scans from anon, authenticated;
grant all on table public.guest_workspaces to service_role;
grant all on table public.audit_scans to service_role;

create or replace function public.get_or_create_guest_workspace(p_workspace_hash text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare item public.guest_workspaces%rowtype; workspace_count integer;
begin
  if p_workspace_hash is null or length(p_workspace_hash) <> 64 then raise exception 'Invalid workspace key'; end if;
  perform pg_advisory_xact_lock(hashtext('regupulse-founder-workspace'));
  select * into item from public.guest_workspaces where workspace_hash = p_workspace_hash;
  if found then
    return jsonb_build_object('id',item.id,'credits_remaining',item.credits_remaining,'is_founder',item.is_founder,'subscription_plan',item.subscription_plan);
  end if;
  select count(*) into workspace_count from public.guest_workspaces;
  insert into public.guest_workspaces (workspace_hash,credits_remaining,is_founder)
  values (p_workspace_hash,case when workspace_count = 0 then 100 else 50 end,workspace_count = 0)
  returning * into item;
  return jsonb_build_object('id',item.id,'credits_remaining',item.credits_remaining,'is_founder',item.is_founder,'subscription_plan',item.subscription_plan);
end;
$$;

create or replace function public.consume_guest_credit(p_workspace_hash text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare item public.guest_workspaces%rowtype;
begin
  update public.guest_workspaces set credits_remaining=credits_remaining-1,updated_at=now()
  where workspace_hash=p_workspace_hash and credits_remaining>0 returning * into item;
  if not found then return jsonb_build_object('ok',false,'credits_remaining',0); end if;
  return jsonb_build_object('ok',true,'credits_remaining',item.credits_remaining);
end;
$$;

create or replace function public.refund_guest_credit(p_workspace_hash text)
returns void language sql security definer set search_path = public, pg_temp as $$
  update public.guest_workspaces set credits_remaining=credits_remaining+1,updated_at=now() where workspace_hash=p_workspace_hash;
$$;

create or replace function public.activate_guest_plan(p_workspace_hash text,p_plan text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare allowance integer;
begin
  allowance := case p_plan when 'starter' then 150 when 'growth' then 600 when 'agency' then 2500 else null end;
  if allowance is null then raise exception 'Invalid plan'; end if;
  update public.guest_workspaces set subscription_plan=p_plan,credits_remaining=allowance,updated_at=now() where workspace_hash=p_workspace_hash;
end;
$$;

create or replace function public.deactivate_guest_plan(p_workspace_hash text)
returns void language sql security definer set search_path = public, pg_temp as $$
  update public.guest_workspaces set subscription_plan='free',credits_remaining=least(credits_remaining,50),updated_at=now() where workspace_hash=p_workspace_hash;
$$;

revoke all on function public.get_or_create_guest_workspace(text) from public, anon, authenticated;
revoke all on function public.consume_guest_credit(text) from public, anon, authenticated;
revoke all on function public.refund_guest_credit(text) from public, anon, authenticated;
revoke all on function public.activate_guest_plan(text,text) from public, anon, authenticated;
revoke all on function public.deactivate_guest_plan(text) from public, anon, authenticated;
grant execute on function public.get_or_create_guest_workspace(text) to service_role;
grant execute on function public.consume_guest_credit(text) to service_role;
grant execute on function public.refund_guest_credit(text) to service_role;
grant execute on function public.activate_guest_plan(text,text) to service_role;
grant execute on function public.deactivate_guest_plan(text) to service_role;