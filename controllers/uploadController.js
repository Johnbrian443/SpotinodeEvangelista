const db = require('../config/db');

exports.showUploadForm = (req, res) => {
    res.render('upload');
};

exports.uploadSong = async (req, res) => {
    const { title, artist, album } = req.body;
    const songUrl = `/uploads/${req.file.filename}`; 

    try {
        await db.query('INSERT INTO tblsongs (title, artist, album, song_url) VALUES (?, ?, ?, ?)', [title, artist, album, songUrl]);
        res.redirect('/songs');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error uploading song');
    }
};

