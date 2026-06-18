This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Configuración de Supabase

1. Ejecuta en orden las migraciones `202606180001_atomic_inventory_operations.sql`, `202606180002_google_access_hardening.sql` y `202606180003_sellers_and_colors.sql` en el SQL Editor de Supabase.

Si la venta muestra que `registrar_venta_impl` no existe, ejecuta también `202606180005_standalone_sale_function.sql`. Esta versión reemplaza la función de venta por una implementación independiente.

Ejecuta después `202606180006_remove_price_columns.sql` para eliminar `total`, `metodo_pago`, `precio_unitario` y `subtotal`. La aplicación controla cantidades y stock, no precios.
2. Activa Google en Authentication > Providers y configura las credenciales OAuth de Google.
3. En Google Cloud usa `https://TU_PROYECTO.supabase.co/auth/v1/callback` como URI autorizada del cliente OAuth.
4. En Supabase añade `http://localhost:3000/auth/callback`, la URL LAN usada por el celular y la URL equivalente de producción a las URL de redirección permitidas.
5. Define `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `NEXT_PUBLIC_SITE_URL` en `.env.local`.
6. Registra cada Gmail permitido en la tabla protegida `usuarios_autorizados` desde el SQL Editor:

```sql
insert into public.usuarios_autorizados (email)
values ('persona@gmail.com')
on conflict (email) do update set activo = true;
```

7. En Authentication > Hooks activa **Before User Created** y selecciona `public.hook_restringir_registro_google`. Esto evita que correos no autorizados lleguen a crear una cuenta de Auth.

Para probar desde un celular en la misma red, abre la IP LAN del computador, por ejemplo `http://192.168.1.20:3000`, y registra `http://192.168.1.20:3000/auth/callback` en Supabase. En producción, `NEXT_PUBLIC_SITE_URL` debe ser la URL HTTPS pública; `ALLOWED_SITE_ORIGINS` puede contener orígenes adicionales separados por comas.

La migración protege lecturas y operaciones de venta, compra, traslado y creación de productos para los correos autorizados, y ejecuta las mutaciones dentro de transacciones de PostgreSQL.

## Vendedores de la familia

Después de ejecutar `202606180003_sellers_and_colors.sql`, asocia cada Gmail con su vendedor:

```sql
update public.usuarios_autorizados u
set vendedor_id = v.id
from public.vendedores v
where u.email = 'correo-del-papa@gmail.com' and v.nombre = 'Papá';
```

Repite la operación para `Mamá` y `Hermano`. La venta usará automáticamente el vendedor asociado al Gmail que inició sesión.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
