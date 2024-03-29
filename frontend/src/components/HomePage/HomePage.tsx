import React, { useEffect, useState } from "react";
import axios from "axios";

export const HomePage: React.FC = () => {
  const [data, setData] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const response = await axios.post("/test", {
        foo: "Never gonna give you up",
      });
      setData(response.data.body);
    };

    load();
  }, []);

  return (
    <div>
      <h1>Home Page</h1>
      <p>{data}</p>
    </div>
  );
};
