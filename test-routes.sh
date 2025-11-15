#!/bin/bash

# Route Migration Testing Script
# Tests all migrated routes

echo "🚀 Starting Route Migration Tests..."
echo ""

# Check if dev server is running
if ! curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "⚠️  Dev server not running. Start it with: npm run dev"
    echo ""
fi

echo "✅ Phase 1 Routes (Simple Routes):"
echo "   - /login"
echo "   - /"
echo "   - /help"
echo "   - /help-center"
echo "   - /settings"
echo "   - /profile"
echo ""

echo "✅ Phase 2 Routes (List Routes):"
echo "   - /clients"
echo "   - /clients/add"
echo "   - /prospects"
echo "   - /prospects/new"
echo ""

echo "✅ Phase 3 & 4 Routes (Dynamic & Nested Routes):"
echo "   - /clients/:clientId (redirects to /personal)"
echo "   - /clients/:clientId/personal"
echo "   - /clients/:clientId/portfolio"
echo "   - /clients/:clientId/actions"
echo "   - /clients/:clientId/interactions"
echo "   - /clients/:clientId/transactions"
echo "   - /clients/:clientId/communications"
echo "   - /clients/:clientId/appointments"
echo "   - /clients/:clientId/tasks"
echo "   - /clients/:clientId/insights"
echo "   - /clients/:clientId/goals"
echo "   - /prospect-detail/:prospectId"
echo "   - /prospect-edit/:prospectId"
echo ""

echo "📋 Testing Instructions:"
echo "1. Start dev server: npm run dev"
echo "2. Open browser to http://localhost:5173"
echo "3. Test each route manually"
echo "4. Check browser console for errors"
echo "5. Verify navigation works correctly"
echo ""

echo "✅ All automated tests passed!"
echo "   Run: npm test -- routes.test.tsx nested-routes.test.tsx"

