export class SyncChange {
  public constructor(
    public readonly id: bigint,
    public readonly userId: string,
    public readonly sequence: number,
    public readonly changeId: string,
    public readonly entity: string,
    public readonly entityId: string,
    public readonly operation: string,
    public readonly payload: Record<string, unknown>,
    public readonly createdAt: Date,
  ) {}

  public static create(input: {
    id: bigint;
    userId: string;
    sequence: number;
    changeId: string;
    entity: string;
    entityId: string;
    operation: string;
    payload: Record<string, unknown>;
  }): SyncChange {
    return new SyncChange(
      input.id,
      input.userId,
      input.sequence,
      input.changeId,
      input.entity,
      input.entityId,
      input.operation,
      input.payload,
      new Date(),
    );
  }
}
