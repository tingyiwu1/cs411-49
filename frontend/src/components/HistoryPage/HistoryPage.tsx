import axios from "axios";
import { useEffect, useState } from "react";

type HistoryEntry = {
  id: string;
  content: string;
  createdAt: string;
};

type HistoryPageProps = {
  // foo: "bar";
};

export const HistoryPage: React.FC<HistoryPageProps> = () => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    const getHistory = async () => {
      const response = await axios.get<HistoryEntry[]>("/history");
      setHistory(response.data);
    };
    void getHistory();
  }, []);

  return (
    <div>
      <h1>History</h1>
      <ul>
        {history.map((entry) => (
          <li key={entry.id}>
            <p>{entry.content}</p>
            <p>{entry.createdAt}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};
