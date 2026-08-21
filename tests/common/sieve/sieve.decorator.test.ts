import { parseSieveQuery } from '../../../src/common/sieve/sieve.decorator';

describe('parseSieveQuery', () => {
  it('returns default page and pageSize when no query params', () => {
    const result = parseSieveQuery({});
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
    expect(result.filters).toBeUndefined();
    expect(result.sorts).toBeUndefined();
  });

  it('parses page and pageSize', () => {
    const result = parseSieveQuery({ page: '3', pageSize: '10' });
    expect(result.page).toBe(3);
    expect(result.pageSize).toBe(10);
  });

  it('caps pageSize at 100', () => {
    const result = parseSieveQuery({ pageSize: '200' });
    expect(result.pageSize).toBe(100);
  });

  it('defaults to 1 for invalid page', () => {
    const result = parseSieveQuery({ page: 'abc' });
    expect(result.page).toBe(1);
  });

  it('defaults to 20 for invalid pageSize', () => {
    const result = parseSieveQuery({ pageSize: '-5' });
    expect(result.pageSize).toBe(20);
  });

  it('parses single filter', () => {
    const result = parseSieveQuery({ filters: 'name==John' });
    expect(result.filters).toEqual([
      { field: 'name', operator: '==', value: 'John' },
    ]);
  });

  it('parses multiple filters', () => {
    const result = parseSieveQuery({ filters: 'name==John,price>100' });
    expect(result.filters).toEqual([
      { field: 'name', operator: '==', value: 'John' },
      { field: 'price', operator: '>', value: '100' },
    ]);
  });

  it('parses @= operator', () => {
    const result = parseSieveQuery({ filters: 'name@=oh' });
    expect(result.filters).toEqual([
      { field: 'name', operator: '@=', value: 'oh' },
    ]);
  });

  it('parses _= operator', () => {
    const result = parseSieveQuery({ filters: 'name_=Jo' });
    expect(result.filters).toEqual([
      { field: 'name', operator: '_=', value: 'Jo' },
    ]);
  });

  it('ignores invalid filter format', () => {
    const result = parseSieveQuery({ filters: 'invalidfilter' });
    expect(result.filters).toBeUndefined();
  });

  it('parses single sort', () => {
    const result = parseSieveQuery({ sorts: 'createdAt:desc' });
    expect(result.sorts).toEqual([{ field: 'createdAt', order: 'desc' }]);
  });

  it('parses multiple sorts', () => {
    const result = parseSieveQuery({ sorts: 'name:asc,price:desc' });
    expect(result.sorts).toEqual([
      { field: 'name', order: 'asc' },
      { field: 'price', order: 'desc' },
    ]);
  });

  it('ignores sort with invalid order', () => {
    const result = parseSieveQuery({ sorts: 'name:invalid' });
    expect(result.sorts).toBeUndefined();
  });

  it('handles empty query object', () => {
    const result = parseSieveQuery({});
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
  });
});
