import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import axios from "axios";

// Use production backend URL or fallback to localhost
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://vibe-check-quiz-app-1.onrender.com";

// Use socket connection with full backend URL
const socket = io(API_URL, {
  transports: ["websocket"], // Ensures consistent behavior across environments
  withCredentials: true,
});

export default function LiveResults() {
  const [results, setResults] = useState({});
  const myVibe = localStorage.getItem("myVibe");

  useEffect(() => {
    // Fetch initial vote results
    const fetchResults = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/results`, {
          withCredentials: true,
        });
        console.log("Get The rekdd", res)
        setResults(res.data);
      } catch (err) {
        console.error("Failed to fetch results:", err);
      }
    };

    fetchResults();

    // Listen for real-time vote updates
    socket.on("vibeUpdate", (data) => {
      setResults(data);
    });

    return () => {
      socket.off("vibeUpdate");
    };
  }, []);

  return (
    <div className="p-8 text-center bg-gray-900 text-white min-h-screen">
      <h2 className="text-2xl font-bold mb-4 text-purple-600">
        Your Vibe: {myVibe || "Not Found"}
      </h2>
      <h3 className="text-xl font-semibold mb-2">Live Vibe Distribution</h3>
      {Object.keys(results).length === 0 ? (
        <p className="text-gray-500 mt-4">No votes yet. Be the first!</p>
      ) : (
        <ul className="list-none mt-4">
          {Object.entries(results).map(([vibe, count]) => (
            <li key={vibe} className="mb-1">
              {vibe}: {count} vote(s)
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
