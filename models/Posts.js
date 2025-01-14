const db = require('../conf/database');
const PostModel = {};

PostModel.create = (title, description, photopath, thumbnail, fk_userId) => {
    const baseSQL = 'INSERT INTO posts (title, description, photopath, thumbnail, created, fk_userid) VALUE (?,?,?,?, now(),?);;';
    return db.execute(baseSQL, [title, description, photopath, thumbnail, fk_userId])
        .then(([results, fields]) => {
            return Promise.resolve(results && results.affectedRows);
        })
        .catch((err) => Promise.reject(err));
};

PostModel.search = (searchTerm) => {
    const baseSQL =
        "SELECT id, title, description, thumbnail, concat_ws(' ', title, description) AS haystack FROM posts HAVING haystack like ?;";
    const sqlReadySearchTerm = '%' + searchTerm + '%';
    return db.execute(baseSQL, [sqlReadySearchTerm])
        .then(([results, fields]) => {
            return Promise.resolve(results);
        })
        .catch((err) => Promise.reject(err));
};

PostModel.getNRecentPosts = (numberOfPost) => {
    const baseSQL = 'SELECT id, title, description, thumbnail, created FROM posts ORDER BY created DESC LIMIT 8';
    return db
        .query(baseSQL, [numberOfPost])
        .then(([results, fields]) => {
            return Promise.resolve(results);
        })
        .catch((err) => Promise.reject(err));
};

PostModel.getPostById = (postId) => {
    const baseSQL = 'SELECT u.username, p.title, p.description, p.photopath, p.created FROM users u JOIN posts p ON u.id=fk_userid WHERE p.id=?;';
    return db
        .execute(baseSQL, [postId])
        .then(([results, fields]) => {
            return Promise.resolve(results);
        })
        .catch(err => Promise.reject(err));
};

module.exports = PostModel;
