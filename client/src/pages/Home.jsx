




import React from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center bg-gray-900 text-white">
      <h1 className="text-4xl font-bold mb-4">Vibe Check Quiz</h1>
      <button
        onClick={() => navigate("/quiz")}
        className="bg-purple-600 text-white px-6 py-3 rounded-full hover:bg-purple-700 transition"
      >
        Start Quiz
      </button>
    </div>
  );
}
