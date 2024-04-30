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

  // Define inline CSS styles for container and assessment box
  const containerStyle: React.CSSProperties = {
    padding: '20px', // Adjust the padding size as needed
    borderRadius: '8px', // Optional: Add border radius
  };

  // Style for each assessment box
  const assessmentBoxStyle: React.CSSProperties = {
    marginBottom: '20px', // Adjust margin bottom as needed
    backgroundColor: '#f0f0f0', // Set background color
    cursor: 'pointer', // Set cursor to pointer to indicate clickability
    borderBottom: '1px solid #ccc', // Add bottom border
    paddingBottom: '10px', // Add padding to separate assessments
  };

  return (
    <div style={containerStyle}>
      <h1>Assessments</h1>
      {assessments.map((assessment, index) => (
        <Link key={assessment.id} to={`/assessments/${assessment.id}`} style={assessmentBoxStyle}>
          <div>
            {/* <h2>{assessment.id}</h2> */}
            <p>
              {assessment.mbtiTraits.map((t, i) => (
                <span key={`${assessment.id}-${i}`}>{t.trait} </span>
              ))}
            </p>
            <p>{assessment.personality}</p>
          </div>
          {/* Render divider if not the last assessment */}
          {index !== assessments.length - 1 && <hr />}
        </Link>
      ))}
    </div>
  );
};
