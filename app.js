#!/usr/bin/env node

const XT = require('@cogsmith/xt').Init();
const App = XT.App; const LOG = XT.LOG;
XT.Log.SetLevel('warn');

//

const Zest = require('./lib');

//

const NODE = {};
NODE.fs = require('fs');
NODE.http = require('http');

const LIB = {};
LIB.mocha = require('mocha'); const mocha = LIB.mocha;
LIB.chalk = require('chalk'); const chalk = LIB.chalk;

//

App.InitLog = function () {
    XT.Log.SetLevel('warn');
}

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

App.Main = async function () {
    await Zest.AppMain(App);
}

App.Run();
