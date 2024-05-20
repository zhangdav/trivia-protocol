"use client";
import { useState} from "react";
import toast from "react-hot-toast";
import Loading from "./components/loading";
import InputArea from "./components/inputarea";
import ResetButton from "./components/resetbtn";
import GenerateTriviaButton from "./components/generatetriviabtn";
import GeneratedTrivia from "./components/generatedtrivia";
import GenerateAnswerButton from "./components/generateanswerbtn";
import GeneratedAnswer from "./components/generatedanswer";

export default function Chat() {
  // State variables with initial values
  const [isLoading, setIsLoading] = useState(false);
  const [period, setPeriod] = useState("");
  const [trivia, setTrivia] = useState("");
  const [answer, setAnswer] = useState("");

  // Function to copy text to clipboard and display success message
  function copyText(entryText: string) {
    navigator.clipboard.writeText(entryText);
    toast.success("Copied to clipboard!");
  }

  // Event handlers for article, state change, and file upload 
  const handlePeriod = (event: { target: { value: any; }; }) => {
    const value = event.target.value;
    setPeriod(value);
  };

  // Loading state UI
  if (isLoading) {
    return <Loading />;
  }

  // Main UI after input type selection
  return (
    <div className="px-4 py-6 md:py-8 lg:py-10">
      <div className="flex flex-col gap-4 max-w-3xl mx-auto">
        {/* Steps for providing input */}
        <div className="flex flex-col gap-2">
          {!trivia && (
            <div className="w-full">
              <h2 className="w-full text-2xl text-green-500 font-bold">Hello, guest!!!</h2>

              <InputArea period={period} onPeriodChange={handlePeriod} isLoading={false} />

            </div>
          )}
          <form className="flex flex-row items-start gap-2 md:gap-4">
            {!trivia && (
              <GenerateTriviaButton period={period} onButtonClicked={async () => {
                setIsLoading(true);
                const response = await fetch("api/question", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    triviaPeriod: period.toLowerCase().replace(/\s/g, ""),
                  }),
                });
                const data = await response.json();
                const cleanedJsonString = data.text.replace(/^```json\s*|```\s*$/g, "");
                setTrivia(cleanedJsonString);
                setIsLoading(false);
              }} />
            )}
            {trivia && !answer && (
              <GenerateAnswerButton trivia={trivia} onButtonClicked={async () => {
                setIsLoading(true);
                const response = await fetch("api/answer", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    triviaJson: trivia,
                  }),
                });
                const data = await response.json();
                const cleanedJsonString = data.text.replace(/^```json\s*|```\s*$/g, "");
                setAnswer(cleanedJsonString);
                setIsLoading(false);
              }} />
            )}
            <ResetButton trivia={trivia} answer={answer} isLoading={isLoading} onButtonClicked={async () => {
              window.location.reload();
            }} />
          </form>
        </div>

        {/* Question generation and display section */}
        {trivia && !isLoading && <GeneratedTrivia trivia={trivia} onButtonClicked={() => copyText(trivia)} />}

        {/* Answer generation and display section */}
        {answer && !isLoading && <GeneratedAnswer answer={answer} onButtonClicked={() => copyText(answer)} />}
      </div>
    </div>
  );
}