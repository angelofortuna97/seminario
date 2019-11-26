_TO RUN YOUR APP ON A DEVICE, EXECUTE THE FOLLOWING COMMANDS:_

`Remove all the old node modules, plugins, platforms, www and sourcemaps`
    rm -rf node_modules plugins platforms www .sourcemaps

`Re-install your node modules`
    npm install

`Re-install your Cordova plugins for iOS or Android`
    ionic cordova prepare <platform> 

`Build your app as an Xcode Workspace or .apk`
    ionic cordova build <platform>