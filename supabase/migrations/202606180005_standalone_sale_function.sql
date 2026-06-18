create or replace function public.registrar_venta(
  p_producto_id uuid,
  p_sede_id uuid,
  p_vendedor_id uuid,
  p_cantidad integer
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(auth.jwt() ->> 'email');
  v_nombre text;
  v_vendedor_id uuid;
  v_stock public.inventario%rowtype;
  v_venta_id uuid;
begin
  if not public.es_usuario_autorizado() then raise exception 'No autorizado'; end if;
  if p_cantidad is null or p_cantidad <= 0 then raise exception 'La cantidad debe ser positiva'; end if;

  select u.vendedor_id, v.nombre
  into v_vendedor_id, v_nombre
  from public.usuarios_autorizados u
  left join public.vendedores v on v.id = u.vendedor_id and v.activo = true
  where u.email = v_email and u.activo = true;

  if v_vendedor_id is null or v_nombre is null then
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
  end if;

  select * into v_stock
  from public.inventario
  where sede_id = p_sede_id and producto_id = p_producto_id
  for update;

  if not found then raise exception 'No existe stock para este producto en la sede'; end if;
  if v_stock.cantidad < p_cantidad then raise exception 'Stock insuficiente'; end if;

  insert into public.ventas (sede_id, total, metodo_pago, vendedor)
  values (p_sede_id, 0, 'sin_precio', v_nombre)
  returning id into v_venta_id;

  insert into public.detalle_ventas (venta_id, producto_id, cantidad, precio_unitario)
  values (v_venta_id, p_producto_id, p_cantidad, 0);

  update public.inventario
  set cantidad = cantidad - p_cantidad
  where id = v_stock.id;

  insert into public.movimientos_stock (
    producto_id, sede_origen_id, sede_destino_id, tipo, cantidad, observacion
  ) values (
    p_producto_id, p_sede_id, null, 'venta', p_cantidad, 'Venta registrada por ' || v_nombre
  );

  return v_venta_id;
end;
$$;

revoke all on function public.registrar_venta(uuid, uuid, uuid, integer) from public, anon;
grant execute on function public.registrar_venta(uuid, uuid, uuid, integer) to authenticated;
