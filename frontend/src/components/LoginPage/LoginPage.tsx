import { useEffect } from "react";
import "./Login.css"; // Import CSS file for styling
import { useNavigate, useSearchParams } from "react-router-dom";

const LoginPage = () => {
  const [params, setParams] = useSearchParams();

  const navigate = useNavigate();

  useEffect(() => {
    const jwt = params.get("jwt");
    if (jwt) {
      localStorage.setItem("jwt", jwt);
      navigate("/");
    }
  }, [params, setParams, navigate]);

  return <div className="login-container">Logging you in...</div>;
};

export default LoginPage;
