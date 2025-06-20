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
