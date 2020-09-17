const express = require('express');
const ExpressError = require('../expressError');
const router = new express.Router();

const db = require('../db');

router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(
            `SELECT industry, ARRAY_AGG(comp_code) as companies
             FROM companies_industries as ci
             JOIN industries as i
             ON ci.i_code=i.code
             GROUP BY industry`
        );

        if (results.rows.length === 0) {
            throw new ExpressError('Database is empty or there was an error', 404);
        }

        return res.status(200).json({ industries: results.rows });
    } catch (e) {
        next(e);
    }
});

router.post('/', async (req, res, next) => {
    try {
        const { code, industry } = req.body;
        const result = await db.query(
            `INSERT INTO industries (code, industry)
             VALUES ($1, $2)
             RETURNING code, industry`,
            [code, industry]
        );

        if (result.rows.length === 0) {
            throw new ExpressError('Unable to add new industry', 404);
        }

        return res.status(201).json({ industry: result.rows[0] });
    } catch (e) {
        next(e);
    }
});

router.post('/associate', async (req, res, next) => {
    try {
        const { c_code, i_code } = req.body;
        const result = await db.query(
            `INSERT INTO companies_industries
             VALUES ($1, $2)
             RETURNING comp_code, i_code`,
            [c_code, i_code]
        );

        return res.status(201).json({ industry: result.rows[0] });
    } catch (e) {
        next(e);
    }
});

module.exports = router;
