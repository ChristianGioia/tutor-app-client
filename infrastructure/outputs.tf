# Output value declarations (alphabetical order)

output "app_id" {
  description = "ID of the DigitalOcean App"
  value       = digitalocean_app.main.id
}

output "app_url" {
  description = "Default URL of the deployed application (frontend)"
  value       = digitalocean_app.main.live_url
}

output "api_url" {
  description = "URL of the API service"
  value       = "${digitalocean_app.main.live_url}/api"
}

output "auth0_callback_url" {
  description = "Callback URL to configure in Auth0"
  value       = "${digitalocean_app.main.live_url}/callback"
}

output "auth0_logout_url" {
  description = "Logout URL to configure in Auth0"
  value       = digitalocean_app.main.live_url
}

output "database_host" {
  description = "Database cluster hostname"
  value       = digitalocean_database_cluster.main.host
}

output "database_name" {
  description = "Name of the application database"
  value       = digitalocean_database_db.main.name
}

output "database_port" {
  description = "Database cluster port"
  value       = digitalocean_database_cluster.main.port
}

output "database_url" {
  description = "Full database connection string"
  value       = digitalocean_database_cluster.main.uri
  sensitive   = true
}

output "database_user" {
  description = "Database application user"
  value       = digitalocean_database_user.app.name
}

output "project_id" {
  description = "ID of the DigitalOcean Project"
  value       = digitalocean_project.main.id
}
