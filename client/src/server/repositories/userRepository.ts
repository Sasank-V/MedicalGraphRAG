import { IUser } from "@/lib/types";

export interface UserRepository {
  createUser(data: IUser): Promise<IUser>;
  getUserByEmail(email: string): Promise<IUser | null>;
}
