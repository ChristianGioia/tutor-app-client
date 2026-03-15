# Input variable declarations (alphabetical order)
# https://developer.hashicorp.com/terraform/language/style

variable "app_name" {
  description = "Name of the application (used for resource naming)"
  type        = string
  default     = "tutor-app"
}

variable "auth0_audience" {
  description = "Auth0 API audience/identifier"
  type        = string
}

variable "auth0_client_id" {
  description = "Auth0 application client ID for the frontend"
  type        = string
}

variable "auth0_domain" {
  description = "Auth0 tenant domain (e.g., your-tenant.auth0.com)"
  type        = string
}

variable "database_size" {
  description = "Size slug for the managed PostgreSQL database"
  type        = string
  default     = "db-s-1vcpu-1gb"
}

variable "deploy_branch" {
  description = "Git branch to deploy from"
  type        = string
  default     = "main"
}

variable "do_token" {
  description = "DigitalOcean API token"
  type        = string
  sensitive   = true
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "github_owner" {
  description = "GitHub username or organization that owns the repositories"
  type        = string
  default     = "ChristianGioia"
}

variable "github_repo_api" {
  description = "GitHub repository name for the API"
  type        = string
  default     = "tutor-app-api"
}

variable "github_repo_client" {
  description = "GitHub repository name for the frontend client"
  type        = string
  default     = "tutor-app-client"
}

variable "instance_count" {
  description = "Number of instances for the API service"
  type        = number
  default     = 1
}

variable "instance_size" {
  description = "Size slug for the API service instance"
  type        = string
  default     = "apps-s-1vcpu-0.5gb"
}

variable "region" {
  description = "DigitalOcean region for deployment"
  type        = string
  default     = "syd1"

  validation {
    condition = contains([
      "nyc1", "nyc3", "ams3", "sfo3", "sgp1", "lon1", "fra1", "tor1", "blr1", "syd1"
    ], var.region)
    error_message = "Region must be a valid DigitalOcean region."
  }
}
