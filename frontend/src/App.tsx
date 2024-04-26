// import { useState } from "react";
// import reactLogo from "./assets/react.svg";
// import viteLogo from "/vite.svg";
import axios from "axios";
import "./App.css";
// import { HomePage } from "./components/HomePage/HomePage";
import AssessmentPage from "./components/AssessmentPage/AssessmentPage";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import LoginPage from "./components/LoginPage/LoginPage";
import { useLogin } from "./hooks";
import ChoicesPage from "./components/ChoicesPage/ChoicesPage";
import { HomePage } from "./components/HomePage/HomePage";
import { AssessmentsListPage } from "./components/AssessmentsListPage/AssessmentsListPage";
import { AssessmentResultsPage } from "./components/AssessmentResultsPage/AssessmentResultsPage";

function App() {
  if (process.env.NODE_ENV === "development") {
    axios.defaults.baseURL = "http://localhost:3000";
  } else {
    axios.defaults.baseURL = "http://localhost:3000";
  }
  const { loggedIn, user } = useLogin();
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
          header
        </div>
        <div className="h-20" />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/assess" element={<AssessmentPage />} />
          <Route path="/choices" element={<ChoicesPage />} />
          <Route path="/assessments" element={<AssessmentsListPage />} />
          <Route path="/assessments/:id" element={<AssessmentResultsPage />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
