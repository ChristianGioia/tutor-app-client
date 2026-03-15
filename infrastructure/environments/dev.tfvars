# Development environment configuration
# Usage: terraform plan -var-file=environments/dev.tfvars

# DigitalOcean API token (set via environment variable or command line)
# do_token = "dop_v1_xxx"  # DO NOT commit real tokens!

# Environment
environment = "dev"

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
auth0_domain    = "dev-ywrtrgfwmzj8ecd7.us.auth0.com"
auth0_client_id = "UXFHDrbdRgfeaJacx1Xsg9PQN9LHJVJt"
auth0_audience  = "https://api.tutor-app.com"

# Instance sizing (smallest for dev)
instance_size  = "apps-s-1vcpu-0.5gb"
instance_count = 1
database_size  = "db-s-1vcpu-1gb"
