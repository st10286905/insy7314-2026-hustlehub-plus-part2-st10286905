#!/usr/bin/env bash
# Usage: ./rate-test.sh [login|register] [count]
# Override the base URL with: BASE_URL=http://localhost:5000/api ./rate-test.sh route endpoint count
# AI Disclosure: Claude wrote this and reminded me how to use my own cert https://claude.ai/share/0d638df2-eb8f-4562-9b72-b7b931eb154f

BASE_URL="${BASE_URL:-https://localhost:3000/api}"
ROUTE="${1:-auth}"
ENDPOINT="${2:-login}"
COUNT="${3:-18}"

if [ "$ENDPOINT" = "login" ]; then
  BODY='{"email":"admin@hustlehubplus.com","password":"notZapTestClient#2026"}'
else
  BODY='{"email":"newuser@hustlehubplus.com","password":"Password123!","name":"Test User", "role":"client"}'
fi

echo "Hitting $BASE_URL/$ROUTE/$ENDPOINT $COUNT times..."
for i in $(seq 1 "$COUNT"); do
  code=$(curl -s -o /dev/null -w "%{http_code}" \
    --cacert backend/secrets/localhost-cert.pem \
    -X POST "$BASE_URL/$ROUTE/$ENDPOINT" \
    -H "Content-Type: application/json" \
    -d "$BODY")
  echo "Request $i: HTTP $code"
done

echo
echo "Final response (headers + body):"

curl -si -X POST "$BASE_URL/$ROUTE/$ENDPOINT" \
  --cacert backend/secrets/localhost-cert.pem \
  -H "Content-Type: application/json" \
  -d "$BODY" | grep -iE "^HTTP|^ratelimit|retry-after|RATE_LIMIT|message"