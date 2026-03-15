# DigitalOcean App Platform application
# Deploys both frontend (static site) and backend (service) with database

resource "digitalocean_app" "main" {
  spec {
    name   = local.resource_prefix
    region = var.region

    # Domain configuration (optional - uncomment to add custom domain)
    # domain {
    #   name = "tutorapp.example.com"
    #   type = "PRIMARY"
    # }

    # ===========================================
    # Frontend: React SPA (Static Site)
    # ===========================================
    static_site {
      name              = "client"
      build_command     = "npm install && npm run build"
      output_dir        = "dist"
      catchall_document = "index.html"

      github {
        repo           = "${var.github_owner}/${var.github_repo_client}"
        branch         = var.deploy_branch
        deploy_on_push = true
      }

      # Build-time environment variables (VITE_ prefix required for Vite)
      env {
        key   = "VITE_AUTH0_DOMAIN"
        value = var.auth0_domain
        type  = "GENERAL"
      }

      env {
        key   = "VITE_AUTH0_CLIENT_ID"
        value = var.auth0_client_id
        type  = "GENERAL"
      }

      env {
        key   = "VITE_AUTH0_CALLBACK_URL"
        value = "https://${local.resource_prefix}.ondigitalocean.app/callback"
        type  = "GENERAL"
      }

      env {
        key   = "VITE_AUTH0_AUDIENCE"
        value = var.auth0_audience
        type  = "GENERAL"
      }

      env {
        key   = "VITE_API_BASE_URL"
        value = "https://${local.resource_prefix}.ondigitalocean.app/api"
        type  = "GENERAL"
      }

      # Serve frontend at root path
      routes {
        path                 = "/"
        preserve_path_prefix = false
      }
    }

    # ===========================================
    # Backend: Express.js API (Service)
    # ===========================================
    service {
      name               = "api"
      instance_count     = var.instance_count
      instance_size_slug = var.instance_size
      http_port          = 3000

      github {
        repo           = "${var.github_owner}/${var.github_repo_api}"
        branch         = var.deploy_branch
        deploy_on_push = true
      }

      # Use Dockerfile for building
      dockerfile_path = "Dockerfile"

      # Health check configuration
      health_check {
        http_path             = "/health"
        initial_delay_seconds = 10
        period_seconds        = 10
        timeout_seconds       = 5
        success_threshold     = 1
        failure_threshold     = 3
      }

      # Runtime environment variables
      env {
        key   = "NODE_ENV"
        value = "production"
        type  = "GENERAL"
      }

      env {
        key   = "PORT"
        value = "3000"
        type  = "GENERAL"
      }

      env {
        key   = "AUTH0_DOMAIN"
        value = var.auth0_domain
        type  = "GENERAL"
      }

      env {
        key   = "AUTH0_AUDIENCE"
        value = var.auth0_audience
        type  = "GENERAL"
      }

      env {
        key   = "FRONTEND_URL"
        value = "https://${local.resource_prefix}.ondigitalocean.app"
        type  = "GENERAL"
      }

      # Database URL is injected automatically via database binding
      # But we can also reference it explicitly if needed
      env {
        key   = "DATABASE_URL"
        value = digitalocean_database_cluster.main.uri
        type  = "SECRET"
      }

      # Serve API at /api path
      routes {
        path                 = "/api"
        preserve_path_prefix = true
      }
    }

    # ===========================================
    # Database binding (connects App to managed DB)
    # ===========================================
    database {
      name         = "db"
      engine       = "PG"
      production   = var.environment == "prod" ? true : false
      cluster_name = digitalocean_database_cluster.main.name
    }
  }

  depends_on = [
    digitalocean_database_cluster.main
  ]
}

# ===========================================
# Project for resource organization
# ===========================================
resource "digitalocean_project" "main" {
  name        = local.resource_prefix
  description = "Tutor App - ${var.environment} environment"
  purpose     = "Web Application"
  environment = var.environment == "prod" ? "Production" : "Development"

  resources = [
    digitalocean_app.main.urn,
    digitalocean_database_cluster.main.urn
  ]
}
