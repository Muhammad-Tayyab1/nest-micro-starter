export interface ProductSchema {
  id: string;
  name: string;
  description?: string;
  price: number;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}
