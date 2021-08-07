#!/usr/bin/env node

const XT = require('@cogsmith/xt').Init();
const App = XT.App; const LOG = XT.LOG;

App.InitArgs = function () {
    // App.Argy = yargs(process.argv);
}

App.InitInfo = function () {
    // App.SetInfo('App', function () { return 'ZEST' });
}

App.InitData = function () {
}

App.Init = function () {
}

App.InitDone = function () {
}

App.Main = function () {
    LOG.INFO('ZEST');
}

App.Run();
