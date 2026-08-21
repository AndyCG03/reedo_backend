# Custom Sieve — Implementación Interna

## Arquitectura

```
src/common/sieve/
├── sieve-options.ts        # Interfaces de entrada/salida
├── prisma-sieve.config.ts  # Tipos para la whitelist por modelo
├── prisma-sieve.ts         # Builder: opciones Sieve → objetos Prisma
├── sieve.decorator.ts      # Decorador NestJS + parser de query params
└── index.ts                # Barrel export
```

## Flujo de datos

```
HTTP Query Params
       │
       ▼
@Sieve() decorator  ──→  SieveOptions { filters, sorts, page, pageSize }
       │
       ▼
PrismaSieve.build(options, config)  ──→  { where, orderBy, skip, take }
       │
       ▼
prisma.user.findMany({ where, orderBy, skip, take })
prisma.user.count({ where })
       │
       ▼
PaginatedResult<T> { data, meta }
```

## 1. SieveOptions — Modelo de entrada

```typescript
// sieve-options.ts
interface SieveOptions {
  filters?: FilterTerm[];  // [{ field: 'name', operator: '==', value: 'John' }]
  sorts?: SortTerm[];      // [{ field: 'createdAt', order: 'desc' }]
  page: number;
  pageSize: number;
}
```

El decorator `@Sieve()` parsea los query params HTTP en esta estructura usando `parseSieveQuery()`.

### Parsing de filtros

El regex `^(.+?)(==|!=|>=|<=|>|<|@=|_=)(.+)$` separa cada filtro en campo, operador y valor:

```
"name@=shirt"  →  field: "name", operator: "@=", value: "shirt"
"price>100"    →  field: "price", operator: ">", value: "100"
```

Filtros inválidos (sin operador soportado) se descartan silenciosamente.

### Parsing de sorts

```
"createdAt:desc"  →  { field: "createdAt", order: "desc" }
```

Solo acepta `asc` o `desc`. Cualquier otro valor se descarta.

## 2. PrismaSieveConfig — Whitelist por modelo

Cada modelo define qué campos aceptan filtro y sort:

```typescript
// user.sieve.ts
const UserSieveConfig: PrismaSieveConfig<Prisma.UserWhereInput> = {
  username:  { canFilter: true, canSort: true },
  email:     { canFilter: true, canSort: true },
  bio:       { canFilter: true, canSort: false },  // filtra pero no ordena
  createdAt: { canFilter: true, canSort: true },
  updatedAt: { canFilter: true, canSort: true },
};
```

### Campos anidados (relaciones)

Para filtrar por un campo de una relación, se usa `path`:

```typescript
'category.name': {
  canFilter: true,
  canSort: true,
  path: ['category', 'name'],  // ruta en el objeto Prisma
}
```

`PrismaSieve` convierte esto automáticamente en `{ category: { name: { contains: '...' } } }`.

## 3. PrismaSieve.build() — El Builder

El builder es una clase estática que transforma `SieveOptions` + `PrismaSieveConfig` en los objetos que consume Prisma.

### Proceso de filtros

```
Para cada filter term:
  1. Buscar el campo en la config (whitelist check)
  2. Si no existe o canFilter=false → skip
  3. Obtener la path (default: [fieldName])
  4. Construir la condición según el operador
  5. Envolver en objeto anidado según la path
  6. Push al array AND del where
```

Ejemplo con `category.name@=shirt`:

```
field: 'category.name'
config.path: ['category', 'name']
operator: '@='
value: 'shirt'

condition = { contains: 'shirt', mode: 'insensitive' }
nested = createNestedObject(['category', 'name'], condition)
       = { category: { name: { contains: 'shirt', mode: 'insensitive' } } }

where.AND.push(nested)
```

### Proceso de sorts

```
Para cada sort term:
  1. Buscar el campo en la config (whitelist check)
  2. Si no existe o canSort=false → skip
  3. Obtener la path
  4. Crear objeto con la dirección
  5. Push al array orderBy
```

### Paginación

```typescript
skip = (page - 1) * pageSize
take = pageSize
```

### Resultado

```typescript
{
  where: where.AND.length > 0 ? where : {},  // {} si no hay filtros
  orderBy,
  skip,
  take,
}
```

## 4. Conversión de valores

`PrismaSieve.parseValue()` convierte los strings de los query params:

| Input | Output | Tipo |
|---|---|---|
| `"100"` | `100` | number |
| `"true"` | `true` | boolean |
| `"false"` | `false` | boolean |
| `"hello"` | `"hello"` | string |

Para `@=` y `_=`, el valor original (string) se pasa directamente a Prisma para que el engine maneje el case-insensitivity.

## 5. Integración con NestJS (CQRS)

```
Endpoint (@Sieve decorator)
    ↓
QueryBus.execute(ListUsersQuery)
    ↓
Handler → repository.findMany(sieve)
    ↓
Repository → PrismaSieve.build(sieve, config)
           → prisma.$transaction([findMany, count])
           → PaginatedResult<User>
```

El handler y el repository reciben `SieveOptions`, no query params HTTP. Esto mantiene la separación de capas.

## 6. Seguridad

- **Whitelist**: Solo campos declarados en la config son procesados. Campos no existentes se ignoran.
- **Operadores soportados**: Solo los 8 operadores listados. Cualquier otro se descarta.
- **No hay SQL raw**: Todo pasa por el query engine de Prisma (Rust), que parametriza automáticamente.
- **Límite de pageSize**: Cap en 100 items por página, forzado en el decorator.

## 7. Tests

```
tests/common/sieve/
├── prisma-sieve.test.ts       # 25 tests del builder
└── sieve.decorator.test.ts    # 12 tests del parser
```

Cobertura:
- Todos los operadores (==, !=, >, <, >=, <=, @=, _=)
- Whitelist (campos filtrables/sorteables no filtrados)
- Paths anidados (relaciones)
- Parsing de paginación (defaults, límites, valores inválidos)
- Parsing de filtros y sorts (formato shorthand, múltiples, inválidos)
