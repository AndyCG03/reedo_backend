import { PushChangeDto } from '../../dto/push-sync.dto';

export class PushSyncCommand {
  public constructor(
    public readonly userId: string,
    public readonly changes: PushChangeDto[],
  ) {}
}
