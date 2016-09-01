#!/bin/bash
source ~/.bash_profile
cd /opt/alfresco-community/tomcat/webapps/Bachmans
npm -g install karma bower
npm -g install "gulpjs/gulp-cli#4.0"
npm install
bower install

