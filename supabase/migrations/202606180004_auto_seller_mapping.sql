create or replace function public.vendedor_actual()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(auth.jwt() ->> 'email');
  v_nombre text;
  v_vendedor_id uuid;
begin
  if not public.es_usuario_autorizado() then raise exception 'No autorizado'; end if;

  select v.id, v.nombre into v_vendedor_id, v_nombre
  from public.usuarios_autorizados u
  join public.vendedores v on v.id = u.vendedor_id and v.activo = true
  where u.email = v_email and u.activo = true;

  if v_vendedor_id is not null then return v_nombre; end if;

  v_nombre := coalesce(
    nullif(auth.jwt() -> 'user_metadata' ->> 'full_name', ''),
    nullif(auth.jwt() -> 'user_metadata' ->> 'name', ''),
    split_part(v_email, '@', 1)
  );

  select id into v_vendedor_id
  from public.vendedores
  where lower(nombre) = lower(v_nombre)
  limit 1;

  if v_vendedor_id is null then
    insert into public.vendedores (nombre, activo)
    values (v_nombre, true)
    returning id into v_vendedor_id;
  end if;

  update public.usuarios_autorizados
  set vendedor_id = v_vendedor_id
  where email = v_email and activo = true;

  return v_nombre;
end;
$$;

create or replace function public.registrar_venta(
  p_producto_id uuid,
  p_sede_id uuid,
  p_vendedor_id uuid,
  p_cantidad integer
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_vendedor_id uuid;
begin
  if not public.es_usuario_autorizado() then raise exception 'No autorizado'; end if;
  perform public.vendedor_actual();

  select vendedor_id into v_vendedor_id
  from public.usuarios_autorizados
  where email = lower(auth.jwt() ->> 'email') and activo = true;

  if v_vendedor_id is null then raise exception 'No se pudo asociar el vendedor'; end if;
  return public.registrar_venta_impl(p_producto_id, p_sede_id, v_vendedor_id, p_cantidad);
end;
$$;

revoke all on function public.vendedor_actual() from public, anon;
revoke all on function public.registrar_venta(uuid, uuid, uuid, integer) from public, anon;
grant execute on function public.vendedor_actual() to authenticated;
grant execute on function public.registrar_venta(uuid, uuid, uuid, integer) to authenticated;
