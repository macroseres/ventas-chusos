do $$
begin
  if exists (
    select 1 from public.inventario
    group by sede_id, producto_id
    having count(*) > 1
  ) then
    raise exception 'Hay filas duplicadas en inventario para una misma sede y producto';
  end if;
end;
$$;

create unique index if not exists inventario_sede_producto_uidx
on public.inventario (sede_id, producto_id);

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
    select 1
    from public.usuarios_autorizados
    where email = lower(auth.jwt() ->> 'email') and activo = true
  );
$$;

revoke all on function public.es_usuario_autorizado() from public, anon;
grant execute on function public.es_usuario_autorizado() to authenticated;

do $$
declare
  v_table text;
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
  v_stock inventario%rowtype;
  v_venta_id uuid;
  v_vendedor text;
begin
  if not public.es_usuario_autorizado() then raise exception 'No autorizado'; end if;
  if p_cantidad <= 0 then raise exception 'La cantidad debe ser positiva'; end if;

  select * into v_stock from inventario
  where sede_id = p_sede_id and producto_id = p_producto_id
  for update;
  if not found then raise exception 'No existe stock para este producto en la sede'; end if;
  if v_stock.cantidad < p_cantidad then raise exception 'Stock insuficiente'; end if;

  if p_vendedor_id is not null then
    select nombre into v_vendedor from vendedores where id = p_vendedor_id and activo = true;
    if not found then raise exception 'Vendedor inválido'; end if;
  end if;

  insert into ventas (sede_id, total, metodo_pago, vendedor)
  values (p_sede_id, 0, 'sin_precio', v_vendedor)
  returning id into v_venta_id;
  insert into detalle_ventas (venta_id, producto_id, cantidad, precio_unitario)
  values (v_venta_id, p_producto_id, p_cantidad, 0);
  update inventario set cantidad = cantidad - p_cantidad where id = v_stock.id;
  insert into movimientos_stock (producto_id, sede_origen_id, sede_destino_id, tipo, cantidad, observacion)
  values (p_producto_id, p_sede_id, null, 'venta', p_cantidad,
    'Venta registrada' || case when v_vendedor is null then '' else ' por ' || v_vendedor end);
  return v_venta_id;
end;
$$;

create or replace function public.trasladar_stock(p_producto_id uuid, p_cantidad integer)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_origen uuid;
  v_destino uuid;
  v_stock inventario%rowtype;
begin
  if not public.es_usuario_autorizado() then raise exception 'No autorizado'; end if;
  if p_cantidad <= 0 then raise exception 'La cantidad debe ser positiva'; end if;
  select id into strict v_origen from sedes where nombre = 'Almacén Central' and activa = true;
  select id into strict v_destino from sedes where nombre = 'Tienda Mercado' and activa = true;
  select * into v_stock from inventario where sede_id = v_origen and producto_id = p_producto_id for update;
  if not found or v_stock.cantidad < p_cantidad then raise exception 'Stock insuficiente en casa/almacén'; end if;
  update inventario set cantidad = cantidad - p_cantidad where id = v_stock.id;
  insert into inventario (sede_id, producto_id, cantidad, stock_minimo)
  values (v_destino, p_producto_id, p_cantidad, 0)
  on conflict (sede_id, producto_id) do update set cantidad = inventario.cantidad + excluded.cantidad;
  insert into movimientos_stock (producto_id, sede_origen_id, sede_destino_id, tipo, cantidad, observacion)
  values (p_producto_id, v_origen, v_destino, 'traslado', p_cantidad, 'Casa/Almacén a Mercado');
end;
$$;

create or replace function public.registrar_compra(p_producto_id uuid, p_cantidad integer, p_observacion text)
returns void language plpgsql security definer set search_path = public as $$
declare v_almacen uuid;
begin
  if not public.es_usuario_autorizado() then raise exception 'No autorizado'; end if;
  if p_cantidad <= 0 then raise exception 'La cantidad debe ser positiva'; end if;
  select id into strict v_almacen from sedes where nombre = 'Almacén Central' and activa = true;
  insert into inventario (sede_id, producto_id, cantidad, stock_minimo)
  values (v_almacen, p_producto_id, p_cantidad, 2)
  on conflict (sede_id, producto_id) do update set cantidad = inventario.cantidad + excluded.cantidad;
  insert into compras (producto_id, cantidad, observacion) values (p_producto_id, p_cantidad, p_observacion);
  insert into movimientos_stock (producto_id, sede_origen_id, sede_destino_id, tipo, cantidad, observacion)
  values (p_producto_id, null, v_almacen, 'compra', p_cantidad,
    coalesce(nullif(trim(p_observacion), ''), 'Ingreso de mercadería al Almacén Central'));
end;
$$;

create or replace function public.crear_producto_con_stock(
  p_modelo text, p_talla text, p_color text, p_stock integer, p_stock_minimo integer
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_producto uuid; v_almacen uuid;
begin
  if not public.es_usuario_autorizado() then raise exception 'No autorizado'; end if;
  if trim(p_modelo) = '' or trim(p_talla) = '' then raise exception 'Modelo y talla son obligatorios'; end if;
  if p_stock < 0 or p_stock_minimo < 0 then raise exception 'El stock no puede ser negativo'; end if;
  select id into strict v_almacen from sedes where nombre = 'Almacén Central' and activa = true;
  insert into productos (modelo, talla, color, activo)
  values (trim(p_modelo), trim(p_talla), coalesce(nullif(trim(p_color), ''), 'Sin color'), true)
  returning id into v_producto;
  insert into inventario (sede_id, producto_id, cantidad, stock_minimo)
  values (v_almacen, v_producto, p_stock, p_stock_minimo);
  return v_producto;
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
