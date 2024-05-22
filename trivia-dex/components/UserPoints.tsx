import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link"

export default function UserPointsComponent() {
  return (
    <div className="flex justify-end items-center p-2 full-width">
      <Button className="text-[#70f7c9] border-[#70f7c9] right-0" variant="outline" disabled>
        0 point
      </Button>
    </div>
  );
}