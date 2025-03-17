# LaterLock

LaterLock is a simple Next.js application that allows securely storing text behind a time lock.

## How does it work?

1. Enter any text you want to lock away temporarily.
1. Set the unlock delay. This is how long it will take to unlock the content after you request it.
1. Optionally encrypt with a password.
1. Bookmark the unique link to get back to it later.
1. To access it again, request unlock and wait for the delay.

## Is it secure?

When a password is provided, data is encrypted in the browser. Otherwise, it's encrypted on the server with a system-wide key plus salt. Then the sqlite database is encrypted at the page level using SQLCipher.

Content encryption is done using AES-256-GCM and PBKDF2 with HMAC-SHA-256 (600,000 iterations) for key derivation, similar to the encryption used by password managers.

The unique URL to the lock page uses a nanoid (which uses secure RNG) with 30 characters, which is overkill.

## Tools

- Next.js 15, shadcn/ui, Tailwind CSS
- libsql with Drizzle ORM

## License

MIT
