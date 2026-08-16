/**
 * Command: create a new user.
 *
 * Commands represent write intents and are dispatched through the CommandBus.
 */
export class CreateUserCommand {
  public constructor(
    public readonly username: string,
    public readonly email?: string | null,
    public readonly bio?: string | null,
    public readonly avatarUrl?: string | null,
  ) {}
}
