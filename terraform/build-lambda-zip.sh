#!/bin/bash
set -e

ENV=$1
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${SCRIPT_DIR}/.."
ZIP_DIR="${SCRIPT_DIR}/lambda"

if [[ -z "$ENV" ]]; then
  echo "Usage: $0 <environment>"
  exit 1
fi

mkdir -p "$ZIP_DIR"
echo "[INFO] Zips will be saved to: $ZIP_DIR"


echo "🔁 Packaging all Lambdas in $PROJECT_ROOT/lambdas/"
for LAMBDA_DIR in "$PROJECT_ROOT/lambdas"/*; do
  if [[ -d "$LAMBDA_DIR" ]]; then
    LAMBDA_NAME=$(basename "$LAMBDA_DIR")
    ZIP_NAME="${LAMBDA_NAME}-${ENV}.zip"
    ZIP_PATH="${ZIP_DIR}/${ZIP_NAME}"
    LAYER_DIR="$LAMBDA_DIR/opt"

    echo "📦 Zipping Lambda: $LAMBDA_NAME → $ZIP_NAME"

    rm -f "$ZIP_PATH"
    cd "$LAMBDA_DIR"

    echo "📦 Installing production dependencies..."
    npm ci --omit=dev

    echo "📦 Creating zip from git-tracked files..."
    git ls-files -z | xargs -0 zip -q -r "$ZIP_PATH"

    if [ -d "$LAYER_DIR" ]; then
      echo "📦 Including /opt layer content for $LAMBDA_NAME"
      cd "$LAYER_DIR"
      zip -q -r "$ZIP_PATH" ./*
      cd - > /dev/null
    fi

    cd - > /dev/null
    echo "✅ Done: $ZIP_NAME"
  fi
done

echo ""
echo "🔁 Packaging shared layers in .$PROJECT_ROOT/layers/"
for LAYER_DIR in "$PROJECT_ROOT/layers"/*/nodejs; do
  if [[ -d "$LAYER_DIR" ]]; then
    LAYER_PARENT=$(basename "$(dirname "$LAYER_DIR")")
    ZIP_NAME="${LAYER_PARENT}-layer-${ENV}.zip"
    ZIP_PATH="${ZIP_DIR}/${ZIP_NAME}"

    echo "📦 Zipping Layer: $LAYER_PARENT → $ZIP_NAME"

    rm -f "$ZIP_PATH"
    cd "$LAYER_DIR"
    zip -q -r "$ZIP_PATH" .

    cd - > /dev/null

    echo "✅ Done: $ZIP_NAME"
  fi
done

echo ""
echo "🎉 All Lambda and Layer zips ready in $ZIP_DIR"
