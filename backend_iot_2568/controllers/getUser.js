const db = require('../config')

const getUser = async (req, res) => {
    const row = await db.select('*').from('testuser')
    res.send(row)
}

module.exports = getUser