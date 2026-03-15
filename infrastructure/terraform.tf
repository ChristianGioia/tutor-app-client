# Terraform and provider version requirements
# https://developer.hashicorp.com/terraform/language/style

terraform {
  required_version = ">= 1.7"

  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
  }

  # Uncomment to use remote state storage (recommended for teams)
  # backend "s3" {
  #   endpoint                    = "syd1.digitaloceanspaces.com"
  #   key                         = "terraform.tfstate"
  #   bucket                      = "tutor-app-terraform-state"
  #   region                      = "us-east-1"  # Required but ignored for DO Spaces
  #   skip_credentials_validation = true
  #   skip_metadata_api_check     = true
  #   skip_requesting_account_id  = true
  #   skip_s3_checksum            = true
  # }
}
