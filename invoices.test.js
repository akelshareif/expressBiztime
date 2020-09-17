process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('./app');
const db = require('./db');

// Setup
let testCompany;
let testInvoice;

beforeEach(async () => {
    let companyResult = await db.query(
        `INSERT INTO
        companies (code, name, description)
        VALUES ('goog', 'Google', 'Search engine company')
        RETURNING code, name, description
        `
    );
    testCompany = companyResult.rows[0];

    let invoiceResult = await db.query(
        `INSERT INTO
        invoices (comp_code, amt)
        VALUES ('goog', 400)
        RETURNING id, comp_code, amt, paid, add_date, paid_date
        `
    );
    testInvoice = invoiceResult.rows[0];
});

// Teardown
afterEach(async () => {
    await db.query(`DELETE FROM companies`);
    await db.query(`DELETE FROM invoices`);
});
afterAll(async () => {
    await db.end();
});

// Tests
describe('GET /invoices', () => {
    test('Gets all invoices in db, represented as an object', async () => {
        const res = await request(app).get('/invoices');
        let { amt, comp_code, id, paid_date } = testInvoice;

        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual(expect.any(Object));
        expect(res.body).toEqual(
            expect.objectContaining({
                invoices: [{ add_date: expect.any(String), amt, comp_code, id, paid: false, paid_date }],
            })
        );
    });
});

describe('GET /:id', () => {
    test('Gets data of single invoice', async () => {
        const res = await request(app).get(`/invoices/${testInvoice.id}`);
        let { amt, comp_code, id, paid, paid_date } = testInvoice;
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual(expect.any(Object));
        expect(res.body).toEqual(
            expect.objectContaining({
                invoice: { add_date: expect.any(String), amt, comp_code, id, paid, paid_date },
                company: expect.any(Object),
            })
        );
    });

    test('Return 404 error if no invoice was found', async () => {
        const res = await request(app).get('/invoices/44');
        expect(res.statusCode).toEqual(404);
    });
});

describe('POST /invoices', () => {
    test('Create new invoice', async () => {
        const invoice = {
            comp_code: 'goog',
            amt: 599,
        };

        const res = await request(app).post('/invoices').send(invoice);
        let {
            invoice: { amt, comp_code, id, paid, paid_date },
        } = res.body;

        expect(res.statusCode).toEqual(201);
        expect(res.body).toEqual(expect.any(Object));
        expect(res.body).toEqual(
            expect.objectContaining({ invoice: { add_date: expect.any(String), amt, comp_code, id, paid, paid_date } })
        );
    });
});

describe('PUT /:id', () => {
    test('Updates an invoice', async () => {
        const invUpdate = {
            amt: 123,
            paid: true,
        };
        const res = await request(app).put(`/invoices/${testInvoice.id}`).send(invUpdate);
        let { amt, comp_code, id, paid, paid_date } = testInvoice;

        expect(res.statusCode).toEqual(201);
        expect(res.body).toEqual(expect.any(Object));
        expect(res.body).toEqual(
            expect.objectContaining({
                invoice: {
                    add_date: expect.any(String),
                    amt: 123,
                    comp_code,
                    id,
                    paid: true,
                    paid_date: expect.any(String),
                },
            })
        );
    });
});

describe('DELETE /:id', () => {
    test('Deletes an invoice', async () => {
        const res = await request(app).delete(`/companies/${testInvoice.id}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual(expect.any(Object));
        expect(res.body).toEqual(expect.objectContaining({ status: 'Deleted' }));
    });
});
