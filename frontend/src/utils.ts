import { UserProfile } from "@spotify/web-api-ts-sdk";
import { createContext } from "react";
import { Assessment } from "./types";

export type UserData = UserProfile & {
  created_at: string;
  selectedAssessment: Assessment | null;
};

type LoginContext = {
  loggedIn: boolean;
  user: UserData | null;
  loading: boolean;
  logOut: () => void;
  refetchUser: () => void;
};

export const LoginContext = createContext<LoginContext>({
  loading: true,
  user: null,
  loggedIn: false,
  logOut: () => {},
  refetchUser: () => {},
});
