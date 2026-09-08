# ESDD Risk Console API

Backend for the ESDD Risk Rating module (ESG Commons), deployed at
`esdd.esgcommons.weflow.agency:8443` on the Hostinger VPS (`72.60.97.68`),
behind an Nginx block dedicated to this app (separate from the Mailcow
stack already running on that VPS, which owns ports 80/443).

## Deploy (on the VPS, as the `esdd` user)

```bash
cd /home/esdd
git clone <your-repo-url> esdd-backend
cd esdd-backend
npm install

cp .env.example .env
nano .env   # fill in DATABASE_URL password, JWT_SECRET, ANTHROPIC_API_KEY

npm run migrate
npm run seed   # interactive: creates your first Admin login

sudo npm install -g pm2   # if not already installed
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd   # follow the printed instructions once
```

Verify:
```bash
curl http://127.0.0.1:3000/health
curl -k https://esdd.esgcommons.weflow.agency:8443/health
```

## Future deploys

```bash
cd /home/esdd/esdd-backend
git pull
npm install
npm run migrate
pm2 restart esdd-api
```

## Roles
- **admin** - manage users, edit the checklist, see/edit every assessment
- **assessor** - create/edit their own draft assessments, submit for review
- **reviewer** - see all assessments, approve/reject submitted ones

## Known gaps (flag if you want these prioritized)
- No email delivery for new-user temp passwords (returned once in the API response)
- No password reset ("forgot password") flow
- No rate limiting on /auth/login
- Manual TLS cert renewal required before 2026-12-07 (DNS challenge, no auto-renew hook configured)
- Frontend still needs to be pointed at this API instead of window.storage
