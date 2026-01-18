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

### 🛠 Core Systems
- **Character Creation**: Choose from various classes (Warrior, Mage, Rogue, Cleric) with generated stats.
- **Public Lobbies**: Browse and join active games from the new **Multiplayer Lobby**.
- **Dashboard**: Central hub to manage your characters and active campaigns.
- **Theming System**: Integrated theme switcher with presets including *Default*, *Cyberpunk*, *Fantasy*, and *Dark*.

### 🏗 Technical Highlights
- **Optimistic UI**: Chat interface updates instantly while the AI processes the turn.
- **Polling Sync**: Automatic game state synchronization ensures all party members see the same messages and health bars.
- **Secure Auth**: Full user authentication system using NextAuth.js.
- **Robust Database**: Relational data modeling with Prisma (SQLite for dev) for Users, Games, Characters, and Message History.

## 🚀 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [SQLite](https://www.sqlite.org/) (via Prisma ORM)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **AI Integration**: Custom implementation supporting OpenAI-compatible APIs (xAI/Grok, OpenAI, Ollama).

## 🛠 Getting Started

### Prerequisites
- Node.js 18.17 or later
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/lord3nd3r/AI-RPG.git
   cd ai-rpg
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```
   
   Update it with your secrets:
   ```env
   # Database
   DATABASE_URL="file:./dev.db"

   # Auth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-super-secret-key-here"

   # AI Providers (At least one required)
   XAI_API_KEY="your-grok-api-key"
   OPENAI_API_KEY="your-openai-api-key"
   ```

4. **Initialize Database**
   Push the schema to your local SQLite database:
   ```bash
   npx prisma migrate dev
   ```

5. **Run the Development Server**
   ```bash
   npm run dev
   ```

   Visit [http://localhost:3000](http://localhost:3000) to enter the realm.

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
