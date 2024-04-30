import { useContext, useEffect, useState } from "react";
import { Assessment } from "../../types";
import axios from "axios";
import { Link } from "react-router-dom";
import { LoginContext } from "../../utils";

export const ProfilePage: React.FC = () => {
  const { user, logOut, refetchUser } = useContext(LoginContext);

  const [assessments, setAssessments] = useState<Assessment[]>([]);

  useEffect(() => {
    void fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    const response = await axios.get<Assessment[]>("/assessments");
    setAssessments(response.data);
  };

  const handleSelectAssessment = async (assessment: Assessment) => {
    if (assessment.selected) return;
    await axios.post<Assessment>("/select_assessment", {
      assessmentId: assessment.id,
    });
    void fetchAssessments();
    void refetchUser();
  };

  const pfp = user?.images[0]?.url || "";

  const joined = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("default", {
        month: "long",
        year: "numeric",
      })
    : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#FDF7EA] via-[#FAEDCC] via-[75%] to-[#F2DDA4]">
      <div className="grid flex-shrink grid-cols-2">
        <div className="inline-block overflow-auto">
          <div className="flex flex-col items-center gap-3 px-5">
            <div className="mt-5 self-stretch rounded-md border-2 border-[#4A3434] bg-[#F1D999] py-2 text-center text-xl">
              Personality Archive
            </div>
            <Link
              to="/analyze"
              className="mt-2 self-stretch rounded-md border-2 border-[#4A3434] bg-[#DCEEC5] py-2 text-center text-xl"
            >
              +
            </Link>
            {assessments.map((assessment) => (
              <div
                className="flex-col rounded-lg bg-gradient-to-t from-[#E1ECD3] to-[#BFDD99] px-5 py-2"
                key={assessment.id}
              >
                <div className="flex flex-row items-center justify-between">
                  <div className="flex flex-row items-center justify-start gap-3">
                    <div
                      onClick={() => handleSelectAssessment(assessment)}
                      className={`h-5 w-5 flex-shrink-0 rounded-full border-2 border-[#4A3434] ${assessment.selected ? "cursor-default bg-[#755B5B]" : "cursor-pointer bg-[#F4F0E3]"}`}
                    />
                    <Link
                      className="text-2xl text-[#4A3434]"
                      to={`/assessments/${assessment.id}`}
                    >
                      {assessment.title}
                    </Link>
                  </div>
                  <div className="text-md text-[#755B5B]">
                    {new Date(assessment.createdAt).toLocaleString("default")}
                  </div>
                </div>
                <p className="text-md ml-8 text-[#755B5B]">
                  {assessment.mbtiTraits.map((t, i) => (
                    <span key={`${assessment.id}-${i}`}>{t.trait} </span>
                  ))}
                </p>
                <p className="ml-8 overflow-ellipsis text-sm text-[#4A3434]">
                  {assessment.personality}
                </p>
              </div>
            ))}
          </div>
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
