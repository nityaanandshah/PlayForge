#!/bin/bash

# PlayForge API Test Script
# Tests all authentication endpoints

set -e

API_URL="http://localhost:8080/api/v1"
TEST_EMAIL="test_$(date +%s)@example.com"
TEST_USERNAME="testuser_$(date +%s)"
TEST_PASSWORD="password123"

echo "🧪 PlayForge API Test Suite"
echo "=============================="
echo ""

# Test 1: Health Check
echo "1️⃣  Testing health endpoint..."
HEALTH=$(curl -s "http://localhost:8080/health")
echo "Response: $HEALTH"
if echo "$HEALTH" | grep -q '"status":"ok"'; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
    exit 1
fi
echo ""

# Test 2: Signup
echo "2️⃣  Testing signup..."
echo "Email: $TEST_EMAIL"
echo "Username: $TEST_USERNAME"
SIGNUP_RESPONSE=$(curl -s -X POST "$API_URL/auth/signup" \
    -H "Content-Type: application/json" \
    -d "{
        \"username\": \"$TEST_USERNAME\",
        \"email\": \"$TEST_EMAIL\",
        \"password\": \"$TEST_PASSWORD\"
    }")

echo "Response: $SIGNUP_RESPONSE"
if echo "$SIGNUP_RESPONSE" | grep -q '"access_token"'; then
    echo "✅ Signup passed"
    ACCESS_TOKEN=$(echo "$SIGNUP_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
    REFRESH_TOKEN=$(echo "$SIGNUP_RESPONSE" | grep -o '"refresh_token":"[^"]*"' | cut -d'"' -f4)
    echo "Access Token: ${ACCESS_TOKEN:0:50}..."
    echo "Refresh Token: ${REFRESH_TOKEN:0:50}..."
else
    echo "❌ Signup failed"
    exit 1
fi
echo ""

# Test 3: Logout
echo "3️⃣  Testing logout..."
LOGOUT_RESPONSE=$(curl -s -X POST "$API_URL/auth/logout" \
    -H "Authorization: Bearer $ACCESS_TOKEN")
echo "Response: $LOGOUT_RESPONSE"
echo "✅ Logout passed"
echo ""

# Test 4: Login
echo "4️⃣  Testing login..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$TEST_EMAIL\",
        \"password\": \"$TEST_PASSWORD\"
    }")

echo "Response: $LOGIN_RESPONSE"
if echo "$LOGIN_RESPONSE" | grep -q '"access_token"'; then
    echo "✅ Login passed"
    ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
    REFRESH_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"refresh_token":"[^"]*"' | cut -d'"' -f4)
else
    echo "❌ Login failed"
    exit 1
fi
echo ""

# Test 5: Refresh Token
echo "5️⃣  Testing refresh token..."
REFRESH_RESPONSE=$(curl -s -X POST "$API_URL/auth/refresh" \
    -H "Content-Type: application/json" \
    -d "{
        \"refresh_token\": \"$REFRESH_TOKEN\"
    }")

echo "Response: $REFRESH_RESPONSE"
if echo "$REFRESH_RESPONSE" | grep -q '"access_token"'; then
    echo "✅ Refresh token passed"
else
    echo "❌ Refresh token failed"
    exit 1
fi
echo ""

# Test 6: Invalid Login
echo "6️⃣  Testing invalid credentials..."
INVALID_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$TEST_EMAIL\",
        \"password\": \"wrongpassword\"
    }")

echo "Response: $INVALID_RESPONSE"
if echo "$INVALID_RESPONSE" | grep -q '"error"'; then
    echo "✅ Invalid credentials test passed"
else
    echo "❌ Invalid credentials test failed"
    exit 1
fi
echo ""

# Test 7: Duplicate Signup
echo "7️⃣  Testing duplicate signup..."
DUPLICATE_RESPONSE=$(curl -s -X POST "$API_URL/auth/signup" \
    -H "Content-Type: application/json" \
    -d "{
        \"username\": \"$TEST_USERNAME\",
        \"email\": \"$TEST_EMAIL\",
        \"password\": \"$TEST_PASSWORD\"
    }")

echo "Response: $DUPLICATE_RESPONSE"
if echo "$DUPLICATE_RESPONSE" | grep -q '"error"'; then
    echo "✅ Duplicate signup prevention passed"
else
    echo "❌ Duplicate signup prevention failed"
    exit 1
fi
echo ""

echo "=============================="
echo "🎉 All tests passed!"
echo "=============================="


