const XT = require('@cogsmith/xt').Init();
const LOG = XT.LOG;

//

const NODE = {};
NODE.fs = require('fs');
NODE.http = require('http');

const LIBS = {};
LIBS.mocha = require('mocha'); const mocha = LIBS.mocha;
LIBS.chalk = require('chalk'); const chalk = LIBS.chalk;
LIBS.glob = require('glob'); const glob = LIBS.glob;
LIBS.supertest = require('supertest'); const web = LIBS.supertest('');
LIBS.chai = require('chai'); const should = LIBS.chai.should();

//

/*
const {
    EVENT_RUN_BEGIN,
    EVENT_RUN_END,
    EVENT_TEST_FAIL,
    EVENT_TEST_PASS,
    EVENT_SUITE_BEGIN,
    EVENT_SUITE_END,
    EVENT_TEST_PENDING
} = LIBS.mocha.Runner.constants;
*/

//

const Zest = {};

Zest.DB = { Tests: {} }; //, TestsList: [] };

Zest.GetTests = () => { return XT.Object.List(Zest.DB.Tests); };

Zest.Test = function () {
    let self = this;
    let id = false;
    let test = {};

    if (arguments.length == 0 || arguments.length > 2) { return; }
    if (arguments.length == 1) {
        let dat = arguments[0];
        id = Object.keys(dat)[0];
        test = dat[id];
    }
    if (arguments.length == 2) {
        id = arguments[0];
        let dat = arguments[1];
        if (typeof dat == 'function') { test.FX = dat; }
        if (typeof dat == 'object') {
            if (dat.Web || dat.FX) { test = dat; }
            if (!dat.Web) { dat.Web = {}; }
            if (dat.URL) {
                dat.Web.URL = dat.URL; delete dat.URL;
                if (dat.Input) { dat.Web.Input = dat.Input; delete dat.Input; }
                if (dat.Output) { dat.Web.Output = dat.Output; delete dat.Output; }
            }
            test = dat;
        }
    }

    test.ID = id;
    Zest.DB.Tests[id] = test;

    describe(test.ID, function () {
        describe('Init Tests', function () {
            if (test.Web && test.Web.URL) {
                it('Fetch Data', async function () {
                    res = await web.post(test.Web.URL).send(test.Web.Input).expect(200);
                })
            }
        })

        describe('Data Validation', function () {
            if (test.Web && test.Web.Output) {
                it(test.ID, async function () {
                    res.body.should.eql(test.Web.Output);
                });
            }
        })

        describe('Test Cases', function () {
            if (test.FX) {
                it(test.ID + ' FX', async function () {
                    await test.FX.apply(test, [res]);
                });
            }
        })
    })
}

Zest.IsPortOpen = (port) => new Promise((resolve, reject) => {
    let server = NODE.http.createServer((req, res) => { res.writeHead(200); res.end('HI'); });
    server.on('error', () => { resolve(false); server.close(); });
    server.on('listening', () => { resolve(true); server.close(); });
    server.listen(port, '127.0.0.1');
})

Zest.WaitForPort = (port) => new Promise(async (resolve, reject) => {
    let timer = setInterval(async () => {
        if (await App.IsPortOpen(port)) { clearInterval(timer); resolve(); }
    }, 10);
})

Zest.AppMain = async function (App) {
    //console.clear();

    //console.log('AppArgs', App.Args);

    //console.clear();
    //LOG.WARN('Z');
    //LOG.WARN('ARGS', App.Args);

    let mocha = new LIBS.mocha({ reporter: 'spec', ui: 'bdd', timeout: 10000 });
    mocha.reporter(require('./reporters/full'));

    //

    if (!App.Args.test) { App.Args.test = []; } else if (!Array.isArray(App.Args.test)) { App.Args.test = [App.Args.test]; }
    if (App.Args._.length > 2) { App.Args.test = App.Args.test.concat(App.Args._.slice(2)); }
    if (App.Args.test.length == 0) { App.Args.test = ['test']; }

    //

    for (let t of App.Args.test) {
        if (NODE.fs.existsSync(t)) {
            let dir = process.cwd();
            let js = dir + '/' + t;
            if (!NODE.fs.existsSync(js)) { js = t; }
            if (!NODE.fs.existsSync(js)) { continue; }
            if (NODE.fs.lstatSync(js).isDirectory()) {
                for (let f of glob.sync(js + '/**/*.js')) { App.Args.test.push(f); }
            } else {
                delete require.cache[require.resolve(js.replace('.js', ''))];
                mocha.addFile(js);
            }
        }
    }

    //mocha.addFile('test/test1.js');
    mocha.run(function (fails) {
        //console.log({ RUN: { FAILS: fails, ARGS: arguments } });
        mocha.unloadFiles();
    });

    if (App.Args.loop) {
        if (App.Args.waitport) { await Zest.WaitForPort(App.Args.waitport); }
        setTimeout(Zest.AppMain, 1000);
    }
}

//

module.exports = Zest;
