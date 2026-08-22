import { SetMetadata } from '@nestjs/common';
import { Roles, ROLES_KEY } from '../../src/modules/auth/decorators/roles.decorator';

jest.mock('@nestjs/common', () => ({
  ...jest.requireActual('@nestjs/common'),
  SetMetadata: jest.fn(),
}));

describe('Roles Decorator', () => {
  it('sets metadata with provided roles', () => {
    const roles = ['ADMIN', 'MODERATOR'];
    Roles(...roles);

    expect(SetMetadata).toHaveBeenCalledWith(ROLES_KEY, roles);
  });

  it('sets metadata with single role', () => {
    const roles = ['ADMIN'];
    Roles(...roles);

    expect(SetMetadata).toHaveBeenCalledWith(ROLES_KEY, roles);
  });

  it('sets metadata with empty array when no roles provided', () => {
    Roles();

    expect(SetMetadata).toHaveBeenCalledWith(ROLES_KEY, []);
  });
});
