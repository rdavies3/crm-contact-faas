terraform {
  required_version = ">= 1.4.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = ">=2.7"
    }
    null = {
      source  = "hashicorp/null"
      version = ">= 3.1"
    }
  }
  backend "local" {
    path = "terraform.tfstate"
  }
}
provider "aws" {
  region  = var.aws_region
  profile = var.aws_profile
  default_tags { # tflint-ignore: aws_provider_missing_default_tags
    tags = module.product-tags.tags
  }
}
module "product-tags" {
  source  = "jfrog-cloud.devops.asu.edu/asu-terraform-modules__dco-terraform/product-tags/null"
  version = "~> 1.7"

  product_key            = var.product_key
  administrative_contact = "rdavies3"
  technical_contact      = "rdavies3"
  environment            = var.environment
  version_tag            = "1.0.0"
  repository_url         = "https://github.com/ASU/crm-salesforce-rest-api-connector"
}
