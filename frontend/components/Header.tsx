"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link"
import { ConnectButton, useConnectModal} from '@rainbow-me/rainbowkit';
import { useAccount } from "wagmi";

export default function HeaderComponent() {

  const { isConnected, address } = useAccount();
  const { openConnectModal } = useConnectModal();

  return (
    <header className="absolute top-0 left-0 right-0 flex justify-between items-center p-4">
          {/* <Link href="/">
            <h1 className="text-5xl ml-8">Trivia Scholar</h1>
          </Link>  */}
          <Link className="flex items-center gap-2 ml-8" href="/">
            <Image src={"/logo.png"} alt="Trivia" height={50} width={60} />
            <span className="font-semibold text-3xl ml-1">Trivia Scholar</span>
          </Link>

          { isConnected && (
          <nav className="hidden md:flex mt-6">
            <Link className="text-gray-300 hover:text-white text-2xl mx-4" href="#">
              Quiz
            </Link>
            <Link className="text-gray-300 hover:text-white text-2xl mx-4" href="/dashboard">
              Prize
            </Link>
            <Link className="text-gray-300 hover:text-white text-2xl mx-4" href="#">
              Account
            </Link>
          </nav>          
          )}
          { !isConnected && (
            <Button className="text-[#70f7c9] border-[#70f7c9] mr-8  mt-6" variant="outline" onClick={openConnectModal}>
              Connect Wallet
            </Button>
          )}
            { isConnected && (
            <div className="mr-8  mt-6">
              <ConnectButton />
            </div>
          )}
    </header>
    );
}


