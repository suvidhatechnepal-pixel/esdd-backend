# ESDD Risk Console API

Backend for the ESDD Risk Rating module (ESG Commons), deployed at
`esdd.esgcommons.weflow.agency`, running on the `esdd` user on the Hostinger VPS
(`72.60.97.68`), behind the Nginx block + certbot cert set up in Step 2.

## Prerequisites (should already be done from Steps 2.1-2.6)
- `esdd` Linux user created
- Node.js 20 installed
- PostgreSQL installed, with a database + user created (see below)
- Nginx server block for this subdomain, proxying to `127.0.0.1:3000`
- TLS certificate issued via certbot
- PM2 installed globally

## First-time deploy

```bash
# as the esdd user, in /home/esdd
git clone <your-repo-url> esdd-backend
cd esdd-backend
npm install

cp .env.example .env
nano .env   # fill in DATABASE_URL password, JWT_SECRET, ANTHROPIC_API_KEY, CORS_ORIGIN

npm run migrate   # creates the tables
npm run seed       # loads the default checklist + creates your first Admin user (interactive)

pm2 start ecosystem.config.js
pm2 save            # persists the process list so `pm2 startup` brings it back after reboot
```

Check it's alive:
```bash
curl http://127.0.0.1:3000/health
# {"ok":true,"service":"esdd-risk-console-api"}
```

Then from anywhere:
```bash
curl https://esdd.esgcommons.weflow.agency/health
```

## Generating secrets

```bash
openssl rand -hex 32   # use this for JWT_SECRET
```

## Every future deploy (after a git push)

```bash
cd /home/esdd/esdd-backend
git pull
npm install          # only needed if package.json changed
npm run migrate      # safe to run every time - schema.sql uses IF NOT EXISTS
pm2 restart esdd-api
```

This is exactly what a GitHub Actions workflow can automate later (SSH in, run
these four lines) so a `git push` alone redeploys.

## API shape (for the frontend to call)

- `POST /auth/login` -> `{ token, mustResetPassword, user }`
- `POST /auth/change-password` (auth required)
- `GET /auth/me` (auth required)
- `GET /users`, `POST /users`, `PATCH /users/:id` (admin only)
- `GET /checklist`, `PUT /checklist` (admin only to edit)
- `GET /assessments`, `POST /assessments`, `GET/PATCH/DELETE /assessments/:id`
- `POST /assessments/:id/submit` - assessor locks + escalates for review
- `POST /assessments/:id/review` - admin/reviewer approves or rejects
- `POST /assessments/:id/draft-summary` - server-side AI draft of the Annex 7 summary

All routes except `/auth/login` and `/health` require `Authorization: Bearer <token>`.

## Roles

- **admin** - manage users, edit the checklist, see/edit every assessment
- **assessor** - create/edit their own draft assessments, submit for review
- **reviewer** - see all assessments, approve/reject submitted ones (cannot edit the checklist or manage users)

## Not done yet (known gaps, by design - flag if you want these prioritized)

- No email delivery for new-user temp passwords (returned once in the API response for the admin to relay manually)
- No password reset ("forgot password") flow yet
- No rate limiting on `/auth/login`
- Frontend (the HTML console) still needs to be pointed at this API instead of `window.storage`
