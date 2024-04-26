import { useEffect, useState } from "react";
import { Assessment } from "../../types";
import axios from "axios";
import { Link } from "react-router-dom";

export const AssessmentsListPage: React.FC = () => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);

  useEffect(() => {
    axios.get<Assessment[]>("/assessments").then((response) => {
      setAssessments(response.data);
    });
  }, []);

  return (
    <div>
      <h1>Assessments</h1>
      {assessments.map((assessment) => (
        <div key={assessment.id}>
          <h2>{assessment.id}</h2>
          <Link to={`/assessments/${assessment.id}`}>View</Link>
          <p>
            {assessment.mbtiTraits.map((t) => (
              <>{t.trait} </>
            ))}
          </p>
          <p>{assessment.personality}</p>
        </div>
      ))}
    </div>
  );
};
