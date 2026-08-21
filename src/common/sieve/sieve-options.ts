export interface FilterTerm {
  field: string;
  operator: string;
  value: string;
}

export interface SortTerm {
  field: string;
  order: 'asc' | 'desc';
}

export interface SieveOptions {
  filters?: FilterTerm[];
  sorts?: SortTerm[];
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    lastPage: number;
  };
}
