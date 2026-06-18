export type Sede = { id: string; nombre: string };
export type Vendedor = { id: string; nombre: string };
export type ProductoBase = {
  id: string;
  modelo: string;
  talla: string;
  color: string;
  activo: boolean;
};
export type InventarioRelacion = {
  cantidad: number;
  stock_minimo?: number;
  sedes: { nombre: string } | null;
};
export type ProductoConInventario = ProductoBase & {
  inventario: InventarioRelacion[] | null;
};
export type InventarioConProducto = {
  id: string;
  cantidad: number;
  stock_minimo: number;
  sedes: Sede | null;
  productos: ProductoBase;
};
export type Compra = {
  id: string;
  cantidad: number;
  observacion: string | null;
  created_at: string;
  productos: Pick<ProductoBase, "modelo" | "talla" | "color"> | null;
};
export type DetalleVenta = {
  cantidad: number;
  productos: Pick<ProductoBase, "modelo" | "talla" | "color"> | null;
};
export type VentaReporte = {
  id: string;
  vendedor: string | null;
  created_at: string;
  detalle_ventas: DetalleVenta[] | null;
};
