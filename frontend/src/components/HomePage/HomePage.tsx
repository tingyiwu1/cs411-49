import React from "react";
import { useLogin } from "../../hooks";
import { Link } from "react-router-dom";

export const HomePage: React.FC = () => {
  const { loggedIn, logOut } = useLogin();

  return (
    <div>
      <h1>Home Page</h1>
      {loggedIn ? (
        <>
          <Link to="/assess">Assess</Link>
          <button onClick={logOut}>Log Out</button>
        </>
      ) : (
        <Link to="http://localhost:3000/login">Login</Link>
      )}
    </div>
  );
};
