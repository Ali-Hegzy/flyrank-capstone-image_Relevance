const {suggestImage} = require('../services/guard.service');
const db = require('../db/connection');

const suggest = async (req, res) =>{
    try {
        const result = await suggestImage(req.body.text);

        if(!result.data.success){
            return res.status(422).json(result);
        }

        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
};

const review = async (req, res) => {
    const { post_text, image_id, cosineSimilarity, status } = req.body;
    
    const stmt = db.prepare(`
        INSERT INTO reviews (post_text, image_id, cosineSimilarity, status)
        VALUES (?, ?, ?, ?)
    `);
    stmt.run(post_text, image_id, cosineSimilarity, status);

    return res.json({ success: true, message: `Suggestion marked as ${status}` });
};

module.exports = {suggest, review};