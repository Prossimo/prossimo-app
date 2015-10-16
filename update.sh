#!/bin/bash

git checkout master
git pull origin master
npm install
bower install
grunt build
