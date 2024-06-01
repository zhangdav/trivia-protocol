import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link"
import React, { useEffect, useState } from 'react';

interface QuizCounterComponentnProps {
  initialDays: number;
  initialHours: number;
  initialMinutes: number;
  initialSeconds: number;
}

const QuizCounterComponent: React.FC<QuizCounterComponentnProps> = ({ initialDays, initialHours, initialMinutes, initialSeconds }) => {
  const [days, setDays] = useState(initialDays);
  const [hours, setHours] = useState(initialHours);
  const [minutes, setMinutes] = useState(initialMinutes);
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prevSeconds) => {
        if (prevSeconds > 0) return prevSeconds - 1;

        setMinutes((prevMinutes) => {
          if (prevMinutes > 0) return prevMinutes - 1;

          setHours((prevHours) => {
            if (prevHours > 0) return prevHours - 1;

            setDays((prevDays) => (prevDays > 0 ? prevDays - 1 : 0));
            return 23;
          });

          return 59;
        });

        return 59;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number) => String(num).padStart(2, '0');

  return (
    <div className="text-center my-32">
        <span className="text-sm uppercase tracking-widest">Quiz #15 is closing in</span>
        <div className="text-5xl font-bold my-4">
        <span>{formatNumber(days)}</span> : <span>{formatNumber(hours)}</span> : <span>{formatNumber(minutes)}</span> : <span>{formatNumber(seconds)}</span>
        </div>
        <div className="text-xs uppercase tracking-widest">
        <span className="mx-1">Days</span>
        <span className="mx-1">Hours</span>
        <span className="mx-1">Minutes</span>
        <span className="mx-1">Seconds</span>
        </div>
    </div>
  );
};

export default QuizCounterComponent;
