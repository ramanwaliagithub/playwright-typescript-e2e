# GitHub personal access token CodeBuild uses to authenticate its source credential against
# this repo. Passed at apply time via the TF_VAR_github_token env var — never committed, never
# hardcoded. No aws_codebuild_source_credential is created until a token is supplied.
variable "github_token" {
  description = "GitHub PAT for CodeBuild's source credential. Required before the first apply that creates the source credential."
  type        = string
  sensitive   = true
  default     = null
}

resource "aws_codebuild_source_credential" "github" {
  count       = var.github_token != null ? 1 : 0
  auth_type   = "PERSONAL_ACCESS_TOKEN"
  server_type = "GITHUB"
  token       = var.github_token
}

# buildspec.yml doesn't exist in the repo yet — CodeBuild only reads it when a build actually
# runs, not at Terraform-apply time. It's added when the scheduled regression suite is wired up.
resource "aws_codebuild_project" "regression" {
  name          = "${var.project}-regression"
  description   = "Scheduled full regression suite for ${var.project}"
  service_role  = aws_iam_role.codebuild.arn
  build_timeout = 30

  artifacts {
    type = "NO_ARTIFACTS"
  }

  environment {
    compute_type                = "BUILD_GENERAL1_SMALL"
    image                       = "aws/codebuild/standard:7.0"
    type                        = "LINUX_CONTAINER"
    image_pull_credentials_type = "CODEBUILD"
  }

  logs_config {
    cloudwatch_logs {
      group_name = aws_cloudwatch_log_group.codebuild.name
    }
  }

  source {
    type            = "GITHUB"
    location        = "https://github.com/ramanwaliagithub/playwright-typescript-e2e.git"
    buildspec       = "buildspec.yml"
    git_clone_depth = 1
  }

  tags = {
    Project   = var.project
    ManagedBy = "terraform"
  }

  depends_on = [aws_codebuild_source_credential.github]
}
