const express = require('express');
const router = express.Router();
// const db = require('../conf/database');
const { errorPrint } = require('../helpers/debug/debugprinters');
const sharp = require('sharp');
const multer = require('multer');
const crypto = require('crypto');
const PostError = require('../helpers/error/PostError');
const PostModel = require('../models/Posts');
const { body, validationResult } = require('express-validator');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/images/uploads');
    },
    filename: function (req, file, cb) {
        const fileExt = file.mimetype.split('/')[1];
        const randomName = crypto.randomBytes(22).toString('hex');
        cb(null, `${randomName}.${fileExt}`);
    }
});

const uploader = multer({ storage });

router.post('/createPost', [body('title').isLength({ min: 0 }), body('description').isLength({ min: 0 })], uploader.single('uploadImage'), (req, res, next) => {
    const fileUploaded = req.file.path;
    const fileAsThumbnail = `thumbnail-${req.file.filename}`;
    const destinationOfThumbnail = req.file.destination + '/' + fileAsThumbnail;
    const title = req.body.title;
    const description = req.body.description;
    const fk_userId = req.session.userId;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error', 'Post could not be made');
        res.redirect('/');
        return res.status(400).json({ errors: errors.array() });
    }

    sharp(fileUploaded)
        .resize(200)
        .toFile(destinationOfThumbnail)
        .then(() => {
            return PostModel.create(
                title,
                description,
                fileUploaded,
                destinationOfThumbnail,
                fk_userId
            );
        })
        .then((postWasCreated) => {
            if (postWasCreated) {
                req.flash('success', 'Post was created successfully');
                res.redirect('/');
            } else {
                throw new PostError('Posts could not be created', 'postimage', 200);
            }
        })
        .catch((err) => {
            if (err instanceof PostError) {
                errorPrint(err.getMessage());
                req.flash('error', err.getMessage());
                res.status(err.getStatus());
                res.redirect(err.getRedirectURL());
            } else {
                next(err);
            }
        });
});

router.get('/search', async (req, res, next) => {
    try {
        const searchTerm = req.query.search;
        if (!searchTerm) {
            res.send({
                message: 'no search term given',
                results: []
            });
        } else {
            const results = await PostModel.search(searchTerm);
            if (results && results.length) {
                res.send({
                    message: `${results.length} results found`,
                    results
                });
            } else {
                const results = await PostModel.getNRecentPosts(8);
                res.send({
                    message: 'no results were your search were found. showing 8 most recent posts',
                    results
                });
            }
        }
    } catch (err) {
        next(err);
    }
});

module.exports = router;
