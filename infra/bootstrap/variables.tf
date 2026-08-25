variable "aws_region" {
  description = "AWS region for the Terraform state backend."
  type        = string
  default     = "us-east-1"
}

variable "project" {
  description = "Short project name used to prefix resource names and tags."
  type        = string
  default     = "rbp-e2e"
}
