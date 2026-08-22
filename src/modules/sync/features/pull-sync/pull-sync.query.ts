export class PullSyncQuery {
  public constructor(
    public readonly userId: string,
    public readonly cursor: number,
  ) {}
}
