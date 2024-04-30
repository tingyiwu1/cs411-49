import { Link } from "react-router-dom";
import logo from "../logo-sm.svg";

export const HomePage: React.FC = () => {
  return (
    <div>
      <div className="mt-6 flex flex-row items-center justify-center">
        <div>
          <div className="mx-5 mt-6 flex flex-row items-center gap-3">
            <img src={logo} alt="Logo" className="h-72" />
            <h1 className="text-8xl font-bold text-[#4A3434]">MoodTunes</h1>
          </div>
          <h2 className="text-6xl font-bold text-[#755B5B]">
            To Your Own Personal Rhythm
          </h2>
          <p className="text-2xl text-[#AE9E9E]">
            Using cutting edge technology and AI to help you sing and save all
            your heart's tunes
          </p>
        </div>
      </div>
      <div className="mt-6 flex flex-row items-center justify-center">
        <Link
          to="http://localhost:3000/login"
          className="rounded-2xl bg-gradient-to-t from-[#F5E6BE]  via-[#F5E6BE] to-[#F7BA60] px-10 py-5 text-3xl font-bold text-[#4A3434] drop-shadow"
        >
          Log In
        </Link>
      </div>
    </div>
  );
};
