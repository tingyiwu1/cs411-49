// import { useState } from "react";
// import reactLogo from "./assets/react.svg";
// import viteLogo from "/vite.svg";
import axios from "axios";
import "./App.css";
// import { HomePage } from "./components/HomePage/HomePage";
import AssessmentPage from "./components/AssessmentPage/AssessmentPage";
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import LoginPage from "./components/LoginPage/LoginPage";
import { useLogin } from "./hooks";
import ChoicesPage from "./components/ChoicesPage/ChoicesPage";
import { HomePage } from "./components/HomePage/HomePage";
import { AssessmentsListPage } from "./components/AssessmentsListPage/AssessmentsListPage";
import { AssessmentResultsPage } from "./components/AssessmentResultsPage/AssessmentResultsPage";
import { useEffect } from "react";

function App() {
  if (process.env.NODE_ENV === "development") {
    axios.defaults.baseURL = "http://localhost:3000";
  } else {
    axios.defaults.baseURL = "http://localhost:3000";
  }
  const { loggedIn, user, logOut } = useLogin();

  // const navigate = useNavigate();

  // useEffect(() => {
  //   if (!loggedIn) {
  //     navigate("/");
  //   }
  // }, [loggedIn, navigate]);
  // useEffect(() => {
  //   if (loggedIn) {
  //     const getPlaylist = async () => {
  //       const response = await axios.get("/evaluate");
  //       console.log(response.data);
  //     };
  //     void getPlaylist();
  //   }
  // }, [loggedIn]);
  return (
    <>
      <BrowserRouter>
        <div className="fixed left-0 top-0 h-20 w-full bg-red-300">
          <div className="flex h-full flex-row items-center justify-between">
            <div>logo</div>
            <div className="flex flex-row items-center justify-end gap-2">
              {user && (
                <>
                  <Link to="/">Home</Link>
                  <Link to="/assess">Assess me</Link>
                  <Link to="/assessments">Assessments</Link>
                  <button onClick={logOut}>Log Out</button>
                  <div>{user.display_name}</div>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="h-20" />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/assess" element={<AssessmentPage />} />
          <Route path="/assessments" element={<AssessmentsListPage />} />
          <Route path="/assessments/:id" element={<AssessmentResultsPage />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
