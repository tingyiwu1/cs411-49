import { UserProfile } from "@spotify/web-api-ts-sdk";
import { createContext } from "react";

export type UserData = UserProfile & {
  created_at: string;
};

type LoginContext = {
  loggedIn: boolean;
  user: UserData | null;
  loading: boolean;
  logOut: () => void;
};

export const LoginContext = createContext<LoginContext>({
  loading: true,
  user: null,
  loggedIn: false,
  logOut: () => {},
});
