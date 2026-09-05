const db = require('./connection');
/**
 * Check if the file is processed or not
 * @param {string} filepath 
 * @returns {boolean}
 */
function isImageProcessed(filepath){
    const stmt = db.prepare('SELECT * FROM images WHERE file_path = ?');
    const row = stmt.get(filepath);
    return !!row;
}

/**
* Insert a new image after processing
* @param {object} imageRecord
*/
function insertImage(imageRecord) {
  const stmt = db.prepare(`
    INSERT INTO images (
      id, file_path, subject, category, attributes, caption, confidence, embedding
    ) VALUES (
      @id, @file_path, @subject, @category, @attributes, @caption, @confidence, @embedding
    )
  `);

  return stmt.run(imageRecord);
}

module.exports = {
  isImageProcessed,
  insertImage,
};