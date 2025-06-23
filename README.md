# 🐎 Horse Pedigree API - Baza Rodowodowa Koni

Kompletny system REST API z frontendem do zarządzania bazą rodowodową koni półkrwi z automatycznym obliczaniem ras zgodnie z regułami hodowlanymi.

## 📋 Spis treści

- [Opis projektu](#opis-projektu)
- [Funkcjonalności](#funkcjonalności)
- [Technologie](#technologie)
- [Instalacja](#instalacja)
- [Uruchomienie](#uruchomienie)
- [Testy](#testy)
- [API Documentation](#api-documentation)
- [Struktura projektu](#struktura-projektu)
- [Reguły hodowlane](#reguły-hodowlane)

## 🎯 Opis projektu

System obsługuje kompletną bazę rodowodową koni z następującymi możliwościami:
- Zarządzanie krajami, hodowcami, końmi, maściami i rasami
- Automatyczne obliczanie rasy potomstwa na podstawie rodziców
- Generowanie rodowodów z wizualizacją HTML
- Sprawdzanie kompatybilności krzyżowania z wykrywaniem inbredu
- Pełna walidacja danych i zabezpieczenia

## ✨ Funkcjonalności

### Backend API
- ✅ **CRUD operations** - pełne zarządzanie wszystkimi encjami
- ✅ **Breed calculation** - automatyczne obliczanie ras zgodnie z regułami
- ✅ **Pedigree generation** - rodowody JSON i HTML z konfigurowalnymi poziomami
- ✅ **Offspring tracking** - śledzenie potomstwa z filtrami
- ✅ **Breeding validation** - sprawdzanie kompatybilności z wykrywaniem problemów
- ✅ **Data validation** - kompleksowa walidacja z Joi
- ✅ **Error handling** - obsługa błędów z informacyjnymi komunikatami
- ✅ **Health monitoring** - endpoint zdrowia z metrykami bazy

### Frontend
- ✅ **Modern SPA** - responsywna aplikacja single-page
- ✅ **Interactive forms** - dynamiczne formularze z walidacją
- ✅ **Real-time breeding preview** - podgląd krzyżowania na żywo
- ✅ **Visual pedigree trees** - interaktywne drzewa genealogiczne
- ✅ **Filtering & search** - zaawansowane filtrowanie i wyszukiwanie
- ✅ **Tab navigation** - intuicyjna nawigacja zakładkowa
- ✅ **Responsive design** - adaptacja do wszystkich urządzeń

## 🛠 Technologie

### Backend
- **Node.js** - runtime środowisko
- **Express.js** - framework webowy
- **Knex.js** - query builder i migracje
- **PostgreSQL** - baza danych
- **Joi** - walidacja danych
- **Docker** - konteneryzacja

### Frontend
- **Vanilla JavaScript** - bez frameworków dla prostoty
- **Modern CSS** - flexbox, grid, animacje
- **HTML5** - semantyczny markup
- **Responsive design** - mobile-first approach

### Testing
- **Jest** - framework testowy
- **Supertest** - testy integracji API
- **JSDOM** - środowisko DOM dla testów frontend
- **Mocking** - zaawansowane mockowanie

## 🚀 Instalacja

### Wymagania
- Node.js ≥ 16.0.0
- npm ≥ 8.0.0
- Docker & Docker Compose
- PostgreSQL (uruchomiony przez Docker)

### Kroki instalacji

1. **Klonowanie repozytorium**
```bash
git clone <repository-url>
cd horse-pedigree-api
```

2. **Instalacja zależności**
```bash
npm install
```

3. **Uruchomienie bazy danych**
```bash
docker-compose up -d
```

4. **Migracje i dane testowe**
```bash
npm run migrate
npm run seed
```

## ▶️ Uruchomienie

### Development mode
```bash
npm run dev
```

### Production mode
```bash
npm start
```

### Docker (pełny stack)
```bash
docker-compose up --build
```

Aplikacja będzie dostępna pod adresem: `http://localhost:3000`

## 🧪 Testy

Projekt zawiera kompletne pokrycie testowe z podziałem na kategorie:

### Uruchomienie wszystkich testów
```bash
npm test
```

### Testy backend (API)
```bash
npm run test:backend
```

### Testy frontend
```bash
npm run test:frontend
```

### Testy z pokryciem kodu
```bash
npm test -- --coverage
```

### Testy w trybie watch
```bash
npm run test:watch
```

### Struktura testów

```
__tests__/
├── backend/                 # Testy API i logiki biznesowej
│   ├── setup.js            # Konfiguracja środowiska testowego
│   ├── country.test.js     # Testy endpointów krajów
│   ├── breeder.test.js     # Testy endpointów hodowców
│   ├── horse.test.js       # Testy endpointów koni
│   ├── color.test.js       # Testy endpointów maści
│   ├── breed.test.js       # Testy endpointów ras
│   └── pedigreeService.test.js # Testy serwisu rodowodów
├── frontend/                # Testy interfejsu użytkownika
│   ├── setup.js            # Konfiguracja JSDOM
│   └── scripts.test.js     # Testy JavaScript frontend
├── integration/             # Testy integracyjne
│   └── api.integration.test.js # Testy workflow API
└── utils/                   # Narzędzia testowe
    └── testUtils.js        # Funkcje pomocnicze
```

### Pokrycie testów

Projekt osiąga następujące pokrycie:
- **Linie kodu**: >80%
- **Funkcje**: >75%
- **Gałęzie**: >70%
- **Instrukcje**: >80%

### Typy testów

#### 1. Testy jednostkowe (Unit Tests)
- Testowanie pojedynczych funkcji i komponentów
- Mockowanie zależności zewnętrznych
- Szybkie wykonanie

#### 2. Testy integracyjne (Integration Tests)
- Testowanie całych workflow
- Prawdziwa baza danych testowa
- Scenariusze użytkownika

#### 3. Testy funkcjonalne (Functional Tests)
- Testowanie kompletnych funkcjonalności
- End-to-end workflows
- Walidacja regul biznesowych

#### 4. Testy wydajnościowe (Performance Tests)
- Testowanie pod obciążeniem
- Pomiar czasów odpowiedzi
- Testowanie pamięci

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication
Aktualnie brak autoryzacji (development mode)

### Endpoints Overview

#### Countries (Kraje)
```http
GET    /api/countries         # Lista krajów
POST   /api/countries         # Dodaj kraj
PUT    /api/countries/:code   # Aktualizuj kraj
DELETE /api/countries/:code   # Usuń kraj
```

#### Breeds (Rasy)
```http
GET    /api/breeds            # Lista ras
POST   /api/breeds            # Dodaj rasę
PUT    /api/breeds/:id        # Aktualizuj rasę
DELETE /api/breeds/:id        # Usuń rasę
```

#### Colors (Maści)
```http
GET    /api/colors            # Lista maści
POST   /api/colors            # Dodaj maść
PUT    /api/colors/:id        # Aktualizuj maść
DELETE /api/colors/:id        # Usuń maść
```

#### Breeders (Hodowcy)
```http
GET    /api/breeders          # Lista hodowców
POST   /api/breeders          # Dodaj hodowcę
PUT    /api/breeders/:id      # Aktualizuj hodowcę
DELETE /api/breeders/:id      # Usuń hodowcę
```

#### Horses (Konie)
```http
GET    /api/horses                              # Lista koni
GET    /api/horses/:id                          # Szczegóły konia
POST   /api/horses                              # Dodaj konia
PUT    /api/horses/:id                          # Aktualizuj konia
DELETE /api/horses/:id                          # Usuń konia
GET    /api/horses/:id/pedigree/:depth          # Rodowód JSON
GET    /api/horses/:id/pedigree/html/:depth     # Rodowód HTML
GET    /api/horses/:id/offspring                # Potomstwo
GET    /api/horses/breeding/check               # Sprawdź krzyżowanie
```

#### Health & Monitoring
```http
GET    /api/health            # Status zdrowia systemu
```

### Request/Response Examples

#### Dodawanie konia
```http
POST /api/horses
Content-Type: application/json

{
  "name": "Bella",
  "gender": "klacz",
  "birth_date": "2020-05-15",
  "breed_id": 1,
  "sire_id": 2,
  "dam_id": 3,
  "color_id": 1,
  "breeder_id": 1
}
```

Response:
```json
{
  "id": 8,
  "name": "Bella",
  "gender": "klacz",
  "birth_date": "2020-05-15",
  "breed_id": 4,
  "sire_id": 2,
  "dam_id": 3,
  "color_id": 1,
  "breeder_id": 1
}
```

#### Sprawdzanie krzyżowania
```http
GET /api/horses/breeding/check?sire_id=1&dam_id=2
```

Response:
```json
{
  "breeding_possible": true,
  "predicted_breed": "xxoo",
  "risk_level": "low",
  "inbreeding_detected": false,
  "recommendation": "✅ NISKIE RYZYKO: Brak bliskiego pokrewieństwa. Krzyżowanie zalecane.",
  "sire": { "id": 1, "name": "Apollo" },
  "dam": { "id": 2, "name": "Luna" }
}
```

#### Rodowód konia
```http
GET /api/horses/5/pedigree/2
```

Response:
```json
{
  "id": 5,
  "name": "Bella",
  "breed": "xxoo",
  "gender": "klacz",
  "sire": {
    "id": 2,
    "name": "Apollo",
    "breed": "oo",
    "sire": { "id": 1, "name": "Grandfather", "breed": "oo" },
    "dam": { "id": 6, "name": "Grandmother", "breed": "xx" }
  },
  "dam": {
    "id": 3,
    "name": "Luna",
    "breed": "xx"
  }
}
```

## 🏗 Struktura projektu

```
horse-pedigree-api/
├── 📁 src/                          # Kod źródłowy backend
│   ├── 📁 config/                   # Konfiguracje
│   │   ├── db.js                   # Konfiguracja bazy danych
│   │   └── db-test.js              # Konfiguracja bazy testowej
│   ├── 📁 controllers/              # Kontrolery API
│   │   ├── countryController.js    # Kontroler krajów
│   │   ├── breederController.js    # Kontroler hodowców
│   │   ├── horseController.js      # Kontroler koni (główny)
│   │   ├── colorController.js      # Kontroler maści
│   │   └── breedController.js      # Kontroler ras
│   ├── 📁 routes/                   # Definicje tras
│   │   ├── countryRoutes.js        # Trasy krajów
│   │   ├── breederRoutes.js        # Trasy hodowców
│   │   ├── horseRoutes.js          # Trasy koni
│   │   ├── colorRoutes.js          # Trasy maści
│   │   └── breedRoutes.js          # Trasy ras
│   ├── 📁 services/                 # Logika biznesowa
│   │   └── pedigreeService.js      # Serwis rodowodów i krzyżowania
│   ├── 📁 migrations/               # Migracje bazy danych
│   │   ├── 202506200001_create_countries.js
│   │   ├── 202506200002_create_breeds.js
│   │   ├── 202506200003_create_colors.js
│   │   ├── 202506200004_create_breeders.js
│   │   ├── 202506200005_create_horses.js
│   │   └── 202506200006_add_unique_constraints.js
│   ├── 📁 seeds/                    # Dane inicjalne
│   │   ├── 01_countries.js         # Kraje
│   │   ├── 02_breeds.js            # Rasy
│   │   ├── 03_colors.js            # Maści
│   │   ├── 04_breeders.js          # Hodowcy
│   │   └── 05_horses.js            # Konie
│   └── app.js                      # Główna aplikacja Express
├── 📁 public/                       # Frontend statyczny
│   ├── index.html                  # Główny HTML
│   ├── styles.css                  # Style CSS
│   ├── scripts.js                  # JavaScript frontend
│   └── 📁 assets/                   # Zasoby statyczne
│       └── favicon.ico
├── 📁 __tests__/                    # Wszystkie testy
│   ├── 📁 backend/                  # Testy API
│   ├── 📁 frontend/                 # Testy UI
│   ├── 📁 integration/              # Testy integracyjne
│   └── 📁 utils/                    # Narzędzia testowe
├── 🐳 docker-compose.yml            # Orkiestracja Docker
├── 🐳 Dockerfile                    # Obraz aplikacji
├── ⚙️ knexfile.js                   # Konfiguracja Knex
├── ⚙️ jest.config.js                # Konfiguracja testów
├── 📦 package.json                  # Zależności i skrypty
└── 📖 README.md                     # Dokumentacja
```

## 🧬 Reguły hodowlane

System automatycznie oblicza rasę potomstwa na podstawie ras rodziców zgodnie z następującymi regułami:

### Tabela krzyżowania ras

| Ojciec | Matka | Potomstwo |
|--------|-------|-----------|
| oo     | oo    | oo        |
| oo     | xo    | xo        |
| oo     | xx    | xxoo      |
| xx     | xx    | xx        |
| xx     | xo    | xo        |
| xx     | xxoo  | xxoo      |
| oo     | xxoo  | xxoo      |

### Dodatkowe reguły symetryczne
- **xo + oo** → xo
- **xx + oo** → xxoo
- **xo + xx** → xo
- **xxoo + xx** → xxoo
- **xxoo + oo** → xxoo
- **xo + xo** → xo
- **xxoo + xo** → xxoo
- **xxoo + xxoo** → xxoo

### Walidacja krzyżowania

System sprawdza i zapobiega:
- ✅ **Inbred** - krzyżowanie blisko spokrewnionych koni
- ✅ **Parent-child** - krzyżowanie rodzica z dzieckiem
- ✅ **Self-breeding** - próby ustawienia tego samego konia jako ojca i matki
- ✅ **Gender validation** - ojcem może być tylko ogier, matką tylko klacz
- ✅ **Cyclic relations** - zapobiega cyklicznym relacjom rodzinnym

### Poziomy ryzyka

- 🟢 **LOW** - brak pokrewieństwa, bezpieczne krzyżowanie
- 🟡 **MEDIUM** - dalsze pokrewieństwo, umiarkowane ryzyko
- 🔴 **HIGH** - bliskie pokrewieństwo lub rodzeństwo, wysokie ryzyko

## 📊 Dane testowe

Po uruchomieniu `npm run seed` w bazie zostają utworzone przykładowe dane:

### Kraje
- 🇵🇱 Polska (PL)
- 🇩🇪 Niemcy (DE)
- 🇺🇸 Stany Zjednoczone (US)
- 🇫🇷 Francja (FR)
- 🇬🇧 Wielka Brytania (GB)

### Rasy
- **oo** - Koń półkrwi polskiej
- **xx** - Koń pełnej krwi angielskiej
- **xo** - Mieszaniec
- **xxoo** - Mieszaniec złożony

### Maści
- Gniada, Kara, Siwa, Kasztanowata, Izabelowata

### Przykładowe konie
Tworzone są konie z różnymi rasami i relacjami rodzinnymi do demonstracji funkcjonalności.

## 🔧 Konfiguracja

### Zmienne środowiskowe

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/horse_pedigree
DATABASE_TEST_URL=postgresql://user:password@localhost:5432/horse_pedigree_test

# Server
PORT=3000
HOST=localhost
NODE_ENV=development

# Testing
DEBUG_TESTS=false
```

### Dostosowywanie

1. **Baza danych** - edytuj `knexfile.js`
2. **Porty** - zmień w `docker-compose.yml`
3. **Testy** - konfiguruj w `jest.config.js`
4. **Walidacja** - dostosuj schematy Joi w kontrolerach

## 🚀 Deployment

### Docker Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Manual Deployment
1. Utwórz bazę PostgreSQL
2. Ustaw zmienne środowiskowe
3. Uruchom migracje: `npm run migrate`
4. Uruchom aplikację: `npm start`

## 🛡 Bezpieczeństwo

- ✅ Input validation z Joi
- ✅ SQL injection prevention (Knex.js parameterized queries)
- ✅ XSS protection (input sanitization)
- ✅ Rate limiting
- ✅ Error handling bez leakowania informacji
- ✅ CORS configuration

## 📈 Monitoring

### Health Check
```http
GET /api/health
```

Zwraca:
- Status aplikacji
- Połączenie z bazą danych
- Statystyki liczby rekordów
- Metryki pamięci i czasu działania
- Listę dostępnych endpointów

### Logging
- Request/response logging
- Error tracking z ID
- Performance metrics
- Database query monitoring

## 🤝 Contributing

1. Fork projektu
2. Utwórz branch: `git checkout -b feature/AmazingFeature`
3. Commit zmian: `git commit -m 'Add AmazingFeature'`
4. Push branch: `git push origin feature/AmazingFeature`
5. Otwórz Pull Request

### Guidelines
- Pisz testy dla nowych funkcji
- Dokumentuj zmiany w API
- Zachowaj istniejący style kodu
- Aktualizuj README jeśli potrzeba

## 📝 Changelog

### v1.1.0 (Current)
- ✅ Kompletne pokrycie testowe
- ✅ Breeding validation system
- ✅ HTML pedigree visualization
- ✅ API versioning (v1)
- ✅ Enhanced error handling
- ✅ Performance optimizations

### v1.0.0
- ✅ Basic CRUD operations
- ✅ Breed calculation rules
- ✅ Pedigree generation
- ✅ Frontend interface
- ✅ Docker setup

## 📄 License

MIT License - szczegóły w pliku `LICENSE`

## 👥 Authors

- **Student Name** - *Initial work* - [GitHub](https://github.com/username)

## 🙏 Acknowledgments

- Zadanie zaliczeniowo-egzaminacyjne
- PostgreSQL community
- Node.js ecosystem
- Jest testing framework
- Express.js framework

## 🆘 Support

W przypadku problemów:

1. Sprawdź [Issues](https://github.com/repo/issues)
2. Przeczytaj dokumentację API
3. Uruchom testy: `npm test`
4. Sprawdź logi: `npm run logs`
5. Zrestartuj serwis: `npm run db:fresh`

---

**🐎 Horse Pedigree API** - Profesjonalna baza rodowodowa koni z automatycznym obliczaniem ras i walidacją krzyżowania.

docker-compose down -v
docker-compose up -d
sleep 10
npm run migrate
npm run seed
npm start