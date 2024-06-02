import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link"
import { CardTitle, CardHeader, CardContent, Card } from "@/components/ui/card"
import { JSX, SVGProps } from "react";
import DepositButtonComponent from "./DepositButton";

export default function PrizePoolComponent() {
  return (
    <section className="full-width">

    <div className="flex justify-left items-center flex-col md:flex-row my-4">
      <h2 className="text-4xl font-semibold mb-4 md:mb-0 ml-2">Prize Pool</h2>
      {/* <Button className="text-[#70f7c9] border-[#70f7c9] ml-8 bg-[#0d0e12]" variant="outline" >+ Make deposit</Button> */}
      <DepositButtonComponent />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">

      <Card className="bg-[#17222c] border border-gray-700">
        <CardHeader className="justify-center items-center mb-2">
          <CardTitle>Weekly Prize pool</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center mb-8">
          <CurrencyIcon className="w-6 h-6 text-blue-500" />
          <span className="text-3xl font-bold ml-2">1,300</span>
        </CardContent>
      </Card>

      <Card className="bg-[#17222c] border border-gray-700">
        <CardHeader className="justify-center items-center mb-2">
          <CardTitle>Total Prize pool</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center mb-8">
          <CurrencyIcon className="w-6 h-6 text-blue-500" />
          <span className="text-3xl font-bold ml-2">9,500</span>
        </CardContent>
      </Card>

    </div>

  </section>

);
}


function CurrencyIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="8" />
        <line x1="3" x2="6" y1="3" y2="6" />
        <line x1="21" x2="18" y1="3" y2="6" />
        <line x1="3" x2="6" y1="21" y2="18" />
        <line x1="21" x2="18" y1="21" y2="18" />
      </svg>
    )
  }
  