# Custom Sieve — Uso desde el Frontend

Sistema de paginación, filtrado y ordenamiento para la API. Inspirado en [.NET Sieve](https://github.com/biarity/Sieve).

## Query Parameters

| Param Tipo | Ejemplo | Descripción |
|---|---|---|
| `page` | `?page=2` | Número de página (default: `1`) |
| `pageSize` | `?pageSize=10` | Items por página (default: `20`, max: `100`) |
| `filters` | `?filters=name==John,price>100` | Filtros en formato shorthand |
| `sorts` | `?sorts=createdAt:desc` | Ordenamiento |

## Filtros — Formato Shorthand

Cada filtro sigue el patrón `campo<operador>valor`. Se separan por coma para aplicar múltiples.

### Operadores disponibles

| Operador | Significado | Ejemplo |
|---|---|---|
| `==` | Igual | `name==John` |
| `!=` | No igual | `status!=archived` |
| `>` | Mayor que | `price>100` |
| `<` | Menor que | `price<50` |
| `>=` | Mayor o igual | `stock>=10` |
| `<=` | Menor o igual | `stock<=5` |
| `@=` | Contiene (insensible a mayúsculas) | `name@=shirt` |
| `_=` | Comienza con (insensible a mayúsculas) | `name_=Red` |

### Ejemplos

```
# Un filtro
GET /users?filters=username==bookworm

# Múltiples filtros (AND)
GET /users?filters=username==bookworm,email@=example

# Filtros con operadores de comparación
GET /products?filters=price>=10,price<=100

# Búsqueda parcial
GET /products?filters=name@=phone

# Combinando con paginación y orden
GET /users?page=1&pageSize=5&filters=email@=example&sorts=createdAt:desc
```

## Ordenamiento

Formato: `campo:direccion`. Dirección debe ser `asc` o `desc`. Separados por coma para múltiples.

```
# Ordenar por nombre ascendente
GET /users?sorts=username:asc

# Ordenar por fecha descendente, luego nombre ascendente
GET /users?sorts=createdAt:desc,username:asc
```

## Respuesta

Todas las listas devuelven un envelope consistente:

```json
{
  "data": [...],
  "meta": {
    "total": 42,
    "page": 1,
    "pageSize": 20,
    "totalPages": 3,
    "lastPage": 3
  }
}
```

## Probar en Scalar/Swagger

1. Abrir la documentación de la API (`/docs` o la ruta configurada en `app.config.ts`)
2. Buscar el endpoint `GET /users`
3. Click en "Try it"
4. Completar los query params:
   - `page`: `1`
   - `pageSize`: `10`
   - `filters`: `username@=book`
   - `sorts`: `createdAt:desc`
5. Click en "Execute"

Los parámetros son opcionales. Si no se envían, se usan los defaults (page=1, pageSize=20, sin filtros ni orden).

## Notas

- Los campos filtrables/sorteables están definidos por modelo en un archivo de configuración whitelist (`user.sieve.ts`). Solo los campos declarados como `canFilter: true` o `canSort: true` son aceptados.
- Los valores numéricos se parsean automáticamente. `price>100` envía `100` como número, no como string.
- Los filtros de texto (`@=`, `_=`) son case-insensitive por defecto.
