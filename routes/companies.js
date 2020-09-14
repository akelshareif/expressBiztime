const express = require('express');
const ExpressError = require('../expressError');
const router = new express.Router();

const db = require('../db');

router.get('/', async (req, res, next) => {
    try {
        const results = await db.query('SELECT * FROM companies');

        if (results.rows.length === 0) {
            throw new ExpressError('Database is empty or there was an error', 404);
        }

        return res.status(200).json({ companies: results.rows });
    } catch (e) {
        return next(e);
    }
});

router.get('/:code', async (req, res, next) => {
    try {
        const code = req.params.code;
        const result = await db.query(`SELECT * FROM companies WHERE code=$1`, [code]);
        const invoices = await db.query(`SELECT * FROM invoices WHERE comp_code=$1`, [code]);

        if (result.rows.length === 0) {
            throw new ExpressError(`No company was found with code ${req.params.code}`, 404);
        }

        return res.status(200).json({
            company: result.rows[0],
            invoices: invoices.rows,
        });
    } catch (e) {
        return next(e);
    }
});

router.post('/', async (req, res, next) => {
    try {
        const { code, name, description } = req.body;
        const result = await db.query(
            `INSERT INTO companies (code, name, description) 
            VALUES ($1, $2, $3) 
            RETURNING code, name, description`,
            [code, name, description]
        );
        return res.status(201).json({ company: result.rows[0] });
    } catch (e) {
        next(e);
    }
});

router.put('/:code', async (req, res, next) => {
    try {
        const { code, name, description } = req.body;

        const result = await db.query(
            `
            UPDATE companies 
            SET code=$1, name=$2, description=$3
            WHERE code=$4
            RETURNING code, name, description
            `,
            [code, name, description, req.params.code]
        );

        return res.status(201).json({ company: result.rows[0] });
    } catch (e) {
        next(e);
    }
});

router.delete('/:code', async (req, res, next) => {
    try {
        const result = await db.query(`DELETE from companies WHERE code=$1`, [req.params.code]);

        return res.status(200).json({ status: 'Deleted' });
    } catch (e) {
        next(e);
    }
});

module.exports = router;
