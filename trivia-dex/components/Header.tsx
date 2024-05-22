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
        <h1 className="text-5xl ml-8">Trivia</h1>
        { !isConnected && (
          <Button className="text-[#70f7c9] border-[#70f7c9] mr-8" variant="outline" onClick={openConnectModal}>
            Connect Wallet
          </Button>
        )}
          { isConnected && (
          <div className="mx-8">
            <ConnectButton />
          </div>
        )}
    </header>
    );
}
