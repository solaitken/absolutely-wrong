#!/bin/bash
set -e

echo "=== Fixing absolutely-wrong scaffold ==="

# 1. Fix Caddy log ownership
echo "--- Fixing Caddy log ---"
if [ -f /var/log/caddy/proj-absolutely-wrong.access.log ]; then
    chown caddy:caddy /var/log/caddy/proj-absolutely-wrong.access.log
    echo "chown done"
else
    echo "log file not found, skipping"
fi

# Reload Caddy
systemctl reload caddy 2>&1 || echo "caddy reload failed (may be ok if not running)"
echo "caddy reload done"

# 2. Check gh auth
echo "--- GH auth ---"
export GH_TOKEN=$(python3 -c "
import yaml, os
with open(os.path.expanduser('~/.config/gh/hosts.yml')) as f:
    cfg = yaml.safe_load(f)
token = cfg.get('github.com', {}).get('oauth_token', '')
print(token)
" 2>/dev/null || echo "")

if [ -z "$GH_TOKEN" ]; then
    echo "FATAL: Could not extract OAuth token from gh hosts.yml"
    exit 1
fi
echo "Got GH token: ${GH_TOKEN:0:10}..."

# 3. Create GitHub repo (public)
echo "--- Creating GitHub repo ---"
gh repo create solaitken/absolutely-wrong --public --description "A parody chat app where AI always confidently disagrees with you" 2>&1 || echo "repo may already exist, continuing"
echo "repo creation done"

# 4. Generate deploy key
echo "--- Generating deploy key ---"
ssh-keygen -t ed25519 -f /tmp/deploy-key-absolutely-wrong -N "" -C "deploy-absolutely-wrong" 2>&1
echo "key generated"

DEPLOY_KEY=$(cat /tmp/deploy-key-absolutely-wrong)
DEPLOY_KEY_PUB=$(cat /tmp/deploy-key-absolutely-wrong.pub)

# 5. Install public key
echo "--- Installing public key ---"
mkdir -p /srv/projects/absolutely-wrong/.ssh
AUTH_KEYS="/srv/projects/absolutely-wrong/.ssh/authorized_keys"
echo "command=\"/usr/local/bin/platform-deploy absolutely-wrong\",no-port-forwarding,no-X11-forwarding,no-agent-forwarding,no-pty $DEPLOY_KEY_PUB" > "$AUTH_KEYS"
chown -R proj-absolutely-wrong:proj-absolutely-wrong /srv/projects/absolutely-wrong/.ssh
chmod 700 /srv/projects/absolutely-wrong/.ssh
chmod 600 "$AUTH_KEYS"
echo "authorized_keys installed"

# 6. Get hostname
HOSTNAME=$(hostname -f 2>/dev/null || hostname)
echo "Hostname: $HOSTNAME"

# 7. Set GitHub secrets
echo "--- Setting GitHub secrets ---"
gh secret set DEPLOY_SSH_KEY -b"$DEPLOY_KEY" -R solaitken/absolutely-wrong 2>&1 || echo "secret DEPLOY_SSH_KEY failed"
gh secret set DEPLOY_USER -b"proj-absolutely-wrong" -R solaitken/absolutely-wrong 2>&1 || echo "secret DEPLOY_USER failed"
gh secret set DEPLOY_HOST -b"$HOSTNAME" -R solaitken/absolutely-wrong 2>&1 || echo "secret DEPLOY_HOST failed"
echo "secrets configured"

# 8. Init git
echo "--- Initializing git ---"
cd /srv/projects/absolutely-wrong
git init
git config user.email "solaitken@github.com"
git config user.name "solaitken"
git remote add origin "git@github.com:solaitken/absolutely-wrong.git" 2>&1 || echo "remote may already exist"
echo "git initialized"

# 9. Create dirs and .gitignore
mkdir -p frontend backend
cat > .gitignore << 'GITIGNORE'
node_modules/
dist/
.env
*.log
.DS_Store
GITIGNORE

echo "=== SCAFFOLD COMPLETE ==="
