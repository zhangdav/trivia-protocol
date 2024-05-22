import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link"
import HeaderComponent from "@/components/Header";
import QuizCounterComponent from "@/components/QuizCounter";
import UserPointsComponent from "@/components/UserPoints";
import { AvatarImage, Avatar } from "@/components/ui/avatar"
import { CardTitle, CardHeader, CardContent, Card } from "@/components/ui/card"
import PrizePoolComponent from "@/components/PricePool";
import AwwardBoardComponent from "@/components/AwardBoard";

export default function Home() {
  return (
    <div className="px-10 py-20">
      <div className="absolute -z-50 top-0 mx-auto w-1/2 h-1/2 bg-primary/50 blur-[256px] opacity-75 rounded-full -z-1" />
      <div className="absolute -z-50 top-0 left-0 w-1/2 h-1/2 bg-green-300/70 blur-[256px] opacity-45 rounded-full -z-1" />
      <div className="space-y-20">
        <div className="flex flex-col items-center w-full space-y-4">

          <HeaderComponent />     

          <UserPointsComponent />

          <main className="flex flex-col items-center full-width">

            <PrizePoolComponent />

            <AwwardBoardComponent />
            
          </main>

        </div>
      </div>
    </div>
  );
}

