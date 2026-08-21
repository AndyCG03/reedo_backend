import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SieveOptions, FilterTerm, SortTerm } from './sieve-options';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

const OPERATOR_PATTERN = /^(.+?)(==|!=|>=|<=|>|<|@=|_=)(.+)$/;

export function parseFilters(
  raw: string | undefined,
): FilterTerm[] | undefined {
  if (!raw) return undefined;

  const terms = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const filters: FilterTerm[] = [];

  for (const term of terms) {
    const match = term.match(OPERATOR_PATTERN);
    if (match) {
      const [, field, operator] = match;
      const value = term.slice(field.length + operator.length);
      filters.push({ field, operator, value });
    }
  }

  return filters.length > 0 ? filters : undefined;
}

export function parseSorts(raw: string | undefined): SortTerm[] | undefined {
  if (!raw) return undefined;

  const terms = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const sorts: SortTerm[] = [];

  for (const term of terms) {
    const [field, order] = term.split(':');
    if (field && (order === 'asc' || order === 'desc')) {
      sorts.push({ field, order });
    }
  }

  return sorts.length > 0 ? sorts : undefined;
}

export function parsePageSize(raw: string | undefined): number {
  const val = Number(raw);
  if (isNaN(val) || val < 1) return DEFAULT_PAGE_SIZE;
  return Math.min(val, MAX_PAGE_SIZE);
}

export function parsePage(raw: string | undefined): number {
  const val = Number(raw);
  if (isNaN(val) || val < 1) return DEFAULT_PAGE;
  return val;
}

export function parseSieveQuery(
  query: Record<string, string | undefined>,
): SieveOptions {
  return {
    filters: parseFilters(query.filters),
    sorts: parseSorts(query.sorts),
    page: parsePage(query.page),
    pageSize: parsePageSize(query.pageSize),
  };
}

export const Sieve = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SieveOptions => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const request = ctx.switchToHttp().getRequest();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    return parseSieveQuery(request.query ?? {});
  },
);
