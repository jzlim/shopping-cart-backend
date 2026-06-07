# security.tf — the two firewalls (security groups) that enforce the access rule:
# the internet may talk to the load balancer, and ONLY the load balancer may talk
# to the application container.
#
# A security group is a stateful firewall attached to a resource. "Stateful" means
# return traffic for an allowed inbound request is automatically permitted — you
# only declare the direction you initiate.

# --- ALB security group: the public-facing edge ---------------------------------
resource "aws_security_group" "alb" {
  name        = "${var.app_name}-alb-sg"
  description = "Allow inbound HTTP from the internet to the load balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound (forward requests on to the tasks)"
    from_port   = 0
    to_port     = 0
    protocol    = "-1" # all protocols
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.app_name}-alb-sg" }
}

# --- Task security group: the application container -----------------------------
# The key security control: inbound is allowed ONLY from the ALB's security group,
# not from any IP range. Referencing a security group (instead of a CIDR) means
# "whatever the ALB's private IPs happen to be" — so nothing else in the VPC, and
# nothing on the internet, can reach the container directly.
resource "aws_security_group" "task" {
  name        = "${var.app_name}-task-sg"
  description = "Allow inbound only from the ALB on the application port"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "App port, from the ALB only"
    from_port       = var.container_port
    to_port         = var.container_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "Allow all outbound (image pulls, log shipping)"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.app_name}-task-sg" }
}
