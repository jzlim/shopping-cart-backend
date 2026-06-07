# ecr.tf — the private container registry the ECS task pulls its image from.
#
# Using Amazon ECR (rather than a public registry) is what lets the task pull its
# image entirely over AWS's private network via VPC endpoints (see endpoints.tf),
# with no internet egress at all — the most secure option.

resource "aws_ecr_repository" "app" {
  name = var.app_name

  # IMMUTABLE tags can't be overwritten once pushed, so a given tag (e.g. a commit
  # SHA) always refers to the exact same image — no silent drift between deploys.
  image_tag_mutability = "IMMUTABLE"

  # Scan each image for known CVEs on push — defence in depth alongside the Trivy
  # scan already running in CI.
  image_scanning_configuration {
    scan_on_push = true
  }

  # Demo convenience: allow `terraform destroy` to remove the repo even if it still
  # holds images. A production repo would usually set this to false to prevent
  # accidental deletion.
  force_delete = true
}
