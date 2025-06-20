# Horse Pedigree API

REST API and frontend for managing a horse pedigree database.

## Prerequisites
- Node.js (v16 or higher)
- Docker
- PostgreSQL

## Setup
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd horse-pedigree-api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start PostgreSQL using Docker:
   ```bash
   docker-compose up -d
   ```

4. Run migrations:
   ```bash
   npm run migrate
   ```

5. Run seeds:
   ```bash
   npm run seed
   ```

6. Start the application in development mode:
   ```bash
   npm run dev
   ```

7. Access the frontend at `http://localhost:3000`.

## Testing
1. Run tests with coverage:
   ```bash
   npm test
   ```

2. Tests are located in the `__tests__` folder:
   - Backend tests: `__tests__/backend/*.test.js`
   - Frontend tests: `__tests__/frontend/*.test.js`

3. A temporary test database is created and destroyed automatically during testing.

## API Endpoints
- **Countries**: `/api/countries`
- **Breeders**: `/api/breeders`
- **Horses**: `/api/horses`
- **Colors**: `/api/colors`
- **Breeds**: `/api/breeds`
- **Pedigree**: `/api/horses/:id/pedigree/:depth`
- **Offspring**: `/api/horses/:id/offspring?gender=<gender>&breeder_id=<id>`
- **Pedigree HTML**: `/api/horses/:id/pedigree/html/:depth`

## Frontend
- Located in the `public/` folder.
- Features a dashboard with horse listings, forms for adding/editing entities, pedigree visualization, and offspring filtering.
- Accessible at `http://localhost:3000`.

## Notes
- Ensure `knexfile.js` is present in the project root for migrations and seeds.
- PostgreSQL runs in a Docker container. Verify connection details in `knexfile.js` and `docker-compose.yml`.
- Tests require a running PostgreSQL instance.


# Plan B - reset całej bazy
docker-compose down -v
docker-compose up -d
sleep 10
npm run migrate
npm run seed
npm start