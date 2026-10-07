# Equilibrium

Equilibrium helps you turn a personal goal into a shared commitment. Set a measurable target, find someone working toward a similar goal, and keep each other moving with progress check-ins and messages.

## What you can do

- Create goals with a category, target, unit, and optional deadline.
- Browse and filter goals that are looking for an accountability partner.
- Send and respond to partnership requests.
- Record progress check-ins, follow streaks, and review your activity.
- Message your partner and keep track of notifications.

## Built with

- Next.js 15 and React 19
- TypeScript and Tailwind CSS 4
- TanStack Query
- SQLite via `better-sqlite3`
- `iron-session` for cookie-based sessions

## Run locally

You'll need Node.js 20 or later and npm.

```bash
git clone https://github.com/cybershaykh/equilibrium.git
cd equilibrium
npm ci
```

Set a session secret in a local `.env.local` file. Generate a strong value with:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Then put the generated value in `.env.local`:

```dotenv
IRON_SESSION_SECRET=your-generated-value
```

Environment files are ignored by Git. The app currently has a built-in development fallback, but do not rely on it for a deployed environment.

To load the sample users, goals, check-ins, and conversation, run the seed script before starting the app:

```bash
npm run seed
```

The seed script only populates an empty database; it skips seeding if users already exist. It creates these demo accounts, all with the password `password123`:

| Email | Name |
| --- | --- |
| `demo@equilibrium.app` | Alex Morgan |
| `sam@equilibrium.app` | Sam Rivera |
| `priya@equilibrium.app` | Priya Nair |
| `leo@equilibrium.app` | Leo Kim |

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You can also create your own account in the app.

## Useful commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run lint` | Run ESLint |
| `npm run build` | Create a production build |
| `npm run start` | Serve a production build |
| `npm run seed` | Add sample data to an empty local database |

## Data and deployment

The app creates its SQLite database at `data/equilibrium.db` when it first needs it. The database and its SQLite journal files are local runtime data and are intentionally excluded from Git. The seed script can recreate sample data.

Because the database is stored on the local filesystem, deploy this version only to a Node.js host with a writable, persistent disk. Ephemeral or serverless filesystems can lose data between instances or restarts. Configure a unique `IRON_SESSION_SECRET` in the deployment environment, and do not use the published demo accounts for real data.
