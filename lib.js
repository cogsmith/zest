//process.on('uncaughtException', function (err) { console.log("\n"); console.log(err); console.log("\n"); process.exit(1); }); // throw(Error('ERROR'));
//process.on('unhandledRejection', function (err) { console.log("\n"); console.log(err); console.log("\n"); process.exit(1); }); // throw(Error('ERROR'));

//

const XT = require('@cogsmith/xt').Init();
const LOG = XT.LOG;

//

const NODE = {};
NODE.fs = require('fs');
NODE.http = require('http');
NODE.path = require('path'); const nodepath = NODE.path;

const LIBS = {};
LIBS.mocha = require('mocha'); const mocha = LIBS.mocha;
LIBS.chalk = require('chalk'); const chalk = LIBS.chalk;
LIBS.glob = require('glob'); const glob = LIBS.glob;
LIBS.supertest = require('supertest'); const web = LIBS.supertest('');
LIBS.chai = require('chai'); const should = LIBS.chai.should();
LIBS.blessed = require('blessed'); const blessed = LIBS.blessed;
LIBS.blessedx = require('blessed-contrib'); const blessedx = LIBS.blessedx;

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

Zest.UI = {};

Zest.UI.Render = function () { Zest.UI.Screen.render(); }

Zest.InitUI = function () {
    LOG.WARN('InitUI');
    const screen = blessed.screen({ debug: true, dockBorders: true });
    // screen.key(['q', 'C-c'], function (ch, key) { process.exit(0); });
    screen.key(['q', 'C-c'], function (ch, key) { screen.destroy(); });
    let style = { selected: { fg: 'white', bg: 'red' } };
    //let items = ['[ ALL TESTS ]', 'test/supertest.js', 'test/zest.js'];
    let list = Zest.TestList.map(z => { z = z.replace(process.cwd().replace(/\\/g, '/'), ''); return z.substr(1); });
    let items = ['[ ALL TESTS ]', ...list];
    Zest.Layout = new blessedx.grid({ hideBorders: true, rows: 10, cols: 10, screen: screen });
    const grid = Zest.Layout;
    const head = grid.set(0, 0, 2, 4, blessed.list, { interactive: true, keys: true, style, items });
    const foot = grid.set(2, 0, 8, 4, blessed.box, { content: '' });
    const body = grid.set(0, 4, 10, 6, blessed.box, { style: { bg: '#111111' }, content: '' });
    head.focus();
    head.on('select', (z, i) => {
        if (Zest.TestRunning) { return; }
        foot.content = z.content + "\n";
        let test = i; if (i > 0) { test = z.content; };
        Zest.UI.Head.focus();
        Zest.DoTest(test);
        Zest.UI.Head.focus();
    });
    screen.render();

    Zest.UI.Screen = screen;
    Zest.UI.Head = head;
    Zest.UI.Foot = foot;
    Zest.UI.Body = body;
}


XT.Buffer = function (id) {
    if (!id) { id = 0; }
    console.log(id);
    let buf = XT.Buffer.DB[id];
    if (buf) { buf = buf.substr(0, buf.lenth - 2); }
    return buf;
}

XT.Buffer.DB = {};
XT.Buffer.Get = function (id) { return XT.Buffer(id); }
XT.Buffer.Reset = function (id) { XT.Buffer.DB[id] = ''; };
XT.Buffer.Append = function (id, dat) {
    if (!dat) { dat = id; id = 0; };
    if (!XT.Buffer.DB[id]) { XT.Buffer.DB[id] = ''; }
    XT.Buffer.DB[id] += dat;
}

XT.Stream = {};

XT.Stream.Restore = function (s) {
    s.write = s.writebind;
    //delete s.writebind;
}

XT.Stream.SaveAndMute = function (s) {
    XT.Buffer.Reset(s);
    s.writebind = s.write.bind(s);
    s.write = function (dat, enc, nxt) {
        XT.Buffer.Append(dat);
        //return s.writebind.apply(this, arguments);
    }
}

XT.Stream.SaveAndPipe = function (s) {
    XT.Buffer.Reset();
    s.writebind = s.write.bind(s);
    s.write = function (dat, enc, nxt) {
        XT.Buffer.Append(dat);
        return s.writebind.apply(this, arguments);
    }
}

Zest.TestList = [];
Zest.GetTestList = function (arglist) {
    let list = [];
    for (let t of arglist) {
        if (NODE.fs.existsSync(t)) {
            let dir = process.cwd();
            let js = dir + '/' + t;
            if (!NODE.fs.existsSync(js)) { js = t; }
            if (!NODE.fs.existsSync(js)) { continue; }
            if (NODE.fs.lstatSync(js).isDirectory()) {
                for (let f of glob.sync(js + '/**/*.js')) { list.push(f); }
            } else {
                list.push(js);
            }
        }
    }
    return list;
}

Zest.TestRunning = false;
Zest.DoTest = function (testlist) {
    if (Zest.TestRunning) { return; }; Zest.TestRunning = true;
    if (testlist == 0 || testlist == '0') { testlist = Zest.TestList; }
    //if (testlist == 0 || testlist == '0') { testlist = Zest.GetTestList([process.cwd() + '/' + 'test']); }
    if (!Array.isArray(testlist)) { testlist = [testlist]; }
    if (NODE.fs.lstatSync(testlist[0]).isDirectory()) { testlist = Zest.GetTestList(testlist); }

    //XT.Stream.SaveAndMute(process.stdout);
    //process.stdout.write = function () { };

    let mocha = new LIBS.mocha({ reporter: 'spec', ui: 'bdd', timeout: 10000 });
    mocha.reporter(require('./reporters/full'));

    //console.error(require.cache);

    for (let js of testlist) {
        if (js[0] != '.' && js[0] != '/' && !js.includes(':')) { js = './' + js; }
        //console.log(require.resolve(js.replace('.js', '')));
        try {
            let module = nodepath.join(process.cwd(), js.replace('.js', ''));
            delete require.cache[require.resolve(module)];
        } catch (ex) { console.error(ex); }
        mocha.addFile(js);
    }

    //mocha.addFile('test/test1.js');
    let runner = mocha.run(function (fails) {
        //console.log({ RUN: { FAILS: fails, ARGS: arguments } });

        if (Zest.App.Args.ui) {
            //console.error(runner);
            //XT.Stream.Restore(process.stdout);
            //Zest.UI.Body.content = XT.Buffer();
            Zest.UI.Foot.content = runner.SUMMARY;
            Zest.UI.Body.content = runner.LOGOUT;
            Zest.UI.Render();
        } else {
            console.log(runner.SUMMARY);
            console.log(runner.LOGOUT);
        }

        mocha.unloadFiles();
    });

    Zest.UI.Head.focus();
    setTimeout(() => { Zest.TestRunning = false; Zest.UI.Head.focus(); }, 250);
}


Zest.AppMain = async function (App) {
    Zest.App = App;

    //console.clear();

    //console.log('AppArgs', App.Args);

    //console.clear();
    //LOG.WARN('Z');
    //LOG.WARN('ARGS', App.Args);

    //

    if (!App.Args.test) { App.Args.test = []; } else if (!Array.isArray(App.Args.test)) { App.Args.test = [App.Args.test]; }
    if (App.Args._.length > 2) { App.Args.test = App.Args.test.concat(App.Args._.slice(2)); }
    if (App.Args.test.length == 0) { App.Args.test = ['test']; }

    Zest.TestList = Zest.GetTestList(App.Args.test);

    if (App.Args.ui) { Zest.InitUI(); } else { Zest.DoTest(App.Args.test); }

    //Zest.DoTest();
    //setTimeout(Zest.DoTest, 2500);

    if (0 && App.Args.loop) {
        if (App.Args.waitport) { await Zest.WaitForPort(App.Args.waitport); }
        setTimeout(Zest.AppMain, 1000);
    }
}

//

module.exports = Zest;
