# outputs.tf — values surfaced after an apply. These are the contract between the
# infrastructure and the CD pipeline: cd.yml reads the cluster and service names
# (via `terraform output -raw ...`) so the deploy step never hard-codes them.

output "ecs_cluster_name" {
  description = "ECS cluster name — consumed by the CD pipeline (cd.yml) to target the deployment."
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "ECS service name — consumed by the CD pipeline to force a new deployment."
  value       = aws_ecs_service.app.name
}

output "alb_dns_name" {
  description = "Public DNS name of the load balancer — the API's entry point (http://<dns>/)."
  value       = aws_lb.main.dns_name
}

output "ecr_repository_url" {
  description = "ECR repository URL — where the CD pipeline would push the image for ECS to pull."
  value       = aws_ecr_repository.app.repository_url
}
