# Seed Script — demo data

This script creates a demo teacher, two demo students (assigned to the teacher), and a few tasks for manual testing.

WARNING: The script clears the `users` and `tasks` collections in the configured database before inserting demo data. Do NOT run it against a production database.

How to run
1. Ensure you have a `.env` in `server/` with a correct `MONGO_URI` and other env values. For example:

```
MONGO_URI=mongodb+srv://...your-uri...
JWT_SECRET=your_jwt_secret
PORT=5000
```

2. Install dependencies (if not already done):

```powershell
cd server
npm install
```

3. Run the seed (PowerShell):

```powershell
cd server
npm run seed
```

Expected output
- The script prints created user emails, ids and the demo password (`password123`). Use these credentials to login via the API or client.

Security notes
- Do NOT commit your `.env` file with real credentials. `.gitignore` already includes `.env`.
- The demo password is intentionally simple for convenience. Rotate credentials or remove demo users after testing.

Resetting data
- Re-run the seed to reset demo data (it clears `users` and `tasks`).

If you want the seed to be safer (no destructive delete), I can add a flag to the script to skip deletion and only insert when collections are empty. Let me know which behavior you prefer.