create table if not exists public.usuarios_autorizados (
  email text primary key check (email = lower(trim(email))),
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.usuarios_autorizados enable row level security;
revoke all on table public.usuarios_autorizados from anon, authenticated;

create or replace function public.es_usuario_autorizado()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null and exists (
    select 1 from public.usuarios_autorizados
    where email = lower(auth.jwt() ->> 'email') and activo = true
  );
$$;

revoke all on function public.es_usuario_autorizado() from public, anon;
grant execute on function public.es_usuario_autorizado() to authenticated;

do $$
declare v_table text;
begin
  foreach v_table in array array[
    'inventario', 'movimientos_stock', 'ventas', 'vendedores',
    'detalle_ventas', 'sedes', 'productos', 'compras'
  ] loop
    execute format('alter table public.%I enable row level security', v_table);
    execute format('drop policy if exists authorized_read on public.%I', v_table);
    execute format('drop policy if exists authorized_read_guard on public.%I', v_table);
    execute format(
      'create policy authorized_read on public.%I for select to authenticated using (public.es_usuario_autorizado())',
      v_table
    );
    execute format(
      'create policy authorized_read_guard on public.%I as restrictive for select to authenticated using (public.es_usuario_autorizado())',
      v_table
    );
    execute format('revoke all on table public.%I from anon', v_table);
    execute format('revoke insert, update, delete, truncate, references, trigger on table public.%I from authenticated', v_table);
    execute format('grant select on table public.%I to authenticated', v_table);
  end loop;
end;
$$;

create or replace function public.hook_restringir_registro_google(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare v_email text := lower(event -> 'user' ->> 'email');
begin
  if exists (
    select 1 from public.usuarios_autorizados
    where email = v_email and activo = true
  ) then
    return '{}'::jsonb;
  end if;

  return jsonb_build_object(
    'error', jsonb_build_object(
      'http_code', 403,
      'message', 'Este correo no está autorizado.'
    )
  );
end;
$$;

revoke all on function public.hook_restringir_registro_google(jsonb) from public, anon, authenticated;
grant usage on schema public to supabase_auth_admin;
grant execute on function public.hook_restringir_registro_google(jsonb) to supabase_auth_admin;

do $$
begin
  if to_regprocedure('public.registrar_venta_impl(uuid,uuid,uuid,integer)') is null then
    alter function public.registrar_venta(uuid, uuid, uuid, integer) rename to registrar_venta_impl;
  end if;
  if to_regprocedure('public.trasladar_stock_impl(uuid,integer)') is null then
    alter function public.trasladar_stock(uuid, integer) rename to trasladar_stock_impl;
  end if;
  if to_regprocedure('public.registrar_compra_impl(uuid,integer,text)') is null then
    alter function public.registrar_compra(uuid, integer, text) rename to registrar_compra_impl;
  end if;
  if to_regprocedure('public.crear_producto_con_stock_impl(text,text,text,integer,integer)') is null then
    alter function public.crear_producto_con_stock(text, text, text, integer, integer) rename to crear_producto_con_stock_impl;
  end if;
end;
$$;

revoke all on function public.registrar_venta_impl(uuid, uuid, uuid, integer) from public, anon, authenticated;
revoke all on function public.trasladar_stock_impl(uuid, integer) from public, anon, authenticated;
revoke all on function public.registrar_compra_impl(uuid, integer, text) from public, anon, authenticated;
revoke all on function public.crear_producto_con_stock_impl(text, text, text, integer, integer) from public, anon, authenticated;

create or replace function public.registrar_venta(p_producto_id uuid, p_sede_id uuid, p_vendedor_id uuid, p_cantidad integer)
returns uuid language plpgsql security definer set search_path = public as $$
begin
  if not public.es_usuario_autorizado() then raise exception 'No autorizado'; end if;
  return public.registrar_venta_impl(p_producto_id, p_sede_id, p_vendedor_id, p_cantidad);
end;
$$;

create or replace function public.trasladar_stock(p_producto_id uuid, p_cantidad integer)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.es_usuario_autorizado() then raise exception 'No autorizado'; end if;
  perform public.trasladar_stock_impl(p_producto_id, p_cantidad);
end;
$$;

create or replace function public.registrar_compra(p_producto_id uuid, p_cantidad integer, p_observacion text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.es_usuario_autorizado() then raise exception 'No autorizado'; end if;
  perform public.registrar_compra_impl(p_producto_id, p_cantidad, p_observacion);
end;
$$;

create or replace function public.crear_producto_con_stock(
  p_modelo text, p_talla text, p_color text, p_stock integer, p_stock_minimo integer
) returns uuid language plpgsql security definer set search_path = public as $$
begin
  if not public.es_usuario_autorizado() then raise exception 'No autorizado'; end if;
  return public.crear_producto_con_stock_impl(p_modelo, p_talla, p_color, p_stock, p_stock_minimo);
end;
$$;

revoke all on function public.registrar_venta(uuid, uuid, uuid, integer) from public, anon;
revoke all on function public.trasladar_stock(uuid, integer) from public, anon;
revoke all on function public.registrar_compra(uuid, integer, text) from public, anon;
revoke all on function public.crear_producto_con_stock(text, text, text, integer, integer) from public, anon;
grant execute on function public.registrar_venta(uuid, uuid, uuid, integer) to authenticated;
grant execute on function public.trasladar_stock(uuid, integer) to authenticated;
grant execute on function public.registrar_compra(uuid, integer, text) to authenticated;
grant execute on function public.crear_producto_con_stock(text, text, text, integer, integer) to authenticated;
