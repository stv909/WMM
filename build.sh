#!/bin/bash

cd FrontEnd/MultMessenger_content/
rm -rf *
cd ..
cp -r MultMessenger_code/* MultMessenger_content
cd MultMessenger_content
perl -pi -e "s/Settings.version = 'dev'/Settings.version = 'content'/g" messenger.Settings.js
perl -pi -e "s/version = 'dev'/version = 'content'/g" messenger.Settings.ts
cd ..

cd MultMessenger_release/
rm -rf *
cd ..
cp -r MultMessenger_code/* MultMessenger_release
cd MultMessenger_release
perl -pi -e "s/Settings.version = 'dev'/Settings.version = 'release'/g" messenger.Settings.js
perl -pi -e "s/version = 'dev'/version = 'release'/g" messenger.Settings.ts
cd ..

#cd MultMessenger_english/
#rm -rf *
#cd ..
#cp -r MultMessenger_code/* MultMessenger_english
#cd MultMessenger_english
#perl -pi -e "s/settings.version = 'dev'/settings.version = 'english'/g" settings.js
#cd ..