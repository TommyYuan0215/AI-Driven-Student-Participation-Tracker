# Place your TLS certificate and private key here:
#
#   cert.pem  — full-chain certificate (e.g. from mkcert or your homelab CA)
#   key.pem   — private key
#
# Generate with mkcert (recommended for internal/homelab domains):
#   mkcert apps.homelab1367.internal
#   mv apps.homelab1367.internal.pem     nginx/certs/cert.pem
#   mv apps.homelab1367.internal-key.pem nginx/certs/key.pem
#
# This folder is intentionally git-ignored (see .gitignore).
# Only this README is committed — never commit actual cert/key files.
