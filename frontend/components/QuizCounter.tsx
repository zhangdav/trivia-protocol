import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link"

export default function QuizCounterComponent() {
  return (
    <div className="text-center my-32">
        <span className="text-sm uppercase tracking-widest">Quiz #15 is closing in</span>
        <div className="text-5xl font-bold my-4">
        <span>2</span> : <span>16</span> : <span>34</span> : <span>28</span>
        </div>
        <div className="text-xs uppercase tracking-widest">
        <span className="mx-1">Days</span>
        <span className="mx-1">Hours</span>
        <span className="mx-1">Minutes</span>
        <span className="mx-1">Seconds</span>
        </div>
    </div>
  );
}
