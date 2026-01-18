# ⚔️ AI RPG - The Infinite Realm

> A Next.js-powered MMORPG where an AI Dungeon Master manages the world, narrates the story, and controls the game state in real-time.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.1-black)
![Prisma](https://img.shields.io/badge/Prisma-5.22-blue)

## 📖 Overview

**AI RPG** is a multiplayer role-playing game where the narrative and game logic are driven by Large Language Models (LLMs). Unlike traditional RPGs with pre-scripted events, potential storylines here are limitless.

Users can create unique characters, join public lobbies with other players, and embark on adventures where their actions—spoken in natural language—are interpreted by an AI Dungeon Master. The AI not only narrates the outcome but also manages complex RPG statistics like Health (HP), Experience (XP), and Status Effects (e.g., Poisoned, Blessed) by executing database commands behind the scenes.

## ✨ Features

### 🎮 Gameplay Immsersion
- **AI Dungeon Master**: A sophisticated AI (powered by Grok, OpenAI, or Ollama) acts as the logic engine, narrating the story and arbitrating rules.
- **Natural Language Input**: Do anything you can describe. "I swing my sword at the goblin," "I try to persuade the guard," or "I cast a fireball."
- **Real-Time State Management**: The AI automatically updates player stats (HP, Inventory, Status Effects) based on the narrative.
- **Party System**: Multiplayer support allows groups of players to join the same game session and adventure together.
- **Friends List**: Add allies by email, manage pending requests, and keep track of your companions.
- **Party Chat**: Real-time Out-Of-Character (OOC) chat for strategizing with your party or asking the DM questions directly.

### 🛠 Core Systems
- **Character Creation**: Choose from various classes (Warrior, Mage, Rogue, Cleric) with generated stats.
- **Public Lobbies**: Browse and join active games from the new **Multiplayer Lobby**.
- **Dashboard**: Central hub to manage your characters, friends, and active campaigns.
- **Theming System**: Integrated theme switcher with presets including *Default*, *Cyberpunk*, *Fantasy*, and *Dark*.

### 🏗 Technical Highlights
- **Optimistic UI**: Chat interface updates instantly while the AI processes the turn.
- **Polling Sync**: Automatic game state synchronization ensures all party members see the same messages and health bars.
- **Secure Auth**: Full user authentication system using NextAuth.js.
- **Robust Database**: Relational data modeling with Prisma (SQLite for dev) for Users, Games, Characters, Messages, and Friendships.

## 🚀 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [SQLite](https://www.sqlite.org/) (via Prisma ORM)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **AI Integration**: Custom implementation supporting OpenAI-compatible APIs (xAI/Grok, OpenAI, Ollama).

## 🛠 System Requirements

- **Node.js**: Version 18.17 or higher (LTS recommended)
- **Package Manager**: npm (v9+) or yarn
- **RAM**: Minimum 1GB free (2GB+ recommended for building)
- **Disk Space**: ~500MB

## 🚀 Deployment & Installation

Follow these steps to deploy the AI RPG on a new server (Ubuntu/Linux recommended).

### 1. Preparation
Ensure your server has Node.js installed.
```bash
# Check node version
node -v
# Should be v18.17.0 or higher
```

### 2. Installation

Clone the repository and install dependencies:
```bash
git clone https://github.com/lord3nd3r/AI-RPG.git
cd ai-rpg
npm install
```

### 3. Configuration

Create your production environment configuration:
```bash
cp .env.example .env
nano .env
```

**Required Environment Variables:**

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Connection string for database | `"file:./dev.db"` (SQLite) or Postgres URL |
| `NEXTAUTH_URL` | The canonical URL of your site | `http://your-server-ip:3000` or `https://example.com` |
| `NEXTAUTH_SECRET` | Random string for session encryption | Run `openssl rand -base64 32` to generate |
| `GROK_API_KEY` | xAI API Key (Recommended) | `xai-...` |
| `OPENAI_API_KEY` | OpenAI API Key (Optional) | `sk-...` |

### 4. Database Setup

Initialize the database schema:
```bash
# For SQLite (easiest for small servers):
npx prisma migrate deploy

# For Production Postgres/MySQL (Update DATABASE_URL first):
# npx prisma migrate deploy
```

### 5. Build for Production

Compile the application. This optimizes assets and ensures code validity.
```bash
npm run build
```

### 6. Run the Server

**Option A: Simple Start (Testing)**
```bash
npm start
# App checks for port 3000 by default.
```

**Option B: Using PM2 (Recommended for 24/7 Uptime)**
Install PM2 globally to manage the process:
```bash
npm install -g pm2
pm2 start npm --name "ai-rpg" -- start
pm2 save
pm2 startup
```

## 🔧 Troubleshooting

- **Port Conflicts**: If port 3000 is in use, Next.js typically tries 3001+. You can force a port:
  ```bash
  PORT=4000 npm start
  ```
- **Database Locks**: If using SQLite, ensure the process has write permissions to `dev.db` and the `prisma` folder.
- **Build Errors**: Clear cache if builds fail:
  ```bash
  rm -rf .next
  npm run build
  ```

## 🛠 Local Development (Getting Started)

If you just want to contribute code:

1. **Clone & Install**: `git clone ... && npm install`
2. **Setup Env**: Copy `.env.example` to `.env`
3. **Run Dev Server**:
   ```bash
   npm run dev
   ```
   > 1. Find your local IP (e.g., `192.168.1.X`).
   > 2. Have friends visit `http://YOUR_LOCAL_IP:3000`.
   > 3. Note: Without HTTPS, the "Invite Link" button may use a fallback prompt instead of the clipboard.

## 🎲 Implementation Details

### The AI Loop
The core game loop resides in `app/api/games/[id]/chat/route.ts`:
1. **Input**: Player sends a message.
2. **Context**: Server fetches recent chat history and current character sheets.
3. **Prompting**: System constructs a prompt telling the AI it is a DM and **must** output JSON for state changes.
4. **Execution**:
   - The AI returns narrative text + a JSON block (e.g., `{ "hpChange": -10 }`).
   - Server parses the JSON and executes Prisma updates.
   - Server saves the narrative text to the database.
5. **Update**: Clients poll for new messages and stat changes.

### DM Validation & Tests ✅
To make the game loop more robust, DM-structured JSON is now validated before being applied to the database:

- A zod schema lives at `lib/validators/dm.ts` (`DMUpdateSchema`) and verifies the `updates` array structure.
- There's a lightweight test script to exercise the parser and validator at `scripts/test-dm-parse.ts`.
- Run it locally with:

```bash
npm run test:dm
# (uses `npx tsx scripts/test-dm-parse.ts` under the hood)
```

This helps catch malformed DM output early and prevents accidental DB mutations when the AI response cannot be parsed.

### AI Retry & Fallback 🚨
AI provider calls now use a retry wrapper with exponential backoff (`generateAIResponseWithRetries` in `lib/ai.ts`). If the AI provider repeatedly fails, the server saves a friendly fallback assistant message ("The Dungeon Master is unavailable right now...") instead of erroring out. This improves resilience to temporary API outages.

### Folder Structure
```
├── app/
│   ├── api/            # API Routes (Game logic, Auth, AI)
│   ├── games/          # Game Interface & Creation
│   ├── lobby/          # Multiplayer Lobby
│   ├── dashboard/      # User Hub
│   ├── layout.tsx      # Root Layout & Providers
│   └── globals.css     # Global Styles & Theme Variables
├── components/         # Reusable UI Components
├── lib/
│   ├── ai.ts           # AI Provider Abstraction
│   ├── auth.ts         # NextAuth Configuration
│   └── prisma.ts       # DB Client Singleton
├── prisma/
│   ├── schema.prisma   # Database Schema
│   └── migrations/     # SQL Migrations
└── types/              # TypeScript Definitions
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

*Built with ❤️ by Ender*
