# Managed PostgreSQL database cluster

resource "digitalocean_database_cluster" "main" {
  name       = "${local.resource_prefix}-db"
  engine     = "pg"
  version    = "15"
  size       = var.database_size
  region     = var.region
  node_count = 1

  tags = [var.app_name, var.environment]
}

# Create a database within the cluster
resource "digitalocean_database_db" "main" {
  cluster_id = digitalocean_database_cluster.main.id
  name       = local.database_name
}

# Create a database user for the application
resource "digitalocean_database_user" "app" {
  cluster_id = digitalocean_database_cluster.main.id
  name       = "${var.app_name}_app"
}

# Firewall rule to allow connections from App Platform
resource "digitalocean_database_firewall" "main" {
  cluster_id = digitalocean_database_cluster.main.id

  rule {
    type  = "app"
    value = digitalocean_app.main.id
  }
}
