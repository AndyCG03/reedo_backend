/**
 * Command: create a new user profile.
 *
 * Commands represent write intents and are dispatched through the CommandBus.
 */
export class CreateUserProfileCommand {
  public constructor(
    public readonly username: string,
    public readonly displayName: string,
    public readonly bio?: string | null,
    public readonly avatarUrl?: string | null,
  ) {}
}
