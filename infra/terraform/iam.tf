# iam.tf — the two IAM roles an ECS Fargate task uses. Splitting them is the
# least-privilege model AWS recommends: each role grants only what its job needs.
#
#   execution role — used by the ECS *platform* (not your code) to start the task:
#                    pull the container image and create/write the log stream.
#   task role      — the identity your *application code* runs as at runtime. It
#                    gets the permissions the app itself needs to call AWS APIs.

# Both roles are assumed by the ECS tasks service — this trust policy says
# "ECS tasks are allowed to act as this role".
data "aws_iam_policy_document" "ecs_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

# --- Execution role -------------------------------------------------------------
resource "aws_iam_role" "execution" {
  name               = "${var.app_name}-execution-role"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume_role.json
}

# AWS publishes a managed policy with exactly the permissions the execution role
# needs (pull image, write logs). Attaching it is the standard, audited approach —
# no hand-rolled policy to get wrong.
resource "aws_iam_role_policy_attachment" "execution" {
  role       = aws_iam_role.execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# --- Task role ------------------------------------------------------------------
# Intentionally has NO policies attached. The application uses in-memory storage
# and calls no AWS service, so it needs zero permissions — the strictest possible
# least privilege. Defining the role anyway (empty) makes the security posture
# explicit and gives a single, obvious place to grant access later (e.g. S3, SQS,
# Secrets Manager) without ever touching the execution role.
resource "aws_iam_role" "task" {
  name               = "${var.app_name}-task-role"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume_role.json
}
