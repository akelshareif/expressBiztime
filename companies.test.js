process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('./app');
const db = require('./db');

// Setup
let testCompany;

beforeEach(async () => {
    let result = await db.query(
        `INSERT INTO 
        companies (code, name, description)
        VALUES ('goog', 'Google', 'Search engine company')
        RETURNING code, name, description
        `
    );
    testCompany = result.rows[0];
});

// Teardown
afterEach(async () => {
    await db.query(`DELETE FROM companies`);
});
afterAll(async () => {
    await db.end();
});

// Tests
describe('GET /companies', () => {
    test('Gets all companies in db, represented as an object', async () => {
        const res = await request(app).get('/companies');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual(expect.any(Object));
        expect(res.body).toEqual(expect.objectContaining({ companies: [testCompany] }));
    });
});

describe('GET /:code', () => {
    test('Gets data of single company', async () => {
        const res = await request(app).get(`/companies/${testCompany.code}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual(expect.any(Object));
        expect(res.body).toEqual(expect.objectContaining({ company: testCompany, invoices: expect.any(Object) }));
    });

    test('Return 404 error if no company was found', async () => {
        const res = await request(app).get('/companies/lala');
        expect(res.statusCode).toEqual(404);
    });
});

describe('POST /companies', () => {
    test('Create new company', async () => {
        const comp = {
            code: 'ibm',
            name: 'IBM',
            description: 'Big blue',
        };
        const res = await request(app).post('/companies').send(comp);

        expect(res.statusCode).toEqual(201);
        expect(res.body).toEqual(expect.any(Object));
        expect(res.body).toEqual(expect.objectContaining({ company: comp }));
    });
});

describe('PUT /:code', () => {
    test('Updates a company', async () => {
        const compUpdate = {
            code: 'google',
            name: 'Google',
            description: 'Second largest app store owner',
        };
        const res = await request(app).put(`/companies/${testCompany.code}`).send(compUpdate);
        expect(res.statusCode).toEqual(201);
        expect(res.body).toEqual(expect.any(Object));
        expect(res.body).toEqual(expect.objectContaining({ company: compUpdate }));
    });
});

describe('DELETE /:code', () => {
    test('Deletes a company', async () => {
        const res = await request(app).delete(`/companies/${testCompany.code}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual(expect.any(Object));
        expect(res.body).toEqual(expect.objectContaining({ status: 'Deleted' }));
    });
});
