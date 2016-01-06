#!/bin/bash

# This script uses environment name to select a proper update strategy:
# - production (default): branch release, tags only
# - staging: branch develop
# - development: branch master

update_strategy="production"
target_branch="release"
build_command="build"
tags_required=true
latest_tag=""

# Get environment name from CLI argument
if test $1
then
    update_strategy=$1
fi

echo "Update status: started. Env: $update_strategy. Started at $(date)"

# Set proper values for `target_branch` and `tags_required`
if test $update_strategy = "production"
then
    target_branch="release"
    tags_required=true
    build_command="build"
elif test $update_strategy = "staging"
then
    target_branch="develop"
    tags_required=false
    build_command="build"
elif test $update_strategy = "development"
then
    target_branch="master"
    tags_required=false
    build_command="dev"
else
    echo "Update status: environment could not be recognized, exit"
    exit
fi

echo "Update status: fetching branch $target_branch"
sudo -u www-deployer git checkout $target_branch
sudo -u www-deployer git fetch

echo "Update status: updating to the latest commit in branch $target_branch"
sudo -u www-deployer git merge --ff-only origin/$target_branch

if $tags_required
then
    latest_tag=$(git describe --tags)

    if test $latest_tag
    then
        echo "Update status: latest tag in branch $target_branch is $latest_tag"
        sudo -u www-deployer git checkout $latest_tag
    else
        echo "Update status: no tags found in branch $target_branch, exit"
        exit
    fi
fi

echo "Update status: installing dependencies"
sudo -u www-deployer npm install
sudo -u www-deployer bower install

echo "Update status: starting build"
sudo -u www-deployer grunt $build_command

echo "Update status: finished at $(date)"
