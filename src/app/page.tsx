import Link from "next/link";
import CreateLockForm from "@/components/CreateLockForm";
import LockIcon from "@/components/LockIcon";

export default function Home() {
  return (
    <main className="flex flex-col items-center pt-16 px-4 md:px-8">
      <div className="max-w-3xl w-full space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-6xl lg:text-8xl font-extrabold flex items-center justify-center">
            <LockIcon />
            <span className="bg-gradient-to-r text-transparent bg-clip-text from-[#37beb0] to-[#29A0B1]">LaterLock</span>
          </h1>
          <div className="text-2xl lg:text-3xl text-muted-foreground">
            <p>Store any text securely behind a time lock</p>
          </div>
        </div>

        <div className="p-6 rounded-md bg-background">
          <div>
            <CreateLockForm />
          </div>
        </div>

        <p className="text-center text-muted-foreground">LaterLock is free and open source. <Link href="https://github.com/bit-ray/laterlock" className="underline">View the source code on GitHub</Link>.</p>

        <div className="space-y-6">
          <div className="text-muted-foreground">
            <h2 className="text-3xl font-medium mb-2">How does this work?</h2>
            <ol className="space-y-2 list-decimal pl-5">
              <li>Enter any text you want to lock away temporarily.</li>
              <li>Set the unlock delay. This is how long it will take to unlock the content after you request it.</li>
              <li>Optionally encrypt with a password.</li>
              <li>Bookmark the unique link to get back to it later.</li>
              <li>To access it again, request unlock and wait for the delay.</li>
            </ol>
          </div>

          <div className="text-muted-foreground space-y-2">
            <h2 className="text-3xl font-medium">Is it secure?</h2>
            <p>All data is encrypted. If you set a password, it&apos;s encrypted in your browser before it&apos;s sent to us. So if you lose the password, there is no way for anyone to recover the content.</p>
            <p>If you don&apos;t set a password, we still encrypt it on the server with a system-wide key.</p>
            <p>We use AES-256-GCM encryption and PBKDF2 with HMAC-SHA-256 (600,000 iterations) for key derivation, either from your password or a system-wide key, plus a random salt. This is similar to the encryption used by password managers.</p>
            <p>The unique URL to the lock page has 180 bits of entropy using cryptographically secure random number generation.</p>
          </div>

          <div className="text-muted-foreground space-y-2">
            <h2 className="text-3xl font-medium">What would I use this for?</h2>
            <p>Up to you! Here are some ideas:</p>
            <ul className="space-y-2 list-disc pl-5">
              <li>
                Help self-control by password-locking device screen time or content controls and storing the password (or part of it) in LaterLock
              </li>
              <li>
                Store emergency recovery codes you can share
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
} 