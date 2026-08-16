/**
 * Shared domain foundations.
 *
 * Any aggregate that needs creation/update bookkeeping implements this
 * interface, which guarantees the fields exist with a single, predictable
 * shape across every vertical slice.
 */
export interface Timestamped {
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Base class that brings the timestamp fields along automatically.
 *
 * Aggregates extend this class so they don't have to redeclare
 * createdAt/updatedAt; concrete entities only pass their own fields to the
 * constructor and let this class store the timestamps.
 */
export abstract class TimestampedEntity implements Timestamped {
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  protected constructor(createdAt: Date, updatedAt: Date) {
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
