import Link from "next/link";
import LockIcon from "@/components/LockIcon";

export function LockPageHeader() {
  return (
    <div className="mb-6 text-center">
      <Link href="/">
        <h1 className="text-4xl lg:text-6xl font-extrabold text-primary hover:opacity-80 transition-opacity flex items-center justify-center">
          <LockIcon />
          <span className="bg-gradient-to-r text-transparent bg-clip-text from-[#37beb0] to-[#29A0B1]">LaterLock</span>
        </h1>
      </Link>
    </div>
  );
} 