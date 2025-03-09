# LaterLock

LaterLock is a Next.js application that allows users to lock content behind a time-delay mechanism. Users can store any text and only access it after a self-imposed waiting period.

## Features

- Create locks with any text content
- Set a custom time delay (1 minute to 1 week)
- Optional password protection with encryption
- Unique, permanent, anonymous URLs for each lock
- Countdown timer with cancel option
- Responsive UI with modern design

## Use Cases

- Self-imposed cooling-off periods before important decisions
- Time-delayed access to sensitive information
- Preventing impulsive actions by adding friction
- Creating suspense for creative reveals or announcements

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Database**: SQLite with Drizzle ORM
- **Authentication**: Password-based encryption with CryptoJS
- **Form Handling**: React Hook Form
- **State Management**: React Hooks

## Getting Started

1. Clone the repository
2. Install dependencies with `npm install`
3. Run the development server with `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## How It Works

1. A user provides any string into an input box
2. The user chooses how long of a delay to require
3. A password can optionally be provided for encryption
4. After submitting, the user is redirected to a unique URL
5. This URL allows the user to request access to their original input
6. If access is requested, a countdown timer begins according to their specified delay
7. The countdown can be canceled
8. At the end of the countdown, the content is unlocked and can be viewed

## Security

- When a password is provided, the content is encrypted using AES-256 with PBKDF2 key derivation (100,000 iterations)
- Encryption is performed client-side using CryptoJS
- Even with direct database access, encrypted content cannot be read without the password
- No identifying information is stored with the locked content

## License

MIT
