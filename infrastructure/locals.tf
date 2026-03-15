# Local value declarations

locals {
  # Common tags for resource organization
  common_tags = {
    Environment = var.environment
    ManagedBy   = "Terraform"
    Project     = var.app_name
  }

  # Resource naming convention
  resource_prefix = "${var.app_name}-${var.environment}"

  # Database naming
  database_name = "${var.app_name}_${var.environment}"
}
