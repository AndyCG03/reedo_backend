export interface PrismaFieldConfig {
  canFilter?: boolean;
  canSort?: boolean;
  /** Ruta dentro del objeto Prisma, ej. ['category', 'name'] */
  path?: string[];
}

export type PrismaSieveConfig<T> = {
  [K in keyof T]?: PrismaFieldConfig;
} & { [key: string]: PrismaFieldConfig };
