#!/bin/bash

cd FrontEnd/MultMessenger_content/
rm -rf *
cd ..
cp -r MultMessenger_code/* MultMessenger_content
cd MultMessenger_content
perl -pi -e "s/settings.version = 'dev'/settings.version = 'content'/g" settings.js
cd ..

cd MultMessenger_release/
rm -rf *
cd ..
cp -r MultMessenger_code/* MultMessenger_release
cd MultMessenger_release
perl -pi -e "s/settings.version = 'dev'/settings.version = 'release'/g" settings.js
cd ..