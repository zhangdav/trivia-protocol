import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link"
import { CardTitle, CardHeader, CardContent, Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function AwwardBoardComponent() {
  return (
    <section className="full-width my-8">
    <h2 className="text-4xl font-semibold mb-4">Award board</h2>
    <ScrollArea className="w-full bg-[#17222c] border border-gray-700 rounded-lg p-4 space-y-4">
      <div className="flex justify-between">
        <span>Quiz #14</span>
        <span>16 wallets won $97.54</span>
      </div>
      <div className="flex justify-between">
        <span>Quiz #13</span>
        <span>16 wallets won $97.54</span>
      </div>
      <div className="flex justify-between">
        <span>Quiz #12</span>
        <span>16 wallets won $97.54</span>
      </div>
      <div className="flex justify-between">
        <span>Quiz #11</span>
        <span>16 wallets won $97.54</span>
      </div>
      <div className="flex justify-between">
        <span>Quiz #10</span>
        <span>16 wallets won $97.54</span>
      </div>
      <div className="flex justify-between">
        <span>Quiz #9</span>
        <span>16 wallets won $97.54</span>
      </div>
      <div className="flex justify-between">
        <span>Quiz #8</span>
        <span>16 wallets won $97.54</span>
      </div>
      <Button className="mx-auto" variant="ghost">
        Load more
      </Button>
    </ScrollArea>
  </section>            

);
}



  