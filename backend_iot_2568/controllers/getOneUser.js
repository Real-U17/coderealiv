const db = require('../config')

const getEmail = async (req, res) => {
    try {
        const row = await db.select('email').from('testuser');
        res.send(row);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).send('Database error');
    }
};


module.exports = getEmail