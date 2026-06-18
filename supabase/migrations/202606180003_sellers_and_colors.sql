alter table public.usuarios_autorizados
add column if not exists vendedor_id uuid references public.vendedores(id);

insert into public.vendedores (nombre, activo)
select nombre, true
from (values ('Papá'), ('Mamá'), ('Hermano')) as familia(nombre)
where not exists (
  select 1 from public.vendedores
  where lower(vendedores.nombre) = lower(familia.nombre)
);

create table if not exists public.colores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  hex text not null check (hex ~ '^#[0-9A-Fa-f]{6}$'),
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists colores_nombre_uidx on public.colores (lower(nombre));

insert into public.colores (nombre, hex)
values
  ('Negro', '#111111'), ('Blanco', '#FFFFFF'), ('Marrón', '#7C4A2D'),
  ('Beige', '#D8C3A5'), ('Azul', '#2563EB'), ('Rojo', '#DC2626'),
  ('Rosado', '#EC4899'), ('Gris', '#6B7280')
on conflict do nothing;

alter table public.colores enable row level security;
drop policy if exists authorized_read on public.colores;
drop policy if exists authorized_read_guard on public.colores;
create policy authorized_read on public.colores
for select to authenticated using (public.es_usuario_autorizado());
create policy authorized_read_guard on public.colores as restrictive
for select to authenticated using (public.es_usuario_autorizado());
revoke all on table public.colores from anon;
revoke insert, update, delete, truncate, references, trigger on table public.colores from authenticated;
grant select on table public.colores to authenticated;

create or replace function public.crear_color(p_nombre text, p_hex text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if not public.es_usuario_autorizado() then raise exception 'No autorizado'; end if;
  if trim(p_nombre) = '' then raise exception 'El nombre del color es obligatorio'; end if;
  if p_hex !~ '^#[0-9A-Fa-f]{6}$' then raise exception 'Color hexadecimal inválido'; end if;

  insert into public.colores (nombre, hex)
  values (trim(p_nombre), upper(p_hex))
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.crear_color(text, text) from public, anon;
grant execute on function public.crear_color(text, text) to authenticated;

create or replace function public.vendedor_actual()
returns text language sql stable security definer set search_path = public as $$
  select v.nombre
  from public.usuarios_autorizados u
  join public.vendedores v on v.id = u.vendedor_id and v.activo = true
  where u.email = lower(auth.jwt() ->> 'email') and u.activo = true;
$$;

revoke all on function public.vendedor_actual() from public, anon;
grant execute on function public.vendedor_actual() to authenticated;

create or replace function public.registrar_venta(
  p_producto_id uuid,
  p_sede_id uuid,
  p_vendedor_id uuid,
  p_cantidad integer
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_vendedor_id uuid;
begin
  if not public.es_usuario_autorizado() then raise exception 'No autorizado'; end if;

  select vendedor_id into v_vendedor_id
  from public.usuarios_autorizados
  where email = lower(auth.jwt() ->> 'email') and activo = true;

  if v_vendedor_id is null then
    raise exception 'El Gmail autorizado no está asociado a un vendedor';
  end if;

  return public.registrar_venta_impl(p_producto_id, p_sede_id, v_vendedor_id, p_cantidad);
end;
$$;

create or replace function public.crear_producto_con_stock(
  p_modelo text, p_talla text, p_color text, p_stock integer, p_stock_minimo integer
) returns uuid language plpgsql security definer set search_path = public as $$
begin
  if not public.es_usuario_autorizado() then raise exception 'No autorizado'; end if;
  if not exists (
    select 1 from public.colores
    where lower(nombre) = lower(trim(p_color)) and activo = true
  ) then
    raise exception 'Selecciona un color activo del catálogo';
  end if;

  return public.crear_producto_con_stock_impl(p_modelo, p_talla, p_color, p_stock, p_stock_minimo);
end;
$$;

revoke all on function public.registrar_venta(uuid, uuid, uuid, integer) from public, anon;
revoke all on function public.crear_producto_con_stock(text, text, text, integer, integer) from public, anon;
grant execute on function public.registrar_venta(uuid, uuid, uuid, integer) to authenticated;
grant execute on function public.crear_producto_con_stock(text, text, text, integer, integer) to authenticated;
