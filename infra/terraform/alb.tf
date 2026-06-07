# alb.tf — the Application Load Balancer: the single public entry point.
#
# Traffic flow: internet -> ALB (port 80) -> target group -> container (port 3000).
# The ALB lives in the public subnets and is the ONLY thing exposed to the
# internet; it forwards to the container, which stays private.

resource "aws_lb" "main" {
  name               = "${var.app_name}-alb"
  internal           = false # internet-facing
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id # spread across both public subnets

  tags = { Name = "${var.app_name}-alb" }
}

# A target group is the set of "backends" the ALB forwards to, plus the rule for
# deciding which are healthy. target_type = "ip" because Fargate's awsvpc
# networking gives each task its own private IP (there are no EC2 instances to
# register).
resource "aws_lb_target_group" "app" {
  name        = "${var.app_name}-tg"
  port        = var.container_port
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  # Hit the app's /health endpoint; a task must answer 200 twice to be marked
  # healthy and start receiving traffic, and fail three times to be pulled out.
  health_check {
    path                = "/health"
    matcher             = "200"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }

  tags = { Name = "${var.app_name}-tg" }
}

# The listener is what actually accepts connections on port 80 and forwards them
# to the target group. (A production setup would listen on 443 with an ACM TLS
# certificate and redirect 80 -> 443; see README "Trade-offs".)
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}
