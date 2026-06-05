# Technical Assessment: Backend Engineer

## Overview

Build a shopping cart REST API demonstrating clean architecture, design patterns, DevOps practices, and infrastructure
knowledge. You will design the complete system from domain modeling to infrastructure as code, implementing
automated CI/CD pipelines and demonstrating how deployment would work.

Time Allocation: 7 days
Submission: Public GitHub repository with README

## Requirements

### 1. Backend Service (TypeScript + Clean Architecture) - 60 %

Build a REST API supporting shopping cart operations with emphasis on design patterns, architecture, and domain
modeling.

API Endpoints

typescript

```
POST /api/cart/:sessionId/items // Add product to cart
GET /api/cart/:sessionId // Get cart contents
POST /api/cart/:sessionId/checkout // Checkout cart
DELETE /api/cart/:sessionId/items/:itemId // Remove item from cart
```

Domain Modeling

You are responsible for designing the complete domain model. This includes:

```
Product/Item entities and value objects
Cart aggregate with business rules
Checkout process and result
Money/Price value objects
Any other domain concepts you identify
```

This is a key part of the assessment - we want to see how you model the business domain.

Consider:

```
What should be an entity vs value object?
What are the aggregate boundaries?
What business rules need to be enforced?
How do you handle money calculations?
What invariants must the Cart protect?
Should quantities have their own type?
```

Architecture Requirements

Clean Architecture Layers:

```
domain/ # Business entities and rules (no dependencies)
├── entities/
├── repositories/ (interfaces)
└── errors/
```

```
usecases/ # Application business rules
├── AddItemToCart.ts
├── GetCart.ts
└── CheckoutCart.ts
```

```
adapters/ # Interface adapters
├── controllers/
├── presenters/
└── repositories/ (implementations)
```

```
infrastructure/ # Frameworks and drivers
├── server.ts
├── routes.ts
└── storage/
```

Design Patterns to Demonstrate

Required:

```
Repository Pattern - Abstract data access
Dependency Injection - Loose coupling between layers (via factory functions or constructors)
Use Case Pattern - Encapsulate business logic in composable functions
Factory Functions - Create and compose use cases and services
Value Objects - Money, ProductId (immutable domain concepts)
```

Note: Factory functions and functional composition are preferred over class-based approaches, but both styles are
acceptable if implemented well.

Technical Requirements

```
Clear separation of concerns (testable business logic)
In-memory storage is fine (focus on design, not persistence)
Comprehensive unit tests for domain logic (entities, value objects, use cases)
Adapter tests for external service integrations
No integration tests needed - main app should connect or crash by design
Test files placed alongside source files (not separate tests/ folder)
Input validation with proper error handling
Type safety throughout (no any types)
```

```
Functional programming style with factory functions is preferred, but class-based OOP is also acceptable
```

Example: Demonstrate Your Design Skills

typescript

```
// Show us you understand:
// 1. Dependency inversion
// 2. Single responsibility
// 3. Testable code structure
```

```
// domain/repositories/CartRepository.ts
export interface CartRepository {
findBySessionId(sessionId: string): Promise<Cart | null>
save(cart: Cart): Promise<void>
}
```

```
// usecases/AddItemToCart.ts
export type AddItemToCart = {
execute: (request: AddItemRequest) => Promise<Cart>
}
```

```
export const createAddItemToCart = (
cartRepository: CartRepository,
productValidator: ProductValidator
): AddItemToCart => {
return {
execute: async (request: AddItemRequest): Promise<Cart> => {
// Business logic here - fully testable without infrastructure
const cart = await cartRepository.findBySessionId(request.sessionId)
const validatedProduct = await productValidator.validate(request.product)
// ... business logic
await cartRepository.save(cart)
return cart
}
}
}
```

```
// Note: Classes are also acceptable if that's your style
// We value clean design over specific syntax preferences
```

### 2. Docker Setup - 10 %

Docker Files Structure:

```
infra/docker/
├── dev/
│ └── Dockerfile # Development dockerfile
├── prod/
│ └── Dockerfile # Production dockerfile (multi-stage, optimized)
└── ci/
└── Dockerfile # CI-specific dockerfile for testing
```

Note: If your deployment doesn't require Docker (e.g., AWS Lambda), leave the docker folder empty but keep the
structure.

infra/docker/prod/Dockerfile - Multi-stage Build (Required if using containers)

dockerfile

```
# Production dockerfile with:
# - Multi-stage build
# - Minimal final image size (<100MB)
# - Non-root user
# - Proper layer caching
# - Security best practices
```

docker-compose.yml - Local Development Only

yaml

```
# This is for local development testing ONLY
# NOT for deployment - deployment uses Terraform provisioned infrastructure
```

```
services:
app:
build:
context: ../..
dockerfile: infra/docker/dev/Dockerfile
environment:
NODE_ENV: development
volumes:
```

- ../../src:/app/src # Hot reload
  ports:
- "3000:3000"

What we're evaluating:

```
Multi-stage builds for production (if using containers)
Image optimization techniques
Security practices (non-root, minimal base image)
Separation of dev, prod, and ci environments
Docker layer caching strategy
```

### 3. CI/CD Pipeline (GitHub Actions) - 15 %

CI Pipeline (.github/workflows/ci.yml)

Triggers: Pull requests to main

Required Jobs:

yaml

```
jobs:
lint:
# ESLint, Prettier checks
```

```
type-check:
# TypeScript compilation check
```

```
test:
# Unit tests for domain logic (entities, value objects, use cases)
# Adapter tests for external services
# Coverage report (>70% on domain layer)
```

```
build:
# Build Docker image using infra/docker/ci/Dockerfile
# Validate Dockerfile.prod
```

```
security:
# npm audit
# Docker image scanning (Trivy/Snyk)
```

Must demonstrate:

```
Job parallelization (faster feedback)
Caching strategies (npm cache, Docker layers)
Fail fast on critical issues
Coverage reporting for domain tests
Matrix strategy (Node versions - optional)
```

CD Pipeline (.github/workflows/cd.yml)

Triggers: Push to main branch

Required Steps:

yaml

```
jobs:
build-and-push:
# Build Docker image using infra/docker/prod/Dockerfile
# Tag with version (git sha, semantic version)
# Push to container registry (ECR/Docker Hub/GHCR)
```

```
deploy:
needs: build-and-push
# Show how deployment would work with your Terraform infrastructure
# If Terraform defines ECS → show ECS update commands
# If Terraform defines Lambda → show function deployment
# Document the deployment steps even if not executing them
```

Must demonstrate:

```
Build and push Docker image
Image tagging strategy
How deployment would align with your Terraform infrastructure
Environment variables/secrets handling
You can use comments/documentation to show deployment steps
```

### 4. Infrastructure Design (Terraform) - 15 %

Write Terraform code to demonstrate your infrastructure knowledge. Actual provisioning/deployment is not required -
we want to see that you understand infrastructure concepts and can express them in code.

Terraform Structure

```
infra/
├── terraform/
│ ├── main.tf
│ ├── variables.tf
│ ├── outputs.tf
│ ├── [your-resources].tf
│ └── README.md
├── docker/
│ ├── dev/
│ ├── prod/
│ └── ci/
└── docker-compose.yml # Local dev only
```

What We're Evaluating

Infrastructure Knowledge

```
What cloud services are needed for your backend
How to structure network isolation (VPC, subnets)
Security group rules and access control
Where compute resources should be placed (public vs private subnets)
Understanding of common issues (e.g., service in wrong VPC can't access resources)
```

Terraform as Knowledge Demonstration

```
Write Terraform code showing the infrastructure you'd provision
Proper resource definitions
Variables and outputs usage
Show you can translate infrastructure concepts into IaC
```

Security at Design Time

```
How you protect the backend service from the internet
Network segmentation strategy
IAM roles and least-privilege
What's exposed publicly and what stays private
```

CD Pipeline Connection (Most Important)

```
Your CD workflow should show how it would deploy to this infrastructure
Even if you don't actually provision, document the deployment flow
If Terraform defines ECS, CD shows ECS deployment steps
If Terraform defines Lambda, CD shows Lambda deployment
Demonstrate you understand how infrastructure and deployment connect
```

Requirements

Terraform Code (Required)

```
Write .tf files for your infrastructure design
Include basic security measures
Document in README what each component does
Explain your security decisions
```

Actual Provisioning (Not Required)

```
You do NOT need to terraform apply and deploy
You do NOT need a working live environment
We're testing your infrastructure knowledge, not ops skills
Focus on correct Terraform syntax and good design
```

CD Pipeline Alignment (Required)

```
Your CD workflow should reference the infrastructure
Show you understand the deployment flow
Document how CD would work with your infrastructure
```

Deployment Options Choose whatever makes sense:

```
Container-based (ECS Fargate, ECS EC2)
Serverless (Lambda + API Gateway)
Traditional compute (EC2)
```

We want to see you understand concepts like VPC, private subnets, security groups, and can recognize when
infrastructure decisions cause problems.

## Project Structure

shopping-cart-api/
├── .github/workflows/
│ ├── ci.yml # PR validation pipeline
│ └── cd.yml # Deployment pipeline
│
├── docs/ # Documentation and diagrams
│ ├── domain-model.md # Entity/aggregate design
│ └── architecture.md # Architecture decisions
│
├── src/
│ ├── domain/ # Pure business logic
│ │ ├── entities/
│ │ │ ├── Cart.ts
│ │ │ └── Cart.spec.ts # Tests alongside code
│ │ ├── value-objects/
│ │ │ ├── Money.ts
│ │ │ └── Money.spec.ts
│ │ ├── repositories/
│ │ └── errors/
│ ├── usecases/
│ │ ├── AddItemToCart.ts
│ │ ├── AddItemToCart.spec.ts # Tests alongside code
│ │ ├── GetCart.ts
│ │ ├── GetCart.spec.ts
│ │ └── CheckoutCart.ts
│ ├── adapters/
│ │ ├── controllers/
│ │ ├── presenters/
│ │ └── repositories/
│ │ ├── InMemoryCartRepository.ts
│ │ └── InMemoryCartRepository.spec.ts
│ └── infrastructure/
│ ├── server.ts
│ ├── routes.ts
│ └── storage/
│
├── infra/
│ ├── terraform/ # Infrastructure as Code
│ │ ├── main.tf
│ │ ├── variables.tf
│ │ ├── outputs.tf
│ │ ├── vpc.tf
│ │ ├── ecs.tf
│ │ ├── alb.tf

```
│ │ └── README.md
│ ├── docker/ # Docker configurations
│ │ ├── dev/
│ │ │ └── Dockerfile # Development
│ │ ├── prod/
│ │ │ └── Dockerfile # Production (multi-stage)
│ │ └── ci/
│ │ └── Dockerfile # CI/testing
│ └── docker-compose.yml # Local dev only
│
├── package.json
├── tsconfig.json
└── README.md
```

Note: This project structure is for illustrating the organization ideas. Adapt it to your approach - don't copy it directly.

## Evaluation Breakdown

### Backend Architecture & Domain Design ( 60 %)

```
Domain Modeling (20%)
Entity and aggregate design
Value objects implementation
Business rules encapsulation
Domain-driven design principles
Clean Architecture (20%)
Layer separation and responsibilities
Dependency direction (inward)
Framework independence
Testability of business logic
Design Patterns & SOLID (15%)
Appropriate pattern usage
Dependency injection/inversion
Single responsibility
Code organization and readability
Testing (5%)
Unit test coverage for domain logic (>70%)
Adapter tests for external service integration
Test quality and meaningfulness
Tests placed alongside source code
```

### Docker ( 10 %)

```
Multi-stage build optimization
Image size (<100MB goal)
Security practices (non-root, minimal base)
docker-compose for local development
Layer caching strategy
```

### CI/CD Pipeline ( 15 %)

```
Workflow design and efficiency
Automated testing integration
Build and deployment automation
Caching and parallelization
Secrets and environment management
```

### Infrastructure Design & Documentation ( 15 %)

```
Infrastructure knowledge via Terraform code (5%)
CD pipeline design and alignment (5%)
Documentation quality (5%)
```

## Deliverables Checklist

### Code

```
Clean architecture implementation
Design patterns demonstrated
Comprehensive domain and adapter tests (*.spec.ts placed alongside code)
infra/docker/prod/Dockerfile with multi-stage build (if using containers)
infra/docker/dev/Dockerfile for development (if using containers)
infra/docker/ci/Dockerfile for CI (if using containers)
docker-compose.yml for local dev (in infra/ folder)
CI workflow (linting, testing, building)
CD workflow (showing deployment to infrastructure)
Terraform code demonstrating infrastructure design (actual provisioning not required)
```

### Documentation (README.md)

Required Sections:

1. Domain Model Design Most Important

```
Entity and aggregate diagram (visual representation)
Show relationships between entities
Identify aggregate roots
Mark aggregate boundaries
Value objects explanation
Which concepts are value objects and why
Immutability and equality rules
Business rules and invariants
What rules does the Cart enforce?
How are they protected?
Why you modeled it this way
Trade-offs considered
Alternative designs rejected
Domain events (if used)
What events exist
When are they raised
```

2. Architecture Overview

```
Layer responsibilities diagram
```

```
Design patterns used and why
Dependency flow
Key architectural decisions
```

3. Design Patterns Implemented

```
List patterns with brief explanation
Code examples of key patterns
Why each pattern was chosen
```

4. Docker Setup

```
How Dockerfile.prod is optimized
Image size achieved
Separation of dev and prod dockerfiles
docker-compose usage for local development
```

5. CI/CD Pipeline

```
Pipeline architecture diagram
What each workflow does
How CI builds and tests
How CD deploys to Terraform infrastructure
Secrets and environment variables setup
```

6. Infrastructure Design

```
Infrastructure diagram showing components
What cloud services are needed and why
Security measures (VPC, subnets, security groups, IAM)
How you protect the backend service
How CD pipeline would deploy to this infrastructure
Explanation of your Terraform code structure
```

7. Local Development

```
Prerequisites (Node, Docker, Terraform, etc.)
docker-compose up instructions
Running tests locally
Hot reload setup
```

8. API Documentation

```
Endpoints with examples
Request/response schemas
Error responses
```

9. Deployment Strategy

```
How your Terraform infrastructure would be provisioned
How CD pipeline would deploy the application
Environment configuration approach
What the deployment flow would look like
```

10. Trade-offs & Improvements

```
What you prioritized
What you'd add with more time
Known limitations
```

## Example: What Good Looks Like

### Excellent Domain Model Example

typescript

// domain/value-objects/Money.ts
export type Money = {
readonly amount: number
readonly currency: string
}

export const createMoney = (amount: number, currency = 'USD'): Money => {
if (amount < 0 ) throw new Error('Money amount cannot be negative')
return { amount, currency }
}

export const addMoney = (a: Money, b: Money): Money => {
if (a.currency !== b.currency) throw new Error('Currency mismatch')
return createMoney(a.amount + b.amount, a.currency)
}

// domain/entities/Cart.ts
export type Cart = {
readonly sessionId: string
readonly items: ReadonlyArray<CartItem>
readonly createdAt: Date
readonly updatedAt: Date
}

export type CartItem = {
readonly productId: string
readonly name: string
readonly price: Money
readonly quantity: number
}

// Cart is an aggregate root - all operations go through it
export const createCart = (sessionId: string): Cart => ({
sessionId,
items: [],
createdAt: new Date(),
updatedAt: new Date()
})

export const addItemToCart = (cart: Cart, item: CartItem): Cart => {
// Business rule: validate quantity
if (item.quantity <= 0 ) {
throw new Error('Quantity must be positive')
}

```
// Business rule: check if item already exists
const existingIndex = cart.items.findIndex(
i => i.productId === item.productId
)
```

```
if (existingIndex >= 0 ) {
// Update quantity of existing item
const updatedItems = [...cart.items]
updatedItems[existingIndex] = {
...updatedItems[existingIndex],
quantity: updatedItems[existingIndex].quantity + item.quantity
}
return { ...cart, items: updatedItems, updatedAt: new Date() }
}
```

```
// Add new item
return {
...cart,
items: [...cart.items, item],
updatedAt: new Date()
}
}
```

```
export const calculateTotal = (cart: Cart): Money => {
return cart.items.reduce(
(total, item) => addMoney(
total,
createMoney(item.price.amount * item.quantity, item.price.currency)
),
createMoney( 0 )
)
}
```

```
// Pure functions, immutable data, business rules enforced
```

### Excellent Dockerfile (infra/docker/prod/Dockerfile)

dockerfile

```
# infra/docker/prod/Dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY..
RUN npm run build
```

```
# Production stage
FROM node:20-alpine AS production
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
WORKDIR /app
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./
USER nodejs
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

```
# Result: ~50-80MB image, non-root, optimized layers
```

### Excellent CI Workflow Structure

yaml

name: CI
on: [pull_request]

jobs:

# Fast feedback first

lint:
runs-on: ubuntu-latest
steps:

- uses: actions/checkout@v
- uses: actions/setup-node@v
  with:
  node-version: '20'
  cache: 'npm'
- run: npm ci
- run: npm run lint

# Run in parallel

test:
runs-on: ubuntu-latest
steps:

- uses: actions/checkout@v
- uses: actions/setup-node@v
  with:
  node-version: '20'
  cache: 'npm'
- run: npm ci
- run: npm run test:coverage
- name: Upload coverage
  uses: codecov/codecov-action@v

# Build validates Dockerfile

build:
runs-on: ubuntu-latest
steps:

- uses: actions/checkout@v
- name: Build Docker image
  run: docker build -t app:test.
- name: Check image size
  run: |
  SIZE=$(docker images app:test --format "{{.Size}}")
  echo "Image size: $SIZE"

### Example: Testing with Factory Functions

typescript

```
// src/usecases/AddItemToCart.spec.ts (placed alongside AddItemToCart.ts)
import { describe, it, expect } from 'vitest'
import { createAddItemToCart } from './AddItemToCart'
import { createInMemoryCartRepository } from '@/adapters/repositories/InMemoryCartRepository'
```

```
describe('AddItemToCart', () => {
it('should add item to existing cart', async () => {
// Arrange
const cartRepo = createInMemoryCartRepository()
const addItemToCart = createAddItemToCart(cartRepo, mockValidator)
```

```
// Act
const result = await addItemToCart.execute({
sessionId: 'session-123',
product: { productId: 'p1', name: 'Item', price: 100 , quantity: 1 }
})
```

```
// Assert
expect(result.items).toHaveLength( 1 )
expect(result.totalAmount).toBe( 100 )
})
})
```

```
// No mocking needed - pure dependency injection with factories
// Tests use .spec.ts extension and are placed right next to the code they test
```

### Excellent CD Workflow Structure

yaml

name: CD
on:
push:
branches: [main]

jobs:
build-and-push:
runs-on: ubuntu-latest
steps:

- uses: actions/checkout@v
- name: Set up Docker Buildx
  uses: docker/setup-buildx-action@v
- name: Login to ECR
  uses: aws-actions/amazon-ecr-login@v
- name: Build and push
  uses: docker/build-push-action@v
  with:
  context:.
  file: infra/docker/prod/Dockerfile
  push: true
  tags: |
  ${{ secrets.ECR_REGISTRY }}/shopping-cart:latest
${{ secrets.ECR_REGISTRY }}/shopping-cart:${{ github.sha }}
cache-from: type=registry,ref=${{ secrets.ECR_REGISTRY }}/shopping-cart:buildcache
  cache-to: type=registry,ref=${{ secrets.ECR_REGISTRY }}/shopping-cart:buildcache,mode=max

deploy:
needs: build-and-push
runs-on: ubuntu-latest
steps:

- uses: actions/checkout@v
- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v
  with:
  aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
  aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
  aws-region: us-east- 1
- name: Deploy to ECS via Terraform
  working-directory: infra/terraform

```
run: |
terraform init
terraform apply -auto-approve \
-var="image_tag=${{ github.sha }}"
```

- name: Health check
  run: |

# Wait and verify deployment

echo "Checking health of deployed service..."

## What We're Really Evaluating

### Strong Candidate Shows:

1. Domain Modeling Excellence (Primary Focus)

```
Thoughtful entity and aggregate design
Proper use of value objects (Money, ProductId, etc.)
Business rules encapsulated in the domain
Clear understanding of DDD concepts
Invariants protected at aggregate boundaries
Domain events or side effects properly handled
```

2. Software Design Skills

```
Business logic isolated and testable
Appropriate use of patterns (not over-engineering)
No framework coupling in domain layer
Clear separation of concerns
Dependency inversion principle applied
Factory functions or clean DI implementation
```

3. DevOps Competence

```
Optimized Docker builds (understands layers)
Efficient CI/CD (parallel jobs, caching)
Security scanning integrated
Clear deployment strategy matching Terraform infrastructure
Automated testing in pipeline
```

4. Infrastructure Knowledge

```
Understanding of cloud services and architecture
Security design (VPC, subnets, security groups)
Recognition of infrastructure issues
Terraform as demonstration of understanding
CD pipeline alignment with infrastructure design
```

5. Production Readiness

```
Health checks implemented
Graceful shutdown
Structured logging
Comprehensive error handling
Environment-based configuration
```

6. Communication

```
Clear explanation of domain model choices
Documents architectural trade-offs
Explains design patterns used and why
Provides good examples in documentation
```

## Submission Guidelines

### GitHub Repository Requirements:

```
Public repository
Clean commit history with meaningful messages
Working GitHub Actions (visible in Actions tab)
Complete README.md
No sensitive data committed
```

### Submission Includes:

1. GitHub repository URL
2. README with complete documentation
3. Brief explanation of:
   Design decisions made
   Infrastructure choices and security measures
   How CD would deploy to your infrastructure
   Challenges faced and trade-offs

## FAQ

Q: How much time should I spend on this?
A: You have 7 days to submit.

Q: Can I use a different language than TypeScript?
A: TypeScript is required for this assessment as it's our primary backend language.

Q: Do I need to deploy to production?
A: No, actual deployment is not required. Write Terraform code to demonstrate your infrastructure knowledge and show
how your CD pipeline would deploy to it. We're testing your understanding of infrastructure concepts, not requiring a
live environment.

Q: Should I use a real database?
A: No, in-memory storage is fine. We're evaluating domain design and architecture, not database skills.

Q: Do you provide the data models?
A: No, designing the domain model is a key part of this assessment. We want to see your entity and aggregate design
skills.

Q: How much test coverage is expected?
A: Aim for >70% coverage on domain logic. Focus on meaningful unit tests for domain and adapter tests for external
services. No integration tests needed.

Q: Can I use frameworks like NestJS?
A: Yes, but show that you understand the underlying patterns. Don't let the framework dictate your domain architecture.

Q: What if I run out of time?
A: Document what you would have done in your README. We value quality over completeness. Prioritize domain

modeling and architecture first.

## Notes

```
Domain modeling is the most critical part - spend the most time here
Design the entities, aggregates, and value objects thoughtfully
Document your thought process and trade-offs
Show us how you organize code for maintainability
Use in-memory storage; persistence is not the goal
Infrastructure is intentionally simplified - focus on architecture
```

Remember: This is a Backend/DevOps role, but we're hiring for strong domain modeling and architecture skills first.
Show us you can design well-structured systems AND ship them reliably.

Questions? Document all assumptions in your README. We value clear communication and thoughtful engineering!
