#!/bin/bash

if [[ `git branch | grep translations-update` ]]
then
  echo "a branch called translations-update already exists"
  git branch -D translations-update
fi

git checkout -b translations-update
node ~/projects/i18n-tools ~/projects/loomio

echo 'DONE'

