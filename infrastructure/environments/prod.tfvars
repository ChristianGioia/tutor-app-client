# Production environment configuration
# Usage: terraform plan -var-file=environments/prod.tfvars

# DigitalOcean API token (set via environment variable or command line)
# do_token = "dop_v1_xxx"  # DO NOT commit real tokens!

# Environment
environment = "prod"

# Region (Sydney for Australia)
region = "syd1"

# Application naming
app_name = "tutor-app"

# GitHub repositories
github_owner       = "ChristianGioia"
github_repo_client = "tutor-app-client"
github_repo_api    = "tutor-app-api"
deploy_branch      = "main"

# Auth0 configuration (replace with your values)
auth0_domain    = "YOUR_AUTH0_DOMAIN.auth0.com"
auth0_client_id = "YOUR_AUTH0_CLIENT_ID"
auth0_audience  = "YOUR_AUTH0_AUDIENCE"

# Instance sizing (production - adjust as needed)
instance_size  = "apps-s-1vcpu-1gb"
instance_count = 2
database_size  = "db-s-1vcpu-2gb"
