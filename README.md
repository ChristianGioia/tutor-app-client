# Tutor App Client

React + TypeScript + Vite frontend application for the Tutor App, with Auth0 authentication and integration with the Tutor App API.

## Tech Stack

- **React 19** + **TypeScript**
- **Vite** - Build tool with HMR
- **React Router** - Client-side routing
- **Auth0** - Authentication
- **Emotion** - Styled components

## Prerequisites

- Node.js 18+
- Running Tutor App API (see below)

## Full Development Setup

This guide covers setting up the complete development environment including the database, API, and client.

### 1. Start the Database

Navigate to the API directory and start PostgreSQL using Docker:

```bash
cd ../tutor-app-api
docker-compose up -d
```

This starts PostgreSQL on `localhost:5432` with:
- Database: `tutor_app`
- User: `postgres`
- Password: `postgres`

Verify the database is running:
```bash
docker-compose ps
```

### 2. Setup and Start the API

#### Install API dependencies:
```bash
cd ../tutor-app-api
npm install
```

#### Configure environment variables:
```bash
cp .env.example .env
```

Update `.env` with your Auth0 credentials:
- `AUTH0_DOMAIN` - Your Auth0 domain
- `AUTH0_AUDIENCE` - Your Auth0 API identifier

#### Run database migrations:
```bash
npm run prisma:generate
npm run db:push
```

#### Start the API server:
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

Verify the API is running:
```bash
curl http://localhost:3000/health
```

### 3. Setup and Start the Client

#### Install client dependencies:
```bash
cd ../tutor-app-client
npm install
```

#### Configure environment variables:
```bash
cp .env.example .env.local
```

Update `.env.local` with your Auth0 credentials:
- `VITE_AUTH0_DOMAIN` - Your Auth0 domain
- `VITE_AUTH0_CLIENT_ID` - Your Auth0 client ID
- `VITE_AUTH0_AUDIENCE` - Your Auth0 API identifier (same as API)
- `VITE_API_BASE_URL` - API base URL (default: `http://localhost:3000/api`)

#### Start the development server:
```bash
npm run dev
```

The client will be available at `http://localhost:5173`

## Development Scripts

- `npm run dev` - Start development server with HMR
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_AUTH0_DOMAIN` | Auth0 tenant domain | `your-tenant.auth0.com` |
| `VITE_AUTH0_CLIENT_ID` | Auth0 application client ID | `abc123...` |
| `VITE_AUTH0_CALLBACK_URL` | Auth0 callback URL | `http://localhost:5173/callback` |
| `VITE_AUTH0_AUDIENCE` | Auth0 API audience/identifier | `https://api.tutorapp.com` |
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:3000/api` |

## Quick Start (All Services)

To start everything in one go, open three terminal windows:

**Terminal 1 - Database:**
```bash
cd ../tutor-app-api
docker-compose up -d
```

**Terminal 2 - API:**
```bash
cd ../tutor-app-api
npm run dev
```

**Terminal 3 - Client:**
```bash
cd ../tutor-app-client
npm run dev
```

## Auth0 Configuration

### 1. Create an Auth0 Application

1. Go to your Auth0 Dashboard
2. Navigate to **Applications > Applications**
3. Click **Create Application**
4. Choose **Single Page Application**
5. Configure:
   - **Allowed Callback URLs**: `http://localhost:5173/callback`
   - **Allowed Logout URLs**: `http://localhost:5173`
   - **Allowed Web Origins**: `http://localhost:5173`

### 2. Create an Auth0 API

1. Navigate to **Applications > APIs**
2. Click **Create API**
3. Configure:
   - **Name**: Tutor App API
   - **Identifier**: `https://api.tutorapp.com`
   - **Signing Algorithm**: RS256

### 3. Update Environment Variables

Use the values from Auth0 in both `.env.local` (client) and `../tutor-app-api/.env` (API).

## Project Structure

```
tutor-app-client/
├── src/
│   ├── components/      # Reusable React components
│   ├── pages/          # Page components
│   ├── App.tsx         # Main application component
│   └── main.tsx        # Application entry point
├── public/             # Static assets
├── .env.local          # Environment variables (git-ignored)
├── .env.example        # Environment template
├── index.html          # HTML entry point
├── vite.config.ts      # Vite configuration
└── package.json

Related:
../tutor-app-api/       # Backend API (Express + PostgreSQL)
```

## Troubleshooting

### API Connection Issues

- Verify the API is running: `curl http://localhost:3000/health`
- Check `VITE_API_BASE_URL` in `.env.local`
- Check browser console for CORS errors

### Auth0 Issues

- Verify callback URLs match in Auth0 dashboard
- Ensure `VITE_AUTH0_AUDIENCE` matches the API audience
- Check Auth0 tenant domain format (should not include `https://`)

### Database Issues

- Verify Docker is running: `docker ps`
- Check database container: `cd ../tutor-app-api && docker-compose logs`
- Restart database: `docker-compose restart`

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Deployment to DigitalOcean

This project includes Terraform infrastructure-as-code for deploying to DigitalOcean App Platform.

### Prerequisites

1. **DigitalOcean Account** with API token
2. **Terraform CLI** installed (>= 1.7)
3. **GitHub App** connected to DigitalOcean (for auto-deploy)
4. **Auth0 Application** configured

### Quick Deploy

```bash
# Navigate to infrastructure directory
cd infrastructure

# Initialize Terraform
terraform init

# Set your DigitalOcean token
export TF_VAR_do_token="your-digitalocean-api-token"

# Preview changes
terraform plan -var-file=environments/dev.tfvars

# Deploy
terraform apply -var-file=environments/dev.tfvars
```

### Configuration

Edit `infrastructure/environments/dev.tfvars` with your values:

```hcl
auth0_domain    = "your-tenant.auth0.com"
auth0_client_id = "your-client-id"
auth0_audience  = "your-api-audience"
```

### Post-Deployment

After deploying, update your Auth0 Application settings:

1. Get the deployed app URL:
   ```bash
   terraform output app_url
   ```

2. In Auth0 Dashboard, add to your application:
   - **Allowed Callback URLs**: `https://tutor-app-dev.ondigitalocean.app/callback`
   - **Allowed Logout URLs**: `https://tutor-app-dev.ondigitalocean.app`
   - **Allowed Web Origins**: `https://tutor-app-dev.ondigitalocean.app`

### Useful Terraform Commands

```bash
# View all outputs
terraform output

# View sensitive outputs (like database URL)
terraform output -raw database_url

# Destroy infrastructure
terraform destroy -var-file=environments/dev.tfvars
```

### Architecture

```
DigitalOcean App Platform
├── Static Site (tutor-app-client)
│   └── React SPA served from /
├── Service (tutor-app-api)
│   └── Express.js API served from /api
└── Managed PostgreSQL Database
```

### Estimated Costs

| Resource | Monthly Cost |
|----------|--------------|
| App Platform (Static + Service) | ~$12-17 |
| Managed PostgreSQL | ~$15 |
| **Total** | ~$27-32/month |

## Additional Resources

- [Vite Documentation](https://vite.dev/)
- [React Documentation](https://react.dev/)
- [Auth0 React SDK](https://auth0.com/docs/quickstart/spa/react)
- [API Documentation](../tutor-app-api/README.md)
- [DigitalOcean App Platform](https://docs.digitalocean.com/products/app-platform/)
- [Terraform DigitalOcean Provider](https://registry.terraform.io/providers/digitalocean/digitalocean/latest/docs)
