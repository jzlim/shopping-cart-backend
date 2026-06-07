# ecs.tf — the compute: an ECS Fargate cluster running the containerised API.
#
# Three pieces:
#   cluster         — a logical grouping the service runs in (no servers to manage
#                     with Fargate; AWS provisions the compute on demand).
#   task definition — the blueprint: which image, how much CPU/RAM, which ports,
#                     env vars, log config, and which IAM roles.
#   service         — keeps `desired_count` copies of the task running, replaces
#                     unhealthy ones, and registers them with the load balancer.

resource "aws_ecs_cluster" "main" {
  name = "${var.app_name}-cluster"
}

# Where the container's stdout/stderr go. ECS streams logs here via the awslogs
# driver configured on the task below.
resource "aws_cloudwatch_log_group" "app" {
  name              = "/ecs/${var.app_name}"
  retention_in_days = 14 # don't keep logs forever — caps storage cost
}

resource "aws_ecs_task_definition" "app" {
  family                   = var.app_name
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc" # required for Fargate; gives the task its own ENI/IP
  cpu                      = var.cpu
  memory                   = var.memory

  # Two distinct roles (see iam.tf): the platform uses execution_role to pull the
  # image + write logs; the app runs as task_role (which has no permissions here).
  execution_role_arn = aws_iam_role.execution.arn
  task_role_arn      = aws_iam_role.task.arn

  # The container spec is a JSON document; jsonencode keeps it type-checked and
  # readable instead of an inline here-string.
  container_definitions = jsonencode([
    {
      name      = var.app_name
      image     = "${aws_ecr_repository.app.repository_url}:${var.image_tag}"
      essential = true

      portMappings = [
        {
          containerPort = var.container_port
          protocol      = "tcp"
        }
      ]

      # Non-secret config goes in `environment`. Secrets (DB passwords, API keys)
      # would instead use `secrets` pulling from SSM Parameter Store / Secrets
      # Manager, so they never appear in the task definition or logs, e.g.:
      #   secrets = [{ name = "API_KEY", valueFrom = "arn:aws:ssm:...:parameter/api-key" }]
      environment = [
        { name = "NODE_ENV", value = "production" }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.app.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])
}

resource "aws_ecs_service" "app" {
  name            = "${var.app_name}-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  # Run the tasks in the PRIVATE subnets with no public IP — they are reachable
  # only through the ALB, never directly from the internet.
  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.task.id]
    assign_public_ip = false
  }

  # Wire the running tasks into the load balancer's target group.
  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = var.app_name
    container_port   = var.container_port
  }

  # The listener must exist before the service registers targets against it.
  depends_on = [aws_lb_listener.http]
}
