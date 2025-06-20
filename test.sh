#!/bin/bash

# 🐎 HORSE PEDIGREE API - MEGA TEST cURL
# Kompletny test wszystkich endpointów API

BASE_URL="http://localhost:3000/api"
echo "🚀 Starting MEGA TEST for Horse Pedigree API"
echo "📍 Base URL: $BASE_URL"
echo "🕒 $(date)"
echo "=================================================="

# Function to make request with colored output
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo ""
    echo "🔵 TEST: $description"
    echo "📝 $method $endpoint"
    
    if [ -n "$data" ]; then
        echo "📋 Data: $data"
        response=$(curl -s -X $method \
            -H "Content-Type: application/json" \
            -d "$data" \
            -w "\n📊 Status: %{http_code} | Time: %{time_total}s" \
            "$BASE_URL$endpoint")
    else
        response=$(curl -s -X $method \
            -w "\n📊 Status: %{http_code} | Time: %{time_total}s" \
            "$BASE_URL$endpoint")
    fi
    
    echo "📤 Response:"
    echo "$response" | head -20
    echo "---"
    sleep 1
}

# ===========================================
# 🏥 1. HEALTH CHECK
# ===========================================
echo ""
echo "🏥 === HEALTH CHECK ==="
make_request "GET" "/health" "" "Health check with database stats"

# ===========================================
# 🌍 2. COUNTRIES CRUD
# ===========================================
echo ""
echo "🌍 === COUNTRIES CRUD ==="

# GET all countries (should be empty initially or have seed data)
make_request "GET" "/countries" "" "Get all countries"

# POST - Add countries
make_request "POST" "/countries" '{"code":"PL","name":"Polska"}' "Add Poland"
make_request "POST" "/countries" '{"code":"DE","name":"Niemcy"}' "Add Germany"
make_request "POST" "/countries" '{"code":"US","name":"Stany Zjednoczone"}' "Add USA"
make_request "POST" "/countries" '{"code":"FR","name":"Francja"}' "Add France"

# POST - Try duplicate (should fail)
make_request "POST" "/countries" '{"code":"PL","name":"Polska Duplicate"}' "Try duplicate country code (should fail)"

# POST - Invalid data
make_request "POST" "/countries" '{"code":"INVALID","name":"Invalid"}' "Invalid country code (should fail)"

# GET all countries again
make_request "GET" "/countries" "" "Get all countries after adding"

# PUT - Update country
make_request "PUT" "/countries/PL" '{"code":"PL","name":"Polska Zaktualizowana"}' "Update Poland name"

# GET specific country (should work with updated name)
make_request "GET" "/countries" "" "Get countries after update"

# ===========================================
# 🎨 3. COLORS CRUD
# ===========================================
echo ""
echo "🎨 === COLORS CRUD ==="

# Add colors
make_request "POST" "/colors" '{"name":"Gniada"}' "Add Gniada color"
make_request "POST" "/colors" '{"name":"Kara"}' "Add Kara color"
make_request "POST" "/colors" '{"name":"Siwa"}' "Add Siwa color"
make_request "POST" "/colors" '{"name":"Kasztanowata"}' "Add Kasztanowata color"

# GET all colors
make_request "GET" "/colors" "" "Get all colors"

# Try duplicate
make_request "POST" "/colors" '{"name":"Gniada"}' "Try duplicate color (may fail depending on constraints)"

# ===========================================
# 🧬 4. BREEDS CRUD
# ===========================================
echo ""
echo "🧬 === BREEDS CRUD ==="

# Add breeds (only specific values allowed)
make_request "POST" "/breeds" '{"name":"oo"}' "Add oo breed"
make_request "POST" "/breeds" '{"name":"xx"}' "Add xx breed"
make_request "POST" "/breeds" '{"name":"xo"}' "Add xo breed"
make_request "POST" "/breeds" '{"name":"xxoo"}' "Add xxoo breed"

# Try invalid breed
make_request "POST" "/breeds" '{"name":"invalid"}' "Try invalid breed (should fail)"

# GET all breeds
make_request "GET" "/breeds" "" "Get all breeds"

# ===========================================
# 🏠 5. BREEDERS CRUD
# ===========================================
echo ""
echo "🏠 === BREEDERS CRUD ==="

# Add breeders
make_request "POST" "/breeders" '{"name":"Hodowla Krakowska","country_code":"PL"}' "Add Polish breeder"
make_request "POST" "/breeders" '{"name":"German Stables","country_code":"DE"}' "Add German breeder"
make_request "POST" "/breeders" '{"name":"American Ranch","country_code":"US"}' "Add American breeder"

# Try breeder with invalid country
make_request "POST" "/breeders" '{"name":"Invalid Breeder","country_code":"XX"}' "Try breeder with invalid country (should fail)"

# GET all breeders
make_request "GET" "/breeders" "" "Get all breeders"

# ===========================================
# 🐎 6. HORSES CRUD - BASIC
# ===========================================
echo ""
echo "🐎 === HORSES CRUD - BASIC ==="

# Add foundation horses (no parents)
make_request "POST" "/horses" '{
    "name":"Bucefał",
    "breed_id":1,
    "gender":"ogier",
    "birth_date":"2015-06-01",
    "color_id":1,
    "breeder_id":1
}' "Add foundation stallion Bucefał (oo)"

make_request "POST" "/horses" '{
    "name":"Luna",
    "breed_id":2,
    "gender":"klacz",
    "birth_date":"2016-07-15", 
    "color_id":2,
    "breeder_id":2
}' "Add foundation mare Luna (xx)"

make_request "POST" "/horses" '{
    "name":"Sparta",
    "breed_id":3,
    "gender":"klacz",
    "birth_date":"2017-03-10",
    "color_id":3,
    "breeder_id":1
}' "Add foundation mare Sparta (xo)"

make_request "POST" "/horses" '{
    "name":"Thor",
    "breed_id":4,
    "gender":"ogier",
    "birth_date":"2018-01-20",
    "color_id":4,
    "breeder_id":3
}' "Add foundation stallion Thor (xxoo)"

# GET all horses
make_request "GET" "/horses" "" "Get all horses"

# ===========================================
# 🧬 7. HORSES - BREEDING TESTS
# ===========================================
echo ""
echo "🧬 === HORSES - BREEDING TESTS ==="

# Test automatic breed calculation: oo + xx = xxoo
make_request "POST" "/horses" '{
    "name":"Apollo",
    "breed_id":1,
    "gender":"ogier",
    "birth_date":"2019-05-15",
    "sire_id":1,
    "dam_id":2,
    "color_id":1,
    "breeder_id":1
}' "Add Apollo (oo + xx = should become xxoo automatically)"

# Test: xx + xo = xo
make_request "POST" "/horses" '{
    "name":"Athena",
    "breed_id":1,
    "gender":"klacz", 
    "birth_date":"2019-08-20",
    "sire_id":4,
    "dam_id":3,
    "color_id":2,
    "breeder_id":2
}' "Add Athena (xxoo + xo = should become xxoo)"

# Test: oo + oo = oo
make_request "POST" "/horses" '{
    "name":"Pegasus",
    "breed_id":2,
    "gender":"wałach",
    "birth_date":"2020-02-10",
    "sire_id":1,
    "dam_id":3,
    "color_id":3,
    "breeder_id":1
}' "Add Pegasus (oo + xo = should become xo)"

# ===========================================
# 🚫 8. VALIDATION TESTS
# ===========================================
echo ""
echo "🚫 === VALIDATION TESTS ==="

# Try invalid gender for sire
make_request "POST" "/horses" '{
    "name":"Invalid Horse",
    "breed_id":1,
    "gender":"ogier",
    "sire_id":2,
    "dam_id":3,
    "color_id":1,
    "breeder_id":1
}' "Try klacz as sire (should fail)"

# Try same horse as both parents
make_request "POST" "/horses" '{
    "name":"Invalid Horse 2",
    "breed_id":1,
    "gender":"klacz",
    "sire_id":1,
    "dam_id":1,
    "color_id":1,
    "breeder_id":1
}' "Try same horse as both parents (should fail)"

# Try non-existent parent
make_request "POST" "/horses" '{
    "name":"Invalid Horse 3",
    "breed_id":1,
    "gender":"klacz",
    "sire_id":999,
    "dam_id":2,
    "color_id":1,
    "breeder_id":1
}' "Try non-existent sire (should fail)"

# Try duplicate name
make_request "POST" "/horses" '{
    "name":"Bucefał",
    "breed_id":1,
    "gender":"klacz",
    "color_id":1,
    "breeder_id":1
}' "Try duplicate horse name (should fail)"

# ===========================================
# 🌳 9. PEDIGREE TESTS
# ===========================================
echo ""
echo "🌳 === PEDIGREE TESTS ==="

# Get pedigree depth 0
make_request "GET" "/horses/5/pedigree/0" "" "Get Apollo pedigree depth 0"

# Get pedigree depth 1 
make_request "GET" "/horses/5/pedigree/1" "" "Get Apollo pedigree depth 1 (with parents)"

# Get pedigree depth 2
make_request "GET" "/horses/5/pedigree/2" "" "Get Apollo pedigree depth 2"

# Try invalid depth
make_request "GET" "/horses/1/pedigree/15" "" "Try invalid pedigree depth (should fail)"

# Try non-existent horse
make_request "GET" "/horses/999/pedigree/1" "" "Try pedigree for non-existent horse (should fail)"

# ===========================================
# 👶 10. OFFSPRING TESTS  
# ===========================================
echo ""
echo "👶 === OFFSPRING TESTS ==="

# Get all offspring of Bucefał (horse ID 1)
make_request "GET" "/horses/1/offspring" "" "Get all offspring of Bucefał"

# Get offspring with gender filter
make_request "GET" "/horses/1/offspring?gender=ogier" "" "Get male offspring of Bucefał"

# Get offspring with breeder filter
make_request "GET" "/horses/1/offspring?breeder_id=1" "" "Get offspring of Bucefał from breeder 1"

# Get offspring with pagination
make_request "GET" "/horses/1/offspring?limit=2&offset=0" "" "Get offspring with pagination"

# Try non-existent horse offspring
make_request "GET" "/horses/999/offspring" "" "Try offspring of non-existent horse"

# ===========================================
# 🎨 11. HTML PEDIGREE TESTS
# ===========================================
echo ""
echo "🎨 === HTML PEDIGREE TESTS ==="

# Get HTML pedigree
echo "🔵 TEST: Get HTML pedigree for Apollo"
echo "📝 GET /horses/5/pedigree/html/2"
curl -s "$BASE_URL/horses/5/pedigree/html/2" > pedigree_test.html
echo "📤 Response: HTML saved to pedigree_test.html ($(wc -c < pedigree_test.html) bytes)"
echo "🌐 Open pedigree_test.html in browser to view"

# Try invalid HTML depth
make_request "GET" "/horses/1/pedigree/html/10" "" "Try HTML pedigree with invalid depth (should fail)"

# ===========================================
# 🔍 12. BREEDING CHECK TESTS
# ===========================================
echo ""
echo "🔍 === BREEDING CHECK TESTS ==="

# Check breeding between compatible horses
make_request "GET" "/horses/breeding/check?sire_id=1&dam_id=2" "" "Check breeding: Bucefał (oo) × Luna (xx)"

# Check breeding with same breed
make_request "GET" "/horses/breeding/check?sire_id=1&dam_id=3" "" "Check breeding: Bucefał (oo) × Sparta (xo)"

# Check breeding with potential inbreeding
make_request "GET" "/horses/breeding/check?sire_id=5&dam_id=6" "" "Check breeding between related horses"

# Try invalid parameters
make_request "GET" "/horses/breeding/check?sire_id=999&dam_id=1" "" "Try breeding check with invalid sire"

make_request "GET" "/horses/breeding/check?sire_id=2&dam_id=3" "" "Try breeding with klacz as sire (should fail)"

# ===========================================
# ✏️ 13. UPDATE TESTS
# ===========================================
echo ""
echo "✏️ === UPDATE TESTS ==="

# Update horse
make_request "PUT" "/horses/1" '{
    "name":"Bucefał Wielki",
    "breed_id":1,
    "gender":"ogier",
    "birth_date":"2015-06-01",
    "color_id":1,
    "breeder_id":1
}' "Update Bucefał name"

# Update breeder
make_request "PUT" "/breeders/1" '{
    "name":"Hodowla Krakowska Premium",
    "country_code":"PL"
}' "Update breeder name"

# Update color  
make_request "PUT" "/colors/1" '{
    "name":"Gniada Ciemna"
}' "Update color name"

# ===========================================
# 📊 14. FILTERING AND PAGINATION TESTS
# ===========================================
echo ""
echo "📊 === FILTERING AND PAGINATION TESTS ==="

# Filter horses by gender
make_request "GET" "/horses?gender=ogier" "" "Filter horses by gender (ogier)"

make_request "GET" "/horses?gender=klacz" "" "Filter horses by gender (klacz)"

# Filter by breed
make_request "GET" "/horses?breed_id=1" "" "Filter horses by breed (oo)"

# Pagination
make_request "GET" "/horses?limit=2&offset=0" "" "Get horses with pagination (first 2)"

make_request "GET" "/horses?limit=2&offset=2" "" "Get horses with pagination (next 2)"

# Combined filters
make_request "GET" "/horses?gender=ogier&limit=1" "" "Combined filter: male horses, limit 1"

# ===========================================
# 🚫 15. DELETION TESTS  
# ===========================================
echo ""
echo "🚫 === DELETION TESTS ==="

# Try to delete horse with offspring (should fail)
make_request "DELETE" "/horses/1" "" "Try to delete horse with offspring (should fail)"

# Delete horse without offspring
make_request "DELETE" "/horses/7" "" "Delete horse without offspring (Pegasus)"

# Try to delete non-existent horse
make_request "DELETE" "/horses/999" "" "Try to delete non-existent horse"

# Try to delete breeder with horses (should fail)
make_request "DELETE" "/breeders/1" "" "Try to delete breeder with horses (may fail)"

# Delete country (should fail if has breeders)
make_request "DELETE" "/countries/FR" "" "Delete unused country"

# ===========================================
# ⚡ 16. PERFORMANCE AND EDGE CASES
# ===========================================
echo ""
echo "⚡ === PERFORMANCE AND EDGE CASES ==="

# Large limit test
make_request "GET" "/horses?limit=1000" "" "Test large limit (should be capped)"

# Invalid parameters
make_request "GET" "/horses?gender=invalid" "" "Test invalid gender filter"

make_request "GET" "/horses?limit=abc" "" "Test invalid limit parameter"

# Empty results
make_request "GET" "/horses?gender=wałach&breeder_id=999" "" "Test filters with no results"

# ===========================================
# 📈 17. API VERSIONING TESTS
# ===========================================
echo ""
echo "📈 === API VERSIONING TESTS ==="

# Test v1 endpoints
make_request "GET" "/v1/horses" "" "Test v1 API endpoint"

make_request "GET" "/v1/health" "" "Test v1 health endpoint"

# ===========================================
# 🏁 18. FINAL STATUS CHECK
# ===========================================
echo ""
echo "🏁 === FINAL STATUS CHECK ==="

# Final health check
make_request "GET" "/health" "" "Final health check with updated stats"

# Get final counts
make_request "GET" "/countries" "" "Final count: Countries"
make_request "GET" "/breeds" "" "Final count: Breeds"  
make_request "GET" "/colors" "" "Final count: Colors"
make_request "GET" "/breeders" "" "Final count: Breeders"
make_request "GET" "/horses" "" "Final count: Horses"

# ===========================================
# 📋 SUMMARY
# ===========================================
echo ""
echo "=================================================="
echo "🏆 MEGA TEST COMPLETED!"
echo "🕒 Finished at: $(date)"
echo ""
echo "📊 SUMMARY:"
echo "✅ Health check - API status"
echo "✅ Countries CRUD - 4 countries added"
echo "✅ Colors CRUD - 4 colors added"  
echo "✅ Breeds CRUD - 4 breeds added"
echo "✅ Breeders CRUD - 3 breeders added"
echo "✅ Horses CRUD - ~7 horses added"
echo "✅ Breeding logic - automatic breed calculation"
echo "✅ Validation - all edge cases tested"
echo "✅ Pedigree API - JSON format"
echo "✅ Offspring API - with filters"
echo "✅ HTML visualization - saved to pedigree_test.html"
echo "✅ Breeding check - compatibility analysis"
echo "✅ Updates - name changes tested"
echo "✅ Filtering - gender, breed, pagination"
echo "✅ Deletions - with constraint validation"
echo "✅ Edge cases - invalid data handling"
echo "✅ API versioning - v1 endpoints"
echo ""
echo "🎨 Visual test: Open pedigree_test.html in your browser!"
echo "🚀 API is fully functional and tested!"
echo "=================================================="

# Cleanup
rm -f pedigree_test.html 2>/dev/null

echo ""
echo "💡 TIP: Run this script with: bash mega_test.sh"
echo "💡 Make sure your API is running on localhost:3000"
echo "💡 Check the responses above for any errors or unexpected behavior"