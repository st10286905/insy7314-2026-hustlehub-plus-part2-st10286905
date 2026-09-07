#!/usr/bin/env bash

# AI Disclosure: based on postman collection and ported by https://share.gemini.google/FxpGj6jgOALG

set -uo pipefail

PROJECT_DIR="$(cd -- "$(dirname -- "$0")" && pwd)/.."
cd "$PROJECT_DIR"

./scripts/init.sh

export $(grep -v '^#' .env | xargs)

BASE_URL="https://localhost:${PORT}"
if [[ "${USE_HTTPS:-false}" != "true" ]]; then
    BASE_URL="http://localhost:${PORT}"
fi

SERVER_CMD="${SERVER_CMD:-node src/server.js}"
SERVER_LOG="$(mktemp /tmp/hustlehub_server_XXXXXX.log)"
TIMESTAMP=$(date +%s)
TEST_EMAIL="test_${TIMESTAMP}@hustlehub.co.za"
HTTP_TEST_EMAIL="test_http_${TIMESTAMP}@hustlehub.co.za"
PASSWORD="SecurePassword123!"

GREEN="\033[0;32m"
RED="\033[0;31m"
CYAN="\033[0;36m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
BOLD="\033[1m"
DIM="\033[2m"
NC="\033[0m"
DIVIDER="------------------------------------------------------------"

PASSED=0
FAILED=0
TEST_INDEX=0
LAST_BODY=""
SERVER_PID=""
HTTP_SERVER_PID=""
HTTP_BASE_URL=""

declare -a TEST_TITLES=()
declare -a TEST_STATUSES=()
declare -a TEST_DETAILS=()

cleanup() {
    local exit_code=$?
    if [[ $exit_code -ne 0 && -f "$SERVER_LOG" ]]; then
        echo -e "\n${RED}${BOLD}Server Log Output on Failure:${NC}"
        cat "$SERVER_LOG"
    fi
    if [[ -n "${HTTP_SERVER_PID:-}" ]] && kill -0 "$HTTP_SERVER_PID" 2>/dev/null; then
        kill "$HTTP_SERVER_PID" 2>/dev/null || true
        wait "$HTTP_SERVER_PID" 2>/dev/null || true
    fi
    if [[ -n "${SERVER_PID:-}" ]] && kill -0 "$SERVER_PID" 2>/dev/null; then
        echo -e "\n${BOLD}Shutting down server (PID: ${SERVER_PID})...${NC}"
        pkill -P "$SERVER_PID" 2>/dev/null || true
        kill "$SERVER_PID" 2>/dev/null || true
        wait "$SERVER_PID" 2>/dev/null || true
    fi
    rm -f "$SERVER_LOG"
    exit "$exit_code"
}

trap cleanup EXIT INT TERM

locurl() {
    if [[ "${USE_HTTPS:-false}" != "true" ]]; then
        curl "$@"
    else
        curl --cacert "$SSL_CERT_PATH" "$@"
    fi
}

echo -e "${BOLD}Starting server: \`${SERVER_CMD}\`${NC}"
$SERVER_CMD > "$SERVER_LOG" 2>&1 &
SERVER_PID=$!

echo -n "Waiting for server to accept connections at ${BASE_URL}"
MAX_WAIT_SECONDS=30
ELAPSED=0

until locurl -s "$BASE_URL" > /dev/null 2>&1 || [[ $ELAPSED -ge $MAX_WAIT_SECONDS ]]; do
    if ! kill -0 "$SERVER_PID" 2>/dev/null; then
        echo -e " ${RED}[FAILED]${NC}\nServer process died unexpectedly. Log output:"
        cat "$SERVER_LOG"
        exit 1
    fi
    sleep 1
    ((ELAPSED++))
    echo -n "."
done

if [[ $ELAPSED -ge $MAX_WAIT_SECONDS ]]; then
    echo -e " ${RED}[TIMED OUT]${NC}\nServer did not respond within ${MAX_WAIT_SECONDS}s. Log output:"
    cat "$SERVER_LOG"
    exit 1
fi
echo -e " ${GREEN}[READY]${NC} (PID: ${SERVER_PID})\n"

HTTP_BASE_URL="$BASE_URL"
if [[ "${USE_HTTPS:-false}" == "true" ]]; then
    HTTP_PORT=$((PORT + 1))
    node -e "
      const http = require('http');
      const app = require('./src/app');
      const server = http.createServer(app);
      server.listen($HTTP_PORT, '127.0.0.1', () => {});
    " > /dev/null 2>&1 &
    HTTP_SERVER_PID=$!
    HTTP_BASE_URL="http://127.0.0.1:${HTTP_PORT}"
    for _ in {1..30}; do
        if curl -s "$HTTP_BASE_URL/api/auth/me" > /dev/null 2>&1; then
            break
        fi
        sleep 0.1
    done
fi

format_body() {
    local content="$1"
    local indent="    "
    if echo "$content" | jq . >/dev/null 2>&1; then
        echo "$content" | jq . | sed "s/^/${indent}/"
    elif [[ -n "$content" ]]; then
        echo "$content" | sed "s/^/${indent}/"
    else
        echo -e "${indent}${DIM}(empty)${NC}"
    fi
}

assert_request() {
    ((TEST_INDEX++))
    local title="$1"
    local expected_status="$2"
    local method="$3"
    local path="$4"
    local payload="${5:-}"
    local auth_header="${6:-}"
    local jq_filter="${7:-}"
    local target_base="${8:-$BASE_URL}"
    local full_url="${target_base}${path}"

    TEST_TITLES+=("$title")
    echo -e "${BOLD}${BLUE}${DIVIDER}${NC}"
    echo -e "${BOLD}Test ${TEST_INDEX}: ${title}${NC}"
    echo -e "${BOLD}${BLUE}${DIVIDER}${NC}"

    echo -e "${CYAN}${BOLD}> REQUEST${NC}"
    echo -e "  ${BOLD}Endpoint:${NC} ${method} ${full_url}"
    echo -e "  ${BOLD}Headers:${NC}  Content-Type: application/json"
    if [[ -n "$auth_header" ]]; then
        echo -e "            Authorization: ${auth_header}"
    fi
    if [[ -n "$payload" ]]; then
        echo -e "  ${BOLD}Payload:${NC}"
        format_body "$payload"
    fi

    local headers=(-H "Content-Type: application/json")
    if [[ -n "$auth_header" ]]; then
        headers+=(-H "Authorization: ${auth_header}")
    fi

    local raw_output
    local curl_tool="locurl"
    if [[ "$full_url" =~ ^http:// ]]; then
        curl_tool="curl"
    fi

    if [[ -n "$payload" ]]; then
        raw_output=$($curl_tool -s -w "\n%{http_code}" -X "$method" "$full_url" "${headers[@]}" -d "$payload")
    else
        raw_output=$($curl_tool -s -w "\n%{http_code}" -X "$method" "$full_url" "${headers[@]}")
    fi

    local status_code
    status_code=$(tail -n 1 <<< "$raw_output")
    local body
    body=$(sed '$ d' <<< "$raw_output")
    LAST_BODY="$body"

    echo -e "\n${YELLOW}${BOLD}< RESPONSE${NC}"
    echo -e "  ${BOLD}HTTP Status:${NC} ${status_code}"
    echo -e "  ${BOLD}Body:${NC}"
    format_body "$body"

    local error_msg=""
    if [[ "$status_code" -ne "$expected_status" ]]; then
        error_msg="Expected HTTP ${expected_status}, received ${status_code}"
    elif [[ -n "$jq_filter" ]]; then
        if ! echo "$body" | jq -e "$jq_filter" > /dev/null 2>&1; then
            error_msg="Assertion failed for filter: ${jq_filter}"
        fi
    fi

    echo ""
    if [[ -z "$error_msg" ]]; then
        echo -e "  ${GREEN}${BOLD}  PASS${NC} (HTTP ${status_code} matched expected ${expected_status})"
        TEST_STATUSES+=("PASS")
        TEST_DETAILS+=("HTTP ${status_code}")
        ((PASSED++))
    else
        echo -e "  ${RED}${BOLD}  FAIL${NC} (${error_msg})"
        TEST_STATUSES+=("FAIL")
        TEST_DETAILS+=("${error_msg}")
        ((FAILED++))
    fi
    echo ""
}

echo -e "${BOLD}--- Starting Integration Test Suite ---${NC}\n"

# Test 1: Register - Invalid Email
INVALID_EMAIL_PAYLOAD=$(jq -n \
        --arg password "$PASSWORD" \
    '{email: "not-an-email", password: $password, role: "freelancer"}')
assert_request \
    "Reject registration with invalid email (Register - Invalid Email)" \
    400 \
    "POST" \
    "/api/auth/register" \
    "$INVALID_EMAIL_PAYLOAD" \
    "" \
    '.error.code == "VALIDATION_ERROR" and (.error.details | any(.field == "email"))'

# Test 2: Register - Weak Password
WEAK_PASSWORD_PAYLOAD=$(jq -n \
        --arg email "$TEST_EMAIL" \
    '{email: $email, password: "123", role: "freelancer"}')
assert_request \
    "Reject registration with weak password (Register - Weak Password)" \
    400 \
    "POST" \
    "/api/auth/register" \
    "$WEAK_PASSWORD_PAYLOAD" \
    "" \
    '.error.code == "VALIDATION_ERROR" and (.error.details | any(.field == "password"))'

# Test 3: Register - Missing Email
MISSING_EMAIL_PAYLOAD=$(jq -n \
        --arg password "$PASSWORD" \
    '{password: $password, role: "freelancer"}')
assert_request \
    "Reject registration with missing email (Register - Missing Email)" \
    400 \
    "POST" \
    "/api/auth/register" \
    "$MISSING_EMAIL_PAYLOAD" \
    "" \
    '.error.code == "VALIDATION_ERROR" and (.error.details | any(.field == "email" and .message == "Email is required"))'

# Test 4: Register - Unknown Field
UNKNOWN_FIELD_PAYLOAD=$(jq -n \
        --arg email "$TEST_EMAIL" \
        --arg password "$PASSWORD" \
        --arg role "freelancer" \
    '{email: $email, password: $password, role: $role, username: "not-allowed"}')
assert_request \
    "Reject registration with unknown field (Register - Unknown Field)" \
    400 \
    "POST" \
    "/api/auth/register" \
    "$UNKNOWN_FIELD_PAYLOAD" \
    "" \
    '.error.code == "UNKNOWN_FIELDS" and (.error.details | any(.field == "username"))'

# Test 5: Register - Successful Registration
REGISTER_PAYLOAD=$(jq -n \
        --arg email "$TEST_EMAIL" \
        --arg password "$PASSWORD" \
        --arg role "freelancer" \
    '{email: $email, password: $password, role: $role}')
assert_request \
    "Register new user account (Valid Register / Register - Successful Registration)" \
    201 \
    "POST" \
    "/api/auth/register" \
    "$REGISTER_PAYLOAD" \
    "" \
    '.user.email == "'"$TEST_EMAIL"'" and .message == "User successfully registered." and (.user | has("passwordHash") | not)'

# Test 6: Valid Register No HTTPS
HTTP_REGISTER_PAYLOAD=$(jq -n \
        --arg email "$HTTP_TEST_EMAIL" \
        --arg password "$PASSWORD" \
        --arg role "freelancer" \
    '{email: $email, password: $password, role: $role}')
assert_request \
    "Register user account over HTTP (Valid Register No HTTPS)" \
    201 \
    "POST" \
    "/api/auth/register" \
    "$HTTP_REGISTER_PAYLOAD" \
    "" \
    '.user.email == "'"$HTTP_TEST_EMAIL"'" and .message == "User successfully registered."' \
    "$HTTP_BASE_URL"

# Test 7: Register - Duplicate Email
assert_request \
    "Reject duplicate account registration (Register - Duplicate Email)" \
    409 \
    "POST" \
    "/api/auth/register" \
    "$REGISTER_PAYLOAD" \
    "" \
    '.error.code == "DUPLICATE_EMAIL"'

# Test 8: Login - Invalid Email
LOGIN_INVALID_EMAIL_PAYLOAD=$(jq -n \
        --arg password "$PASSWORD" \
    '{email: "not-an-email", password: $password}')
assert_request \
    "Reject login with invalid email syntax (Login Invalid Email)" \
    400 \
    "POST" \
    "/api/auth/login" \
    "$LOGIN_INVALID_EMAIL_PAYLOAD" \
    "" \
    '.error.code == "VALIDATION_ERROR" and (.error.details | any(.field == "email"))'

# Test 9: Login - Missing Password
LOGIN_NO_PW_PAYLOAD=$(jq -n \
        --arg email "$TEST_EMAIL" \
    '{email: $email}')
assert_request \
    "Reject login with missing password (Login No Password)" \
    400 \
    "POST" \
    "/api/auth/login" \
    "$LOGIN_NO_PW_PAYLOAD" \
    "" \
    '.error.code == "VALIDATION_ERROR" and (.error.details | any(.field == "password"))'

# Test 10: Login - Invalid Password
LOGIN_INVALID_PW_PAYLOAD=$(node -e "
    const obj = { email: '$TEST_EMAIL', password: 'A'.repeat(129) };
    process.stdout.write(JSON.stringify(obj));
")
assert_request \
    "Reject login with password exceeding length limit (Login Invalid Password)" \
    400 \
    "POST" \
    "/api/auth/login" \
    "$LOGIN_INVALID_PW_PAYLOAD" \
    "" \
    '.error.code == "VALIDATION_ERROR" and (.error.details | any(.field == "password"))'

# Test 11: Login - Invalid Credentials
LOGIN_WRONG_PW_PAYLOAD=$(jq -n \
        --arg email "$TEST_EMAIL" \
    '{email: $email, password: "WrongPassword123!"}')
assert_request \
    "Reject login with invalid credentials (Login - Invalid Credentials)" \
    401 \
    "POST" \
    "/api/auth/login" \
    "$LOGIN_WRONG_PW_PAYLOAD" \
    "" \
    '.error.code == "INVALID_CREDENTIALS"'

# Test 12: Login - Valid
LOGIN_PAYLOAD=$(jq -n \
        --arg email "$TEST_EMAIL" \
        --arg password "$PASSWORD" \
    '{email: $email, password: $password}')
assert_request \
    "Authenticate user and issue JWT (Valid Login / Login - Valid)" \
    200 \
    "POST" \
    "/api/auth/login" \
    "$LOGIN_PAYLOAD" \
    "" \
    '.token != null and .user.email == "'"$TEST_EMAIL"'" and (.user | has("passwordHash") | not)'

TOKEN=$(echo "$LAST_BODY" | jq -r '.token // empty')
if [[ -z "$TOKEN" ]]; then
    echo -e "${RED}${BOLD}Aborting remaining tests: Failed to retrieve JWT token from login response.${NC}\n"
    exit 1
fi

# Test 13: GET /me - No Token
assert_request \
    "Deny access to /me without token (GET /me - No Token)" \
    401 \
    "GET" \
    "/api/auth/me" \
    "" \
    "" \
    '.error.code == "UNAUTHORIZED"'

# Test 14: GET /me - Invalid Token
assert_request \
    "Deny access to /me with malformed token (GET /me - Invalid Token)" \
    401 \
    "GET" \
    "/api/auth/me" \
    "" \
    "Bearer malformed.or.invalid.token" \
    '.error.code == "INVALID_TOKEN"'

# Test 15: GET /me - Valid Token
assert_request \
    "Allow access to /me with valid Bearer token (GET /me - Valid Token)" \
    200 \
    "GET" \
    "/api/auth/me" \
    "" \
    "Bearer ${TOKEN}" \
    '.user.email == "'"$TEST_EMAIL"'" and (.user | has("passwordHash") | not)'

# Postman / Newman Test Suite
echo -e "${BOLD}${BLUE}============================================================${NC}"
echo -e "${BOLD}             RUNNING POSTMAN COLLECTION (NEWMAN)            ${NC}"
echo -e "${BOLD}${BLUE}============================================================${NC}\n"

if npx newman run "tests/postman/HustleHub-Auth.postman_collection.json" -e "tests/postman/HustleHub-Local.postman_environment.json" --insecure; then
    TEST_TITLES+=("Postman Collection (Newman)")
    TEST_STATUSES+=("PASS")
    TEST_DETAILS+=("All Postman tests passed")
    ((PASSED++))
else
    TEST_TITLES+=("Postman Collection (Newman)")
    TEST_STATUSES+=("FAIL")
    TEST_DETAILS+=("Newman run failed")
    ((FAILED++))
fi
echo ""

TOTAL=$((PASSED + FAILED))
echo -e "${BOLD}${BLUE}============================================================${NC}"
echo -e "${BOLD}                       TEST SUMMARY                         ${NC}"
echo -e "${BOLD}${BLUE}============================================================${NC}"

for i in "${!TEST_TITLES[@]}"; do
    if [[ "${TEST_STATUSES[$i]}" == "PASS" ]]; then
        printf "  ${GREEN}${BOLD}%-6s${NC}  %s\n" "  PASS" "${TEST_TITLES[$i]}"
    else
        printf "  ${RED}${BOLD}%-6s${NC}  %s ${RED}(%s)${NC}\n" "  FAIL" "${TEST_TITLES[$i]}" "${TEST_DETAILS[$i]}"
    fi
done

echo -e "${BOLD}${BLUE}------------------------------------------------------------${NC}"
echo -e " Total Tests : ${TOTAL}"
echo -e " Passed      : ${GREEN}${PASSED}${NC}"
echo -e " Failed      : $(if [[ "$FAILED" -gt 0 ]]; then echo -e "${RED}${FAILED}${NC}"; else echo "0"; fi)"

if [[ "$FAILED" -eq 0 ]]; then
    echo -e "\n${GREEN}${BOLD}ALL TESTS PASSED SUCCESSFULLY${NC}\n"
    exit 0
else
    echo -e "\n${RED}${BOLD}SOME TESTS FAILED${NC}\n"
    exit 1
fi
