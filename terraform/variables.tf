### PROVIDER VARS ###
variable "aws_account_number" {
  type        = string
  description = "Account number"
}
variable "aws_region" {
  type        = string
  description = "AWS region where resources will be created"
}
variable "aws_profile" {
  type        = string
  description = "AWS profile used to create resources"
}
### APP VARS ###
variable "environment" {
  type        = string
  description = "Environment name (e.g., dev, sandbox, prod)"
}
variable "product_key" {
  type        = string
  description = "ASU product key."
}
