import { UserProfile } from "@spotify/web-api-ts-sdk";
import axios from "axios";
import { useEffect, useState } from "react";

export const useLogin = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  useEffect(() => {
    const jwt = localStorage.getItem("jwt");
    if (jwt) {
      axios.defaults.headers.common["Authorization"] = jwt;
      const getUser = async () => {
        const response = await axios.get("/me");
        setUser(response.data);
      };
      void getUser();
    }
  }, []);
  return { loggedIn: user !== null, user };
};
