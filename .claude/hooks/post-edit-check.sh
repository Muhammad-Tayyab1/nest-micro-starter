#!/usr/bin/env bash
# Runs lint after every file edit.

pnpm lint 2>&1
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
  echo "ERROR: Lint check failed. Fix lint errors before proceeding."
  exit 1
fi

echo "Lint check passed."
