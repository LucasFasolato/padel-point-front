import { describe, expect, it, vi, beforeEach } from 'vitest';
import { authService } from '../auth-service';

vi.mock('@/lib/api', () => ({
  default: {
    post: vi.fn(),
  },
}));

import api from '@/lib/api';
const mockedApi = vi.mocked(api);

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('login calls POST /auth/login-user with email and password', async () => {
    const response = { accessToken: 'tok-123', user: { userId: 'u1', email: 'a@b.com', role: 'USER' } };
    mockedApi.post.mockResolvedValue({ data: response });

    const result = await authService.login('a@b.com', 'secret');

    expect(mockedApi.post).toHaveBeenCalledWith('/auth/login-user', {
      email: 'a@b.com',
      password: 'secret',
    });
    expect(result.accessToken).toBe('tok-123');
  });

  it('register calls POST /auth/register-user with name, email, and password', async () => {
    const response = { accessToken: 'tok-456', user: { userId: 'u2', email: 'x@y.com', role: 'USER' } };
    mockedApi.post.mockResolvedValue({ data: response });

    const result = await authService.register('Juan', 'x@y.com', 'pass123');

    expect(mockedApi.post).toHaveBeenCalledWith('/auth/register-user', {
      name: 'Juan',
      email: 'x@y.com',
      password: 'pass123',
    });
    expect(result.accessToken).toBe('tok-456');
  });

  it('register returns message when no token provided', async () => {
    mockedApi.post.mockResolvedValue({ data: { message: 'Account created' } });

    const result = await authService.register('María', 'z@w.com', 'pass123');

    expect(result.accessToken).toBeUndefined();
    expect(result.message).toBe('Account created');
  });
});
