create or replace function public.reserve_commission_ai_generation(
  p_month date, p_ip_hash text, p_cost_cents integer default 8, p_limit_cents integer default 500
)
returns jsonb language plpgsql set search_path to 'public'
as $function$
declare
  v_count integer;
  v_spent integer;
  v_window_started_at timestamptz;
  v_retry_after integer;
begin
  insert into public.commission_ai_ip_limits(ip_hash, window_started_at, request_count)
  values (p_ip_hash, now(), 0) on conflict (ip_hash) do nothing;
  select request_count, window_started_at into v_count, v_window_started_at
  from public.commission_ai_ip_limits where ip_hash = p_ip_hash for update;
  if now() - v_window_started_at >= interval '1 hour' then
    update public.commission_ai_ip_limits set window_started_at = now(), request_count = 0 where ip_hash = p_ip_hash;
    v_count := 0;
    v_window_started_at := now();
  end if;
  if v_count >= 3 then
    v_retry_after := greatest(1, ceil(extract(epoch from (v_window_started_at + interval '1 hour' - now())))::integer);
    return jsonb_build_object('ok', false, 'reason', 'rate_limit', 'retry_after_seconds', v_retry_after);
  end if;
  update public.commission_ai_ip_limits set request_count = request_count + 1 where ip_hash = p_ip_hash;
  insert into public.commission_ai_monthly_usage(month_start, reserved_cents) values (p_month, 0) on conflict (month_start) do nothing;
  select reserved_cents into v_spent from public.commission_ai_monthly_usage where month_start = p_month for update;
  if v_spent + p_cost_cents > p_limit_cents then return jsonb_build_object('ok', false, 'reason', 'monthly_budget'); end if;
  update public.commission_ai_monthly_usage set reserved_cents = reserved_cents + p_cost_cents where month_start = p_month;
  return jsonb_build_object('ok', true, 'reserved_cents', v_spent + p_cost_cents);
end;
$function$;
