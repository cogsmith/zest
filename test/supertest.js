const assert = require('assert');
const supertest = require('supertest');
let ff = 0;

const Mock = {};
Mock.Host = process.env.HOST || 'localhost';
Mock.Port = process.env.PORT || 8080;
Mock.URL = 'http://' + Mock.Host.trim() + ':' + Mock.Port.toString().trim();
Mock.Init = async () => { await Mock.Fixture(); };
Mock.Done = async () => { await ff.close(); };
Mock.Reset = async () => { await Mock.Done(); await Mock.Init(); };
Mock.Fixture = async () => {
    ff = require('fastify')({ logger: 0 });
    ff.get('/', async (req, rep) => { return 'HELLOWORLD'; });
    ff.get('/404', async (req, rep) => { rep.status(404).send('404'); });
    ff.get('/status/200', async (req, rep) => { rep.status(200).send('200'); });
    ff.get('/status/400', async (req, rep) => { rep.status(400).send('400'); });
    await ff.listen(Mock.Port);
};

const web = supertest(Mock.URL);
describe('Test Suite', () => {
    before(Mock.Init);
    after(Mock.Done);
    afterEach(Mock.Reset);
    //beforeEach(Mock.Reset);
    describe('Status Codes', () => {
        it('200', async () => { await web.get('/status/200').expect(200); });
        it('400', async () => { await web.get('/status/400').expect(400); });
        it('404', async () => { await web.get('/404').expect(404); });
        it('TESTFAIL', async () => { await web.get('/').expect(9); });
    });
    describe('Response Body', () => {
        it('HELLOWORLD', async () => { await web.get('/').expect('HELLOWORLD'); });
    });
});

// CMD /C "SET HOST=google.com & SET PORT=80 & npx -y @cogsmith/zest"
// CMD /C "SET HOST=localhost & SET PORT=8080 & npx -y @cogsmith/zest"
