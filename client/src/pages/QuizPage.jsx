







import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";

const socket = io("http://localhost:5000");

const questions = [
  {
    question: "What's your ideal weekend?",
    options: [
      { label: "Reading a book", vibe: "Chill" },
      { label: "Clubbing all night", vibe: "Party" },
      { label: "Catching up on work", vibe: "Work" },
      { label: "Going on a hike", vibe: "Adventure" },
    ],
  },
  {
    question: "Choose your favorite music:",
    options: [
      { label: "Lo-fi beats", vibe: "Chill" },
      { label: "EDM", vibe: "Party" },
      { label: "Classical piano", vibe: "Work" },
      { label: "Indie rock", vibe: "Adventure" },
    ],
  },
  {
    question: "Your ideal vacation?",
    options: [
      { label: "Beachside hammock", vibe: "Chill" },
      { label: "City nightlife", vibe: "Party" },
      { label: "Staycation & emails", vibe: "Work" },
      { label: "Backpacking", vibe: "Adventure" },
    ],
  },
];

const QuizPage = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [finalVibe, setFinalVibe] = useState("");
  const [vibeDistribution, setVibeDistribution] = useState({});
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(null);

  useEffect(() => {
    socket.on("vibeUpdate", (votes) => {
      const distribution = votes.reduce((acc, vote) => {
        acc[vote.vibe] = (acc[vote.vibe] || 0) + 1;
        return acc;
      }, {});
      setVibeDistribution(distribution);
    });

    return () => {
      socket.off("vibeUpdate");
    };
  }, []);

  const handleOptionSelect = (index) => {
    setSelectedOptionIndex(index);
  };

  const handleNext = () => {
    if (selectedOptionIndex === null) return;

    const selectedVibe = questions[currentQuestion].options[selectedOptionIndex].vibe;
    const updatedAnswers = [...answers, selectedVibe];
    setAnswers(updatedAnswers);
    setSelectedOptionIndex(null);

    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      const vibeCounts = updatedAnswers.reduce((acc, vibe) => {
        acc[vibe] = (acc[vibe] || 0) + 1;
        return acc;
      }, {});
      const final = Object.entries(vibeCounts).reduce((a, b) => (a[1] >= b[1] ? a : b))[0];
      setFinalVibe(final);
      setShowResult(true);
      localStorage.setItem("myVibe", final);
      socket.emit("submitQuiz", final);
    }
  };

  // Calculate total votes to show progress bars
  const totalVotes = Object.values(vibeDistribution).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center px-4 py-10">
      {!showResult ? (
        <div className="w-full max-w-xl bg-gray-800 p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-center">
            {questions[currentQuestion].question}
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {questions[currentQuestion].options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleOptionSelect(index)}
                className={`w-full p-4 rounded-lg text-left border-2 transition ${
                  selectedOptionIndex === index
                    ? "bg-indigo-600 border-indigo-300"
                    : "bg-gray-700 border-gray-600 hover:border-indigo-400"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <button
            onClick={handleNext}
            disabled={selectedOptionIndex === null}
            className="mt-6 bg-indigo-500 hover:bg-indigo-600 px-6 py-3 rounded-full font-semibold w-full transition disabled:opacity-50"
          >
            {currentQuestion === questions.length - 1 ? "Finish" : "Next"}
          </button>
        </div>
      ) : (
        <div className="w-full max-w-md bg-gray-800 rounded-xl p-6 text-center shadow-lg">
          <h2 className="text-2xl font-bold mb-4">
            Your Vibe: <span className="text-indigo-400">{finalVibe}</span>
          </h2>
          <h3 className="text-xl font-semibold mb-2">Live Vibe Distribution</h3>
          {Object.keys(vibeDistribution).length === 0 ? (
            <p className="text-gray-400">No votes yet. Be the first!</p>
          ) : (
            <ul className="mt-4 space-y-3 text-left">
              <AnimatePresence>
                {Object.entries(vibeDistribution)
                  .sort((a, b) => b[1] - a[1])
                  .map(([vibe, count]) => {
                    const percentage = totalVotes
                      ? Math.round((count / totalVotes) * 100)
                      : 0;

                    return (
                      <motion.li
                        key={vibe}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.4 }}
                        className="bg-gray-700 rounded-md px-4 py-2"
                      >
                        <div className="flex justify-between mb-1 font-semibold capitalize">
                          <span>{vibe}</span>
                          <span>{count} ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-600 rounded-full h-4">
                          <motion.div
                            className="bg-indigo-500 h-4 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                          />
                        </div>
                      </motion.li>
                    );
                  })}
              </AnimatePresence>
            </ul>
          )}

          {/* Share Result Button with Framer Motion animation */}
          <motion.button
            onClick={() => {
              const shareData = {
                title: "My Vibe Check Result",
                text: `I got '${finalVibe}' vibe on Vibe Check Quiz! Try it yourself.`,
                url: window.location.origin,
              };

              if (navigator.share) {
                navigator.share(shareData).catch(console.error);
              } else {
                navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
                alert("Result copied to clipboard!");
              }
            }}
            className="mt-6 bg-indigo-600 px-5 py-3 rounded-md hover:bg-indigo-700 shadow-lg"
            aria-label="Share your vibe check result"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Share Result
          </motion.button>
        </div>
      )}
    </div>
  );
};

export default QuizPage;
