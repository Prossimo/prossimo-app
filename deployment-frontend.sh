#!/bin/bash
export NODE_ENV = development
cd /var/app/prossimo-app
git pull origin
yarn
npm run build
mv dist/ /var/www/html/