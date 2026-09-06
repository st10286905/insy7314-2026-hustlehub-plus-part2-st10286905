#!/usr/bin/env bash

# AI Disclosure: https://share.gemini.google/a8tW4tPvJ5Kz

set -uo pipefail

PORT=3000
BASE_URL="http://localhost:${PORT}/api/auth"
SERVER_CMD="${SERVER_CMD:-npm run dev}"
SERVER_LOG="$(mktemp /tmp/hustlehub_server_XXXXXX.log)"

TIMESTAMP=$(date +%s)
TEST_EMAIL="test_${TIMESTAMP}@hustlehub.co.za"
PASSWORD="SecurePassword123!"

# Output styling
GREEN="\033[0;32m"
RED="\033[0;31m"
CYAN="\033[0;36m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
BOLD="\033[1m"
DIM="\033[2m"
NC="\033[0m"

PASSED=0
FAILED=0
TEST_INDEX=0
LAST_BODY=""
SERVER_PID=""

# Test tracking arrays for the final summary
declare -a TEST_TITLES=()
declare -a TEST_STATUSES=()
declare -a TEST_DETAILS=()

cleanup() {
    local exit_code=$?
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

# Start background server
echo -e "${BOLD}Starting server: \`${SERVER_CMD}\`${NC}"
$SERVER_CMD > "$SERVER_LOG" 2>&1 &
SERVER_PID=$!

echo -n "Waiting for server to accept connections on port ${PORT}"
MAX_WAIT_SECONDS=30
ELAPSED=0

until curl -s "http://localhost:${PORT}" > /dev/null 2>&1 || [[ $ELAPSED -ge $MAX_WAIT_SECONDS ]]; do
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

# Pretty-print JSON or raw strings with indentation
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
    local full_url="${BASE_URL}${path}"

    TEST_TITLES+=("$title")

    echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}Test ${TEST_INDEX}: ${title}${NC}"
    echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    # 1. Pretty format Request
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

    # 2. Execute Request
    local headers=(-H "Content-Type: application/json")
    if [[ -n "$auth_header" ]]; then
        headers+=(-H "Authorization: ${auth_header}")
    fi

    local raw_output
    if [[ -n "$payload" ]]; then
        raw_output=$(curl -s -w "\n%{http_code}" -X "$method" "$full_url" "${headers[@]}" -d "$payload")
    else
        raw_output=$(curl -s -w "\n%{http_code}" -X "$method" "$full_url" "${headers[@]}")
    fi

    local status_code
    status_code=$(tail -n 1 <<< "$raw_output")
    local body
    body=$(sed '$ d' <<< "$raw_output")
    LAST_BODY="$body"

    # 3. Pretty format Result
    echo -e "\n${YELLOW}${BOLD}< RESPONSE${NC}"
    echo -e "  ${BOLD}HTTP Status:${NC} ${status_code}"
    echo -e "  ${BOLD}Body:${NC}"
    format_body "$body"

    # 4. Evaluate Assertions
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
        echo -e "  ${GREEN}${BOLD}✔ PASS${NC} (HTTP ${status_code} matched expected ${expected_status})"
        TEST_STATUSES+=("PASS")
        TEST_DETAILS+=("HTTP ${status_code}")
        ((PASSED++))
    else
        echo -e "  ${RED}${BOLD}✖ FAIL${NC} (${error_msg})"
        TEST_STATUSES+=("FAIL")
        TEST_DETAILS+=("${error_msg}")
        ((FAILED++))
    fi
    echo ""
}

echo -e "${BOLD}--- Starting Integration Test Suite ---${NC}\n"

# 0. Invalid email during registration
INVALID_EMAIL_PAYLOAD=$(jq -n \
        --arg password "$PASSWORD" \
    '{email: "not-an-email", password: $password, role: "freelancer"}')

assert_request \
    "Reject registration with invalid email" \
    400 \
    "POST" \
    "/register" \
    "$INVALID_EMAIL_PAYLOAD" \
    "" \
    '.error.code == "VALIDATION_ERROR"'

# 0.1 Weak password
WEAK_PASSWORD_PAYLOAD=$(jq -n \
        --arg email "$TEST_EMAIL" \
    '{email: $email, password: "123", role: "freelancer"}')

assert_request \
    "Reject registration with weak password" \
    400 \
    "POST" \
    "/register" \
    "$WEAK_PASSWORD_PAYLOAD" \
    "" \
    '.error.code == "VALIDATION_ERROR"'

# 0.2 Missing email
MISSING_EMAIL_PAYLOAD=$(jq -n \
        --arg password "$PASSWORD" \
    '{password: $password, role: "freelancer"}')

assert_request \
    "Reject registration with missing email" \
    400 \
    "POST" \
    "/register" \
    "$MISSING_EMAIL_PAYLOAD" \
    "" \
    '.error.code == "VALIDATION_ERROR"'


# 1. Successful Registration (201 Created)
REGISTER_PAYLOAD=$(jq -n \
        --arg email "$TEST_EMAIL" \
        --arg password "$PASSWORD" \
        --arg role "freelancer" \
    '{email: $email, password: $password, role: $role}')

assert_request \
    "Register new user account" \
    201 \
    "POST" \
    "/register" \
    "$REGISTER_PAYLOAD" \
    "" \
    '.user.email == "'"$TEST_EMAIL"'"'

# 2. Duplicate Registration Check (409 Conflict)
assert_request \
    "Reject duplicate account registration" \
    409 \
    "POST" \
    "/register" \
    "$REGISTER_PAYLOAD" \
    "" \
    '.error.code == "DUPLICATE_EMAIL"'

# 3. Successful Login (200 OK + JWT)
LOGIN_PAYLOAD=$(jq -n \
        --arg email "$TEST_EMAIL" \
        --arg password "$PASSWORD" \
    '{email: $email, password: $password}')

assert_request \
    "Authenticate user and issue JWT" \
    200 \
    "POST" \
    "/login" \
    "$LOGIN_PAYLOAD" \
    "" \
    '.token != null and .user.email == "'"$TEST_EMAIL"'"'

TOKEN=$(echo "$LAST_BODY" | jq -r '.token // empty')

if [[ -z "$TOKEN" ]]; then
    echo -e "${RED}${BOLD}Aborting remaining tests: Failed to retrieve JWT token from login response.${NC}\n"
    exit 1
fi

# 4. Protected Route without Token (401 Unauthorized)
assert_request \
    "Deny access to /me without token" \
    401 \
    "GET" \
    "/me" \
    "" \
    "" \
    '.error.code == "UNAUTHORIZED"'

# 5. Protected Route with Valid Token (200 OK)
assert_request \
    "Allow access to /me with valid Bearer token" \
    200 \
    "GET" \
    "/me" \
    "" \
    "Bearer ${TOKEN}" \
    '.user.email == "'"$TEST_EMAIL"'"'

# 6. Protected Route with Invalid Token (401 Unauthorized)
assert_request \
    "Deny access to /me with malformed token" \
    401 \
    "GET" \
    "/me" \
    "" \
    "Bearer malformed.or.invalid.token" \
    '.error.code == "INVALID_TOKEN"'

# Summary Dashboard
TOTAL=$((PASSED + FAILED))
echo -e "${BOLD}${BLUE}============================================================${NC}"
echo -e "${BOLD}                       TEST SUMMARY                         ${NC}"
echo -e "${BOLD}${BLUE}============================================================${NC}"

# Itemised test breakdown
for i in "${!TEST_TITLES[@]}"; do
    if [[ "${TEST_STATUSES[$i]}" == "PASS" ]]; then
        printf "  ${GREEN}${BOLD}%-6s${NC}  %s\n" "✔ PASS" "${TEST_TITLES[$i]}"
    else
        printf "  ${RED}${BOLD}%-6s${NC}  %s ${RED}(%s)${NC}\n" "✖ FAIL" "${TEST_TITLES[$i]}" "${TEST_DETAILS[$i]}"
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
