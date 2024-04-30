import { useContext, useEffect, useState } from "react";
import { Assessment } from "../../types";
import axios from "axios";
import { Link } from "react-router-dom";
import { LoginContext } from "../../utils";

export const ProfilePage: React.FC = () => {
  const { user, logOut } = useContext(LoginContext);

  const [assessments, setAssessments] = useState<Assessment[]>([]);

  useEffect(() => {
    axios.get<Assessment[]>("/assessments").then((response) => {
      setAssessments(response.data);
    });
  }, []);

  const pfp = user?.images[0]?.url || "";

  const joined = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("default", {
        month: "long",
        year: "numeric",
      })
    : undefined;

  return (
    <div className="bg-gradient-to-r from-[#FDF7EA] via-[#FAEDCC] via-[75%] to-[#F2DDA4]">
      <div className="grid flex-shrink grid-cols-2">
        <div className="inline-block overflow-auto ">
          <h1>Assessments</h1>
          {assessments.map((assessment) => (
            <div key={assessment.id}>
              <h2>{assessment.id}</h2>
              <Link to={`/assessments/${assessment.id}`}>View</Link>
              <p>
                {assessment.mbtiTraits.map((t, i) => (
                  <span key={`${assessment.id}-${i}`}>{t.trait} </span>
                ))}
              </p>
              <p>{assessment.personality}</p>
            </div>
          ))}
        </div>
        <div className="" />
      </div>
      <div className="fixed right-0 top-20 h-full">
        <div className="flex flex-col items-center">
          <div className="my-10 flex flex-row items-center justify-center">
            <div className="relative h-80 w-[32rem]">
              <div className="absolute top-[-40] h-80 w-80 rounded-full bg-[#FAEEE2]" />
              <div className="absolute left-16 h-80 w-80 rounded-full bg-[#FFD0B5]" />
              {pfp ? (
                <img
                  src={pfp}
                  alt="Profile"
                  className="absolute left-32 h-80"
                />
              ) : (
                <div className="absolute left-32 h-80 w-80 rounded-full bg-gray-300" />
              )}
            </div>
          </div>
          <div className="self-start">
            <div className="text-xl font-bold text-[#4A3434]">
              {user?.display_name}
            </div>
            <Link
              to={user?.external_urls.spotify ?? ""}
              target="_blank"
              rel="noopener noreferrer"
              className="text-md text-[#755B5B]"
            >
              @{user?.id}
            </Link>
            {joined && (
              <div className="text-sm text-[#9E8A8A]">Joined {joined}</div>
            )}
          </div>
          <div className="mt-10 flex w-full flex-row justify-between gap-5">
            <Link
              to={user?.external_urls.spotify ?? ""}
              className="rounded-2xl border-2 border-[#4A3434] bg-[#F4F0E3] px-10 py-2 text-center"
            >
              view on spotify
            </Link>
            <Link
              to=""
              onClick={logOut}
              className="rounded-2xl border-2 border-[#4A3434] bg-[#F4F0E3] px-10 py-2 text-center"
            >
              log out
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
