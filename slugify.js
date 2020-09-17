const slugify = require('slugify');

const makeSlug = (str) => {
    return slugify(str, {
        replacement: '',
        remove: /[*+~.()'"!:@]/g,
        lower: true,
        strict: false,
    });
};

module.exports = makeSlug;
