# endpoints.tf — VPC endpoints that let the private tasks reach AWS services
# WITHOUT any internet access.
#
# The problem they solve: the application task runs in private subnets with no
# internet route. To start, it must pull its image from ECR and ship logs to
# CloudWatch — both are AWS services normally reached over the public internet.
# VPC endpoints expose those services *inside* the VPC, so the traffic never
# leaves AWS's network.
#
# Four endpoints are needed to pull an image and log:
#   ecr.api  (interface) — ECR control-plane calls (auth, get image manifest)
#   ecr.dkr  (interface) — the Docker registry pulls themselves
#   logs     (interface) — CloudWatch Logs (the awslogs driver ships here)
#   s3       (gateway)   — ECR stores the actual image layers in S3

locals {
  # Interface endpoints share identical config, so define them once and loop.
  interface_endpoints = ["ecr.api", "ecr.dkr", "logs"]
}

# Firewall for the interface endpoints: accept HTTPS only from the application
# tasks. (Interface endpoints are reached on port 443.)
resource "aws_security_group" "endpoints" {
  name        = "${var.app_name}-vpce-sg"
  description = "Allow HTTPS from the tasks to the interface VPC endpoints"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "HTTPS from the task security group"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.task.id]
  }

  tags = { Name = "${var.app_name}-vpce-sg" }
}

# Interface endpoints place an elastic network interface (a private IP) for the
# service into each private subnet. `private_dns_enabled` makes the normal AWS
# DNS name (e.g. api.ecr.<region>.amazonaws.com) resolve to that private IP, so
# the ECS agent needs no special configuration — it just works privately.
resource "aws_vpc_endpoint" "interface" {
  for_each = toset(local.interface_endpoints)

  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.${each.value}"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.endpoints.id]
  private_dns_enabled = true

  tags = { Name = "${var.app_name}-vpce-${each.value}" }
}

# S3 is reached through a GATEWAY endpoint instead — it adds a route to the
# private route table rather than placing an ENI in the subnets. ECR image layers
# live in S3, so this is required for image pulls to succeed.
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = [aws_route_table.private.id]

  tags = { Name = "${var.app_name}-vpce-s3" }
}
