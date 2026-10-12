#!/usr/bin/env bash
# Usage: ./rate-test.sh [login|register] [count]
# Override the base URL with: BASE_URL=http://localhost:5000/api/auth ./rate-test.sh
# AI Disclosure: Claude wrote this and reminded me how to use my own cert https://claude.ai/share/0d638df2-eb8f-4562-9b72-b7b931eb154f

BASE_URL="${BASE_URL:-https://localhost:3000/api/auth}"
ENDPOINT="${1:-login}"
COUNT="${2:-12}"

if [ "$ENDPOINT" = "login" ]; then
  BODY='{"email":"test@example.com","password":"WrongPassword123!"}'
else
  BODY='{"email":"test@example.com","password":"Password123!","name":"Test User"}'
fi

echo "Hitting $BASE_URL/$ENDPOINT $COUNT times..."
for i in $(seq 1 "$COUNT"); do
  code=$(curl -s -o /dev/null -w "%{http_code}" \
    --cacert backend/secrets/localhost-cert.pem \
    -X POST "$BASE_URL/$ENDPOINT" \
    -H "Content-Type: application/json" \
    -d "$BODY")
  echo "Request $i: HTTP $code"
done

echo
echo "Final response (headers + body):"
curl -si -X POST "$BASE_URL/$ENDPOINT" \
   --cacert backend/secrets/localhost-cert.pem \
  -H "Content-Type: application/json" \
  -d "$BODY" | grep -iE "^HTTP|^ratelimit|retry-after|RATE_LIMIT|message"