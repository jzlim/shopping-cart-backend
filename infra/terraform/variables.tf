# variables.tf — all tunable inputs to the configuration.
#
# Every value the design might reasonably change lives here with a sensible
# default, so the same code can describe dev/staging/prod by overriding a few
# variables rather than editing resource definitions.

variable "aws_region" {
  description = "AWS region to deploy into."
  type        = string
  default     = "us-east-1"
}

variable "app_name" {
  description = "Short name used to prefix and tag every resource."
  type        = string
  default     = "shopping-cart-api"
}

variable "image_tag" {
  description = <<-EOT
    Tag of the image the ECS task runs. The full reference is built from the ECR
    repository URL (see ecr.tf) + this tag. A real CD run would override it with
    the immutable commit-SHA tag (see ../../.github/workflows/cd.yml).
  EOT
  type        = string
  default     = "latest"
}

variable "container_port" {
  description = "Port the application listens on inside the container."
  type        = number
  default     = 3000
}

variable "cpu" {
  description = "Fargate task CPU units (256 = 0.25 vCPU)."
  type        = number
  default     = 256
}

variable "memory" {
  description = "Fargate task memory in MiB (must be a valid pairing with cpu)."
  type        = number
  default     = 512
}

variable "desired_count" {
  description = "How many copies of the task the service keeps running."
  type        = number
  default     = 1
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC. /16 leaves plenty of room to carve subnets."
  type        = string
  default     = "10.0.0.0/16"
}
