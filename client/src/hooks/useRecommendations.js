import { useState, useEffect } from "react";
import { getRecommendations } from "../api/recommendationsApi";

export function useRecommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    getRecommendations()
      .then((res) => {
        setRecommendations(res.data.recommendations || []);
        setMessage(res.data.message || "");
      })
      .catch((err) => {
        console.error("useRecommendations:", err);
        setError(err);
      })
      .finally(() => setLoading(false));
  }, []);

  return { recommendations, loading, error, message };
}
