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

function getImagesWithoutEmbeddings() {
  const stmt = db.prepare(`
    SELECT id, file_path, subject, category, caption, attributes, embedding
    FROM images
    WHERE embedding IS NULL OR embedding = '[]'
  `);
  return stmt.all();
}

function updateImageEmbedding(id, embeddingVector) {
  const stmt = db.prepare(`
    UPDATE images
    SET embedding = ?
    WHERE id = ?
  `);
  return stmt.run(JSON.stringify(embeddingVector), id);
}

function getAllImagesWithEmbeddings() {
  const stmt = db.prepare(`
    SELECT id, file_path, subject, category, caption, embedding
    FROM images
    WHERE embedding IS NOT NULL AND embedding != '[]'
  `);
  return stmt.all();
}

module.exports = {
  isImageProcessed,
  insertImage,
  getImagesWithoutEmbeddings,
  updateImageEmbedding,
  getAllImagesWithEmbeddings
};