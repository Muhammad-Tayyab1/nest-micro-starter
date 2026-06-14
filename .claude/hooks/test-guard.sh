#!/usr/bin/env bash
# Runs unit tests before committing.
# Prevents committing broken tests.

pnpm test 2>&1
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
  echo "ERROR: Tests are failing. Fix tests before committing."
  exit 1
fi

echo "All tests passed."
