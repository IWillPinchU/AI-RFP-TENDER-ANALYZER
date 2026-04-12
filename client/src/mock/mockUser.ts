import type { User } from '@/types/auth.types';

export const mockUser: User = {
  id: 1,
  firstName: 'Sanskar',
  lastName: 'Singhal',
  email: 'sanskar@rfpintel.com',
  twoFactorEnabled: false,
  roles: ['ROLE_USER'],
  verified: true,
};
