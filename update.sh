#!/bin/bash

if [[ `git branch | grep locales-update` ]]
then
  echo "a branch called locales-update already exists"
  git branch -D locales-update
fi

git checkout -b locales-update
node ~/projects/i18n-tools ~/projects/loomio

echo 'DONE'

