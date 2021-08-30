// DEFAULT MOCHA SPEC REPORTER CODE + CHANGES: SHOW FULL TEST FILE PATH, COLOR TWEAKS

const nodepath = require('path');
const util = require('util');
const chalk = require('chalk');
const mocha = require('mocha'); const { EVENT_RUN_BEGIN, EVENT_RUN_END, EVENT_TEST_FAIL, EVENT_TEST_PASS, EVENT_SUITE_BEGIN, EVENT_SUITE_END, EVENT_TEST_PENDING } = mocha.Runner.constants;


class ZestReporter {
    constructor(runner, options) {
        let self = this;

        runner.LOGOUT = '';
        runner.SUMMARY = '';

        runner.LOG = function () {
            let msg = util.format(...arguments);
            runner.LOGOUT += msg + "\n";
        }

        runner.LOGNOTES = function () {
            let msg = util.format(...arguments);
            runner.SUMMARY += msg + "\n";
        }

        //let BaseConsoleLog = runner.LOG;
        let BaseConsoleLog = runner.LOGNOTES;

        this._indents = 0;
        const stats = runner.stats;

        let lastfile = 0;

        let Base = mocha.reporters.Base;
        let color = Base.color;
        Base.call(this, runner, options);

        //let Base = new mocha.reporters.Base(runner, options);

        var indents = 0;
        var n = 0;

        function indent() { return Array(indents).join('  '); }

        // runner.on(EVENT_RUN_BEGIN, function () { BaseConsoleLog(); });

        runner.on(EVENT_SUITE_BEGIN, function (suite) {
            if (suite.file && lastfile != suite.file) {
                if (1) {
                    //BaseConsoleLog(); // BaseConsoleLog();
                    BaseConsoleLog(chalk.yellow(nodepath.basename(suite.file)));
                    BaseConsoleLog();
                }
                lastfile = suite.file;
            }
            ++indents;
            BaseConsoleLog('%s' + chalk.cyan(suite.title), indent());
        });

        runner.on(EVENT_SUITE_END, function () {
            --indents;
            if (indents === 1) { BaseConsoleLog(); }
        });

        runner.on(EVENT_TEST_PENDING, function (test) {
            var fmt = indent() + color('pending', '  - %s');
            BaseConsoleLog(fmt, test.title);
        });

        runner.on(EVENT_TEST_PASS, function (test) {
            var fmt;
            //if (test.duration < 10) { test.speed = 'fast'; } else { test.speed = 'slow'; }
            if (test.duration < 10) { // test.speed == 'fast') {
                fmt =
                    indent() +
                    color('checkmark', '  ' + Base.symbols.ok + ' ') +
                    color('suite', ' %s');
                BaseConsoleLog(fmt, test.title);
            } else {
                fmt =
                    indent() +
                    color('checkmark', '  ' + Base.symbols.ok + ' ') +
                    color('suite', ' %s') +
                    color('suite', ' (%dms)');
                BaseConsoleLog(fmt, test.title, test.duration);
            }
        });

        runner.on(EVENT_TEST_FAIL, function (test) {
            BaseConsoleLog(indent() + color('fail', '  %d ') + ' %s', ++n, test.title);
        });

        // runner.once(EVENT_RUN_END, self.epilogue.bind(self));
        runner.on(EVENT_RUN_END, function () {
            //console.log({ S: this.stats }); console.log();
            //console.log(this.stats.tests + ':' + chalk.green(this.stats.passes) + '/' + chalk.red(this.stats.failures));
            //console.log()
            BaseConsoleLog(chalk.yellow('# ' + this.stats.tests + ' TESTS SUMMARY # ')); // + this.stats.tests + ':' + chalk.green(this.stats.passes) + '/' + chalk.white(this.stats.failures));
            self.epilogue(runner);
            //self.LOGNOTES('NOTES');
        });

    }

    indent() { return Array(this._indents).join('  '); }
    increaseIndent() { this._indents++; }
    decreaseIndent() { this._indents--; }
}

//mocha.utils.inherits(ZestReporter, mocha.reporters.Base);
mocha.utils.inherits(ZestReporter, require('./base'));

module.exports = ZestReporter;
