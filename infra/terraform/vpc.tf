# vpc.tf — the private network and its public/private subnet split.
#
# Mental model: the VPC is a fenced-off network (10.0.0.0/16). Inside it are two
# kinds of subnets:
#   - public  — has a route to the internet gateway; the load balancer lives here.
#   - private — has NO direct internet route; the application container lives here
#               so it can never be reached from the internet except through the ALB.
# Two of each, in two Availability Zones, so a single AZ outage doesn't take the
# whole service down.

# Look up which AZs exist in the chosen region instead of hard-coding names
# (e.g. "us-east-1a"), so the config stays portable across regions.
data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_vpc" "main" {
  cidr_block = var.vpc_cidr

  # Required so ECS tasks and the ALB can resolve internal DNS names.
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = { Name = "${var.app_name}-vpc" }
}

# The internet gateway is the VPC's door to the public internet. Only the public
# subnets route through it.
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${var.app_name}-igw" }
}

# Public subnets — 10.0.0.0/24 and 10.0.1.0/24. `map_public_ip_on_launch` gives
# resources here a public IP automatically (the ALB needs to be reachable).
resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = { Name = "${var.app_name}-public-${count.index}" }
}

# Private subnets — 10.0.10.0/24 and 10.0.11.0/24. No public IPs, no internet
# route: this is where the application task runs, hidden from the internet.
resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = { Name = "${var.app_name}-private-${count.index}" }
}

# Route table for the public subnets: send all non-local traffic (0.0.0.0/0) to
# the internet gateway.
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = { Name = "${var.app_name}-public-rt" }
}

# Attach that route table to both public subnets.
resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route table for the private subnets. It has NO route to the internet — only the
# implicit local (in-VPC) route, plus the S3 gateway endpoint route that
# endpoints.tf adds automatically. The application therefore has zero outbound
# internet access; it reaches AWS services (ECR, CloudWatch) privately through
# VPC endpoints instead. See endpoints.tf and the README "Private egress" section.
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${var.app_name}-private-rt" }
}

resource "aws_route_table_association" "private" {
  count          = 2
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}
