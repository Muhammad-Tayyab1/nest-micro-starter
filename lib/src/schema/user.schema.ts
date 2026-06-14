// Shared schema types derived from Prisma models.
// Import and extend these in service-level code as needed.

export interface UserSchema {
  id: string;
  email: string;
  password: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
