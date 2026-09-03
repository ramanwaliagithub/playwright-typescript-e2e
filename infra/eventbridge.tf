# Stays disabled until Phase 10 finishes wiring buildspec.yml — an enabled rule would trigger
# real (currently-guaranteed-to-fail, since buildspec.yml doesn't exist yet) nightly builds and
# needless CodeBuild/log cost. Flip to true once the scheduled regression suite actually works.
variable "schedule_enabled" {
  description = "Whether the nightly EventBridge schedule is active."
  type        = bool
  default     = false
}

variable "schedule_expression" {
  description = "Cron expression (UTC) for the nightly regression run."
  type        = string
  default     = "cron(0 2 * * ? *)"
}

data "aws_iam_policy_document" "eventbridge_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["events.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "eventbridge_codebuild" {
  name               = "${var.project}-eventbridge-codebuild-role"
  assume_role_policy = data.aws_iam_policy_document.eventbridge_assume_role.json

  tags = {
    Project   = var.project
    ManagedBy = "terraform"
  }
}

# Scoped to starting exactly this one CodeBuild project — nothing else.
data "aws_iam_policy_document" "eventbridge_start_build" {
  statement {
    effect    = "Allow"
    actions   = ["codebuild:StartBuild"]
    resources = [aws_codebuild_project.regression.arn]
  }
}

resource "aws_iam_role_policy" "eventbridge_start_build" {
  name   = "${var.project}-eventbridge-start-build"
  role   = aws_iam_role.eventbridge_codebuild.id
  policy = data.aws_iam_policy_document.eventbridge_start_build.json
}

resource "aws_cloudwatch_event_rule" "nightly_regression" {
  name                = "${var.project}-nightly-regression"
  description         = "Triggers the full regression suite on a nightly schedule."
  schedule_expression = var.schedule_expression
  state               = var.schedule_enabled ? "ENABLED" : "DISABLED"
}

resource "aws_cloudwatch_event_target" "codebuild" {
  rule     = aws_cloudwatch_event_rule.nightly_regression.name
  arn      = aws_codebuild_project.regression.arn
  role_arn = aws_iam_role.eventbridge_codebuild.arn
}
