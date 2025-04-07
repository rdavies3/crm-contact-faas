#!/bin/bash

set -e

ENV=${1:-sandbox}
ENV_FILE="env.${ENV}.json"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Env file $ENV_FILE not found."
  exit 1
fi

echo "⏳ Starting Step Functions Local Docker container..."
docker run -d --rm -p 8083:8083 --name stepfunctions-local amazon/aws-stepfunctions-local

sleep 3  # Give the container time to boot

echo "📜 Registering local state machine..."
aws --endpoint-url http://localhost:8083 stepfunctions create-state-machine \
  --name contact-parallel-query \
  --definition file://statemachines/contact-parallel-query.asl.json \
  --role-arn arn:aws:iam::012345678901:role/DummyExecutionRole > /dev/null

echo "🚀 Invoking Lambda with env: $ENV"
AWS_PROFILE=sfdev-sandbox sam local invoke ContactGetHandler \
  --env-vars $ENV_FILE \
  -e events/test-get-contact-asuriteid.json

echo "🧹 Stopping Step Functions Local..."
docker stop stepfunctions-local > /dev/null

echo "✅ Done."