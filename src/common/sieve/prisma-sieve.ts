/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { SieveOptions } from './sieve-options';
import { PrismaSieveConfig } from './prisma-sieve.config';

const SUPPORTED_OPERATORS = new Set([
  '==',
  '!=',
  '>',
  '<',
  '>=',
  '<=',
  '@=',
  '_=',
]);

export class PrismaSieve {
  static build<TWhereInput>(
    options: SieveOptions,
    config: PrismaSieveConfig<TWhereInput>,
  ) {
    const where: any = { AND: [] };
    const orderBy: any[] = [];

    options.filters?.forEach(({ field, operator, value }) => {
      const conf = config[field];
      if (!conf?.canFilter) return;

      const path = conf.path || [field];
      const condition = this.buildOperatorCondition(operator, value);

      if (condition) {
        const filterObject = this.createNestedObject(path, condition);
        where.AND.push(filterObject);
      }
    });

    options.sorts?.forEach(({ field, order }) => {
      const conf = config[field];
      if (!conf?.canSort) return;

      const path = conf.path || [field];
      const sortObject = this.createNestedObject(path, order);
      orderBy.push(sortObject);
    });

    const skip = (options.page - 1) * options.pageSize;
    const take = options.pageSize;

    return {
      where: where.AND.length > 0 ? where : {},
      orderBy,
      skip,
      take,
    };
  }

  static isSupportedOperator(operator: string): boolean {
    return SUPPORTED_OPERATORS.has(operator);
  }

  private static buildOperatorCondition(operator: string, value: string) {
    const parsedValue = this.parseValue(value);

    switch (operator) {
      case '==':
        return { equals: parsedValue };
      case '!=':
        return { not: parsedValue };
      case '>':
        return { gt: parsedValue };
      case '<':
        return { lt: parsedValue };
      case '>=':
        return { gte: parsedValue };
      case '<=':
        return { lte: parsedValue };
      case '@=':
        return { contains: value, mode: 'insensitive' };
      case '_=':
        return { startsWith: value, mode: 'insensitive' };
      default:
        return null;
    }
  }

  private static createNestedObject(path: string[], value: any): any {
    return path.reduceRight((acc, key) => ({ [key]: acc }), value);
  }

  private static parseValue(val: string): any {
    if (val === 'true') return true;
    if (val === 'false') return false;
    if (!isNaN(Number(val)) && val.trim() !== '') return Number(val);
    return val;
  }
}
