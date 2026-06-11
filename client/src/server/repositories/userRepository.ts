import { IUser } from "@/lib/types"

export interface UserRepository {
  createUser(data: IUser): Promise<IUser>
}