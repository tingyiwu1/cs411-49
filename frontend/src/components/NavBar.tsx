import { Link, useLocation } from "react-router-dom";
import logo from "./logo-sm.svg";
import { useContext } from "react";
import { LoginContext } from "../utils";

export const NavBar: React.FC = () => {
  const location = useLocation();
  const { user } = useContext(LoginContext);

  const pfp = user?.images[0]?.url || "";
  return (
    <>
      <div className="fixed right-0 top-0 h-20 w-full">
        <div className="flex h-full w-full flex-row justify-between bg-gradient-to-r from-[#F5E6BE] via-[#F5E6BE] to-[#F7BA60]">
          <div className="flex flex-row items-center">
            {location.pathname !== "/" && (
              <>
                <img src={logo} alt="Logo" className="ml-3 h-10" />
                <Link
                  to="/"
                  className="title text-2xl font-bold text-[#4A3434]"
                >
                  MoodTunes
                </Link>
              </>
            )}
          </div>
          <div className="flex flex-row items-center justify-end">
            {location.pathname !== "/" && (
              <Link
                to="/profile"
                className="mr-3 flex flex-row items-center justify-between gap-2 rounded-full bg-[#F1D999] py-2 pl-3 pr-2 drop-shadow"
              >
                <div>{user?.display_name}</div>
                <div className="text-sm">{user?.selectedAssessment?.title}</div>
                <div>
                  {pfp ? (
                    <img src={pfp} alt="Profile" className="h-10" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-300" />
                  )}
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
      <div className="h-20" />
    </>
  );
};
