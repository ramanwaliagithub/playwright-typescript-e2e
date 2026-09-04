# RBP admin credentials aren't rotated on the app itself — automationintesting.online is a
# shared public training instance other people also use, so changing its real admin password
# would break it for them. This just moves the same credential values out of a plaintext
# CodeBuild environment variable and into SSM Parameter Store (SecureString, encrypted under
# the default AWS-managed key) — Standard-tier parameters and AWS-managed-key decrypts are both
# free, unlike Secrets Manager's flat per-secret monthly charge.
variable "rbp_admin_username" {
  description = "RBP admin username for the nightly regression run. Supplied at apply time via TF_VAR_rbp_admin_username — never committed."
  type        = string
  sensitive   = true
}

variable "rbp_admin_password" {
  description = "RBP admin password for the nightly regression run. Supplied at apply time via TF_VAR_rbp_admin_password — never committed."
  type        = string
  sensitive   = true
}

variable "rbp_base_url" {
  description = "Base URL of the RBP instance under test."
  type        = string
  default     = "https://automationintesting.online"
}

resource "aws_ssm_parameter" "admin_username" {
  name  = "/${var.project}/ADMIN_USERNAME"
  type  = "SecureString"
  value = var.rbp_admin_username

  tags = {
    Project   = var.project
    ManagedBy = "terraform"
  }
}

resource "aws_ssm_parameter" "admin_password" {
  name  = "/${var.project}/ADMIN_PASSWORD"
  type  = "SecureString"
  value = var.rbp_admin_password

  tags = {
    Project   = var.project
    ManagedBy = "terraform"
  }
}

resource "aws_ssm_parameter" "base_url" {
  name  = "/${var.project}/BASE_URL"
  type  = "String"
  value = var.rbp_base_url

  tags = {
    Project   = var.project
    ManagedBy = "terraform"
  }
}
