#!/usr/bin/env bash
# Commits the working tree after every turn, so no work is lost between prompts.
set -e
cd "${CLAUDE_PROJECT_DIR:-.}"
git add -A
git diff --cached --quiet && exit 0
git commit -q -m "autocommit $(date -Iseconds)"
