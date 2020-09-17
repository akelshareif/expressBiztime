const express = require('express');
const ExpressError = require('../expressError');
const router = new express.Router();

const db = require('../db');

router.get('/', async (req, res, next) => {
    try {
        const results = await db.query('SELECT * FROM invoices');

        if (results.rows.length === 0) {
            throw new ExpressError('Database is empty or there was an error', 404);
        }

        return res.status(200).json({ invoices: results.rows });
    } catch (e) {
        return next(e);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const id = req.params.id;

        const result = await db.query(`SELECT * FROM invoices WHERE id=$1`, [id]);
        if (result.rows.length === 0) {
            throw new ExpressError(`No invoice was found with code ${req.params.id}`, 404);
        }

        const resultCompany = await db.query(`SELECT * FROM companies WHERE code=$1`, [result.rows[0].comp_code]);

        return res.status(200).json({
            invoice: result.rows[0],
            company: resultCompany.rows[0],
        });
    } catch (e) {
        return next(e);
    }
});

router.post('/', async (req, res, next) => {
    try {
        const { comp_code, amt } = req.body;
        const result = await db.query(
            `INSERT INTO invoices (comp_code, amt) 
            VALUES ($1, $2) 
            RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [comp_code, amt]
        );
        return res.status(201).json({ invoice: result.rows[0] });
    } catch (e) {
        next(e);
    }
});

router.put('/:id', async (req, res, next) => {
    try {
        let { amt, paid } = req.body;
        let result;
        if (paid) {
            result = await db.query(
                `
                UPDATE invoices 
                SET amt=$1, paid=$2, paid_date=CURRENT_DATE
                WHERE id=$3
                RETURNING id, comp_code, amt, paid, add_date, paid_date
                `,
                [amt, paid, req.params.id]
            );
        } else {
            paid = false;
            result = await db.query(
                `
                UPDATE invoices 
                SET amt=$1, paid=$2, paid_date=null
                WHERE id=$3
                RETURNING id, comp_code, amt, paid, add_date, paid_date
                `,
                [amt, paid, req.params.id]
            );
        }

        if (result.rows.length === 0) {
            throw new ExpressError('Error: Invoice cannot be found', 404);
        }

        return res.status(201).json({ invoice: result.rows[0] });
    } catch (e) {
        next(e);
    }
});

router.delete('/:id', async (req, res, next) => {
    try {
        const result = await db.query(`DELETE from invoices WHERE id=$1`, [req.params.id]);

        return res.status(200).json({ status: 'Deleted' });
    } catch (e) {
        next(e);
    }
});

module.exports = router;
