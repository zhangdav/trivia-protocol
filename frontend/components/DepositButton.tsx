"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import React, { useState } from "react"
import { ethers } from "ethers"

const triviaAddress = "0x5574e61FE92d315Af0715AC3e3db6F61CD7934E7"
const usdcAddress = "0xCaC7Ffa82c0f43EBB0FC11FCd32123EcA46626cf"

const triviaJSON = require("../json/Trivia.json")
const triviaABI = triviaJSON.abi
//const triviaInterface = new ethers.utils.Interface(triviaABI)

const usdcJSON = require("../json/Usdc.json")
const usdcABI = usdcJSON


export default function DepositButtonComponent() {

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDepositInReview, setIsDepositInReview] = useState(false);
    const [deposit, setDeposit] = useState(0);
    const [depositInProgess, setDepositInProgress] = useState(false);

    const handleChange = (event) => {
        setDeposit(event.target.value);
    };

    function depositUSDC() {
        console.log("Depositing USDC: ", deposit);
        setIsDepositInReview(true);
    }

    function processDepositUSDC() {
        console.log("Process Depositing USDC: ", deposit);
        setDepositInProgress(true);
    }

  return (
    <>
      {/* <Button onClick={() => setIsDialogOpen(true)} className="bg-gray-900 text-white px-4 py-2 rounded-md">
        Open Deposit Dialog
      </Button> */}
      <Button className="text-[#70f7c9] border-[#70f7c9] ml-8 bg-[#0d0e12]" variant="outline" onClick={() => setIsDialogOpen(true)}>+ Make deposit</Button>


      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-[#17222c] p-6 rounded-lg w-[500px]">
          <DialogHeader className="flex justify-between items-center pb-4 border-b border-[#333]">
            <DialogTitle className="text-white text-2xl font-semibold">Deposit USDC on Avalanche</DialogTitle>
            <DialogTrigger asChild>
              <Button variant="ghost" className="text-white" onClick={() => setIsDialogOpen(false)}>
                <DoorClosedIcon className="w-6 h-6" />
              </Button>
            </DialogTrigger>
          </DialogHeader>
          <div className="py-4">
            <div className="flex justify-between items-center bg-[#121413] p-4 rounded-lg mb-4">
              <Input 
                type="number"
                value={deposit}
                onChange={handleChange}
                className="bg-transparent text-white placeholder-white w-full mr-1" 
                placeholder="0.00" />
              <div className="flex items-center mx-1">
                <CurrencyIcon className="text-[#777] w-5 h-5 mr-2" />
                <span className="text-[#777]">USD</span>
              </div>
            </div>
            <div className="mb-6">
              <h3 className="text-white mb-2">Estimated Network Fees</h3>
              <div className="flex justify-between text-white mb-1">
                <span>Deposit</span>
                <span>$0.12</span>
              </div>
              <div className="flex justify-between text-white">
                <span>Withdraw</span>
                <span>$0.07</span>
              </div>
            </div>
            {!isDepositInReview && (
                <Button 
                className="w-full text-[#70f7c9] border-[#70f7c9] bg-[#0d0e12] hover:bg-[#0d0e12] disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                onClick={depositUSDC}
                disabled={deposit == 0}
                >
                    Review Deposit
                </Button>
                )}
                { isDepositInReview && (
                    <Button 
                    className="w-full text-[#70f7c9] border-[#70f7c9] bg-[#0d0e12] hover:bg-[#0d0e12] disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                    onClick={processDepositUSDC}
                    disabled={depositInProgess}
                    >
                        Confirm Deposit
                    </Button>
                )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function ChevronDownIcon(props: React.JSX.IntrinsicAttributes & React.SVGProps<SVGSVGElement>) {
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
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}


function CurrencyIcon(props: React.JSX.IntrinsicAttributes & React.SVGProps<SVGSVGElement>) {
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


function DoorClosedIcon(props: React.JSX.IntrinsicAttributes & React.SVGProps<SVGSVGElement>) {
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
      <path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14" />
      <path d="M2 20h20" />
      <path d="M14 12v.01" />
    </svg>
  )
}