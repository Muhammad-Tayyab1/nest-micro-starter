export const USER_PATTERNS = {
  FIND_ALL: 'user.find_all',
  FIND_ONE: 'user.find_one',
  FIND_BY_EMAIL: 'user.find_by_email',
  VALIDATE: 'user.validate',
  CREATE: 'user.create',
  UPDATE: 'user.update',
  DELETE: 'user.delete',
} as const;

export const PRODUCT_PATTERNS = {
  FIND_ALL: 'product.find_all',
  FIND_ONE: 'product.find_one',
  CREATE: 'product.create',
  UPDATE: 'product.update',
  DELETE: 'product.delete',
} as const;

export const NOTIFICATION_PATTERNS = {
  SEND: 'notification.send',
} as const;
