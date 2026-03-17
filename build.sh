#!/bin/bash
set -e

echo "=== BeraPanel Production Build ==="

echo "1/3 Installing dependencies..."
pnpm install --frozen-lockfile

echo "2/3 Building frontend..."
pnpm --filter @workspace/berapanel run build

echo "3/3 Building API server (+ copying frontend)..."
pnpm --filter @workspace/api-server run build

echo "=== Build complete ==="
echo "Run with: node artifacts/api-server/dist/index.cjs"
