# AIA Token Monitor

This project monitors the AIA token balance changes for specific Sui addresses.

## Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Run the development server:
   ```bash
   pnpm dev
   ```

3. Open [http://localhost:3000/monitor](http://localhost:3000/monitor) in your browser.

## Features

- Real-time monitoring of AIA token balances on Sui Mainnet.
- Compares current balance against initial values (from your screenshot) or previous checks.
- Highlights changes with visual indicators.
- Auto-refreshes every 30 seconds.

## Tech Stack

- Next.js 15 (App Router)
- TailwindCSS
- shadcn/ui
- @mysten/sui (Sui SDK)
