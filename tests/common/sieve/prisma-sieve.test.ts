import { PrismaSieve } from '../../../src/common/sieve/prisma-sieve';
import { SieveOptions } from '../../../src/common/sieve/sieve-options';
import { PrismaSieveConfig } from '../../../src/common/sieve/prisma-sieve.config';

interface TestWhereInput {
  name?: string;
  price?: number;
  createdAt?: Date;
  category?: { name?: string };
}

const testConfig: PrismaSieveConfig<TestWhereInput> = {
  name: { canFilter: true, canSort: true },
  price: { canFilter: true, canSort: true },
  createdAt: { canFilter: false, canSort: true },
  'category.name': {
    canFilter: true,
    canSort: true,
    path: ['category', 'name'],
  },
};

function makeOptions(overrides: Partial<SieveOptions> = {}): SieveOptions {
  return { page: 1, pageSize: 20, ...overrides };
}

describe('PrismaSieve', () => {
  describe('build', () => {
    it('returns empty where and orderBy when no filters or sorts', () => {
      const result = PrismaSieve.build(makeOptions(), testConfig);
      expect(result.where).toEqual({});
      expect(result.orderBy).toEqual([]);
      expect(result.skip).toBe(0);
      expect(result.take).toBe(20);
    });

    it('computes skip/take for pagination', () => {
      const result = PrismaSieve.build(
        makeOptions({ page: 3, pageSize: 10 }),
        testConfig,
      );
      expect(result.skip).toBe(20);
      expect(result.take).toBe(10);
    });

    it('builds == filter', () => {
      const result = PrismaSieve.build(
        makeOptions({
          filters: [{ field: 'name', operator: '==', value: 'John' }],
        }),
        testConfig,
      );
      expect(result.where).toEqual({ AND: [{ name: { equals: 'John' } }] });
    });

    it('builds != filter', () => {
      const result = PrismaSieve.build(
        makeOptions({
          filters: [{ field: 'name', operator: '!=', value: 'John' }],
        }),
        testConfig,
      );
      expect(result.where).toEqual({ AND: [{ name: { not: 'John' } }] });
    });

    it('builds > filter with numeric parsing', () => {
      const result = PrismaSieve.build(
        makeOptions({
          filters: [{ field: 'price', operator: '>', value: '100' }],
        }),
        testConfig,
      );
      expect(result.where).toEqual({ AND: [{ price: { gt: 100 } }] });
    });

    it('builds < filter', () => {
      const result = PrismaSieve.build(
        makeOptions({
          filters: [{ field: 'price', operator: '<', value: '50' }],
        }),
        testConfig,
      );
      expect(result.where).toEqual({ AND: [{ price: { lt: 50 } }] });
    });

    it('builds >= filter', () => {
      const result = PrismaSieve.build(
        makeOptions({
          filters: [{ field: 'price', operator: '>=', value: '100' }],
        }),
        testConfig,
      );
      expect(result.where).toEqual({ AND: [{ price: { gte: 100 } }] });
    });

    it('builds <= filter', () => {
      const result = PrismaSieve.build(
        makeOptions({
          filters: [{ field: 'price', operator: '<=', value: '100' }],
        }),
        testConfig,
      );
      expect(result.where).toEqual({ AND: [{ price: { lte: 100 } }] });
    });

    it('builds @= filter with contains + insensitive', () => {
      const result = PrismaSieve.build(
        makeOptions({
          filters: [{ field: 'name', operator: '@=', value: 'oh' }],
        }),
        testConfig,
      );
      expect(result.where).toEqual({
        AND: [{ name: { contains: 'oh', mode: 'insensitive' } }],
      });
    });

    it('builds _= filter with startsWith + insensitive', () => {
      const result = PrismaSieve.build(
        makeOptions({
          filters: [{ field: 'name', operator: '_=', value: 'Jo' }],
        }),
        testConfig,
      );
      expect(result.where).toEqual({
        AND: [{ name: { startsWith: 'Jo', mode: 'insensitive' } }],
      });
    });

    it('builds multiple filters as AND', () => {
      const result = PrismaSieve.build(
        makeOptions({
          filters: [
            { field: 'name', operator: '==', value: 'John' },
            { field: 'price', operator: '>', value: '50' },
          ],
        }),
        testConfig,
      );
      expect(result.where.AND).toHaveLength(2);
      expect(result.where.AND[0]).toEqual({ name: { equals: 'John' } });
      expect(result.where.AND[1]).toEqual({ price: { gt: 50 } });
    });

    it('ignores non-filterable fields', () => {
      const result = PrismaSieve.build(
        makeOptions({
          filters: [{ field: 'createdAt', operator: '>', value: '2024-01-01' }],
        }),
        testConfig,
      );
      expect(result.where).toEqual({});
    });

    it('ignores unknown fields', () => {
      const result = PrismaSieve.build(
        makeOptions({
          filters: [{ field: 'nonexistent', operator: '==', value: 'x' }],
        }),
        testConfig,
      );
      expect(result.where).toEqual({});
    });

    it('ignores unsupported operators', () => {
      const result = PrismaSieve.build(
        makeOptions({
          filters: [{ field: 'name', operator: 'LIKE', value: '%john%' }],
        }),
        testConfig,
      );
      expect(result.where).toEqual({});
    });

    it('builds nested path filter', () => {
      const result = PrismaSieve.build(
        makeOptions({
          filters: [{ field: 'category.name', operator: '@=', value: 'shirt' }],
        }),
        testConfig,
      );
      expect(result.where).toEqual({
        AND: [
          { category: { name: { contains: 'shirt', mode: 'insensitive' } } },
        ],
      });
    });

    it('parses boolean values', () => {
      const result = PrismaSieve.build(
        makeOptions({
          filters: [{ field: 'name', operator: '==', value: 'true' }],
        }),
        testConfig,
      );
      expect(result.where.AND[0]).toEqual({ name: { equals: true } });
    });

    it('builds sort ascending', () => {
      const result = PrismaSieve.build(
        makeOptions({ sorts: [{ field: 'name', order: 'asc' }] }),
        testConfig,
      );
      expect(result.orderBy).toEqual([{ name: 'asc' }]);
    });

    it('builds sort descending', () => {
      const result = PrismaSieve.build(
        makeOptions({ sorts: [{ field: 'price', order: 'desc' }] }),
        testConfig,
      );
      expect(result.orderBy).toEqual([{ price: 'desc' }]);
    });

    it('builds nested path sort', () => {
      const result = PrismaSieve.build(
        makeOptions({ sorts: [{ field: 'category.name', order: 'asc' }] }),
        testConfig,
      );
      expect(result.orderBy).toEqual([{ category: { name: 'asc' } }]);
    });

    it('ignores non-sortable fields', () => {
      const result = PrismaSieve.build(
        makeOptions({ sorts: [{ field: 'updatedAt', order: 'desc' }] }),
        testConfig,
      );
      expect(result.orderBy).toEqual([]);
    });

    it('builds multiple sorts', () => {
      const result = PrismaSieve.build(
        makeOptions({
          sorts: [
            { field: 'name', order: 'asc' },
            { field: 'price', order: 'desc' },
          ],
        }),
        testConfig,
      );
      expect(result.orderBy).toEqual([{ name: 'asc' }, { price: 'desc' }]);
    });
  });

  describe('isSupportedOperator', () => {
    it('returns true for supported operators', () => {
      expect(PrismaSieve.isSupportedOperator('==')).toBe(true);
      expect(PrismaSieve.isSupportedOperator('!=')).toBe(true);
      expect(PrismaSieve.isSupportedOperator('>')).toBe(true);
      expect(PrismaSieve.isSupportedOperator('<')).toBe(true);
      expect(PrismaSieve.isSupportedOperator('>=')).toBe(true);
      expect(PrismaSieve.isSupportedOperator('<=')).toBe(true);
      expect(PrismaSieve.isSupportedOperator('@=')).toBe(true);
      expect(PrismaSieve.isSupportedOperator('_=')).toBe(true);
    });

    it('returns false for unsupported operators', () => {
      expect(PrismaSieve.isSupportedOperator('LIKE')).toBe(false);
      expect(PrismaSieve.isSupportedOperator('IN')).toBe(false);
      expect(PrismaSieve.isSupportedOperator('')).toBe(false);
    });
  });
});
