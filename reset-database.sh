#!/bin/bash

# Skrypt do czyszczenia i resetowania bazy danych

echo "🧹 Resetowanie bazy danych..."

# Sprawdź czy Docker działa
if ! docker ps >/dev/null 2>&1; then
    echo "❌ Docker nie jest uruchomiony. Uruchom Docker Desktop."
    exit 1
fi

# Sprawdź czy kontener PostgreSQL działa
if ! docker ps | grep -q postgres; then
    echo "🚀 Uruchamianie kontenera PostgreSQL..."
    docker-compose up -d db
    echo "⏳ Czekam 5 sekund na uruchomienie bazy..."
    sleep 5
fi

echo "1️⃣ Cofanie migracji..."
npm run migrate:rollback

echo "2️⃣ Uruchamianie migracji..."
npm run migrate

echo "3️⃣ Wstawianie danych testowych..."
npm run seed

echo "4️⃣ Czyszczenie duplikatów..."
npm run cleanup:duplicates

echo "5️⃣ Dodawanie ograniczeń unikalności..."
npm run cleanup:constraints

echo "6️⃣ Pokaż końcowe statystyki..."
npm run cleanup:show

echo ""
echo "✅ Baza danych została zresetowana i jest gotowa do użycia!"
echo "🌐 Uruchom serwer: npm start"
echo "🧪 Uruchom testy: npm test"