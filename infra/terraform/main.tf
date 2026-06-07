# main.tf — provider configuration and the Terraform settings block.
#
# ---------------------------------------------------------------------------
# KNOWLEDGE DEMO ONLY — this configuration is NEVER applied.
# There is no remote state, no AWS credentials, and no `terraform apply` in any
# pipeline. The files exist to demonstrate the infrastructure design in code.
# See README.md for the full explanation.
# ---------------------------------------------------------------------------

terraform {
  # Pin the Terraform CLI and the AWS provider to known-good ranges so the config
  # is reproducible — the same inputs always resolve to the same provider version.
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # State backend is intentionally left as the default (a local `terraform.tfstate`
  # file). In a real deployment this would be an S3 backend with DynamoDB locking,
  # e.g.:
  #
  #   backend "s3" {
  #     bucket         = "my-tf-state"
  #     key            = "shopping-cart/terraform.tfstate"
  #     region         = "us-east-1"
  #     dynamodb_table = "my-tf-locks"   # prevents two people applying at once
  #     encrypt        = true
  #   }
  #
  # Omitted here because nothing is ever applied — see README "Trade-offs".
}

provider "aws" {
  region = var.aws_region

  # Tag every resource automatically so costs and ownership are traceable in the
  # AWS console without repeating tags on each resource.
  default_tags {
    tags = {
      Project   = var.app_name
      ManagedBy = "Terraform"
    }
  }
}
