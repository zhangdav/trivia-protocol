"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link"
import HeaderComponent from "@/components/Header";
import QuizCounterComponent from "@/components/QuizCounter";
import UserPointsComponent from "@/components/UserPoints";

export default function Home() {
  return (
    <div className="px-10 py-20">
      <div className="absolute -z-50 top-0 mx-auto w-1/2 h-1/2 bg-primary/50 blur-[256px] opacity-75 rounded-full -z-1" />
      <div className="absolute -z-50 top-0 left-0 w-1/2 h-1/2 bg-green-300/70 blur-[256px] opacity-45 rounded-full -z-1" />
      <div className="space-y-20">
        <div className="flex flex-col items-center w-full space-y-4">

          <HeaderComponent />     

          <UserPointsComponent />

          <main className="flex flex-col items-center">

          <div className="flex flex-col items-center mt-16">
            <h2 className="text-2xl uppercase tracking-widest mb-16">Welcome to Trivia</h2>
            <h1 className="text-6xl font-bold text-center mb-8 bg-gradient-to-r from-[#d1f7e6] via-[#70f7c9] to-[#5fe5f7] text-transparent bg-clip-text">
              Deposit for weekly trivia to
            </h1>
            <h1 className="text-6xl font-bold text-center pb-2 bg-gradient-to-r from-[#d1f7e6] via-[#70f7c9] to-[#5fe5f7] text-transparent bg-clip-text">
              win from grand prize pool{"\n          "}
            </h1>
          </div>

            <QuizCounterComponent initialDays={2} initialHours={16} initialMinutes={34} initialSeconds={28} />
            
            <Button className="text-[#70f7c9] border-[#70f7c9] mb-8" variant="outline">Bet to win</Button>
            <Link className="text-xl text-white font-bold underline" href="#">
              What is Trivia?
            </Link>
          </main>
        </div>
      </div>
    </div>
  );
}
