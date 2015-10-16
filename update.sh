#!/bin/bash

git pull origin master
npm install
bower install
grunt build
