const db = require('../config/db');
const multer = require('multer');
const path = require('path');
const songsController = require('../controllers/songsController');
// Function to fetch album art
const getAlbumArt = (songTitle, artistName) => {
    return fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(artistName + ' ' + songTitle)}&entity=song&limit=1`)
        .then(response => response.json())
        .then(data => data.results[0]?.artworkUrl100 || '/path/to/default_album_art.jpg');
};

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads'); 
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Get all songs
exports.getAllSongs = (req, res) => {
    db.query('SELECT * FROM tblsongs')
        .then(([rows]) => {
            db.query('SELECT * FROM playlists')
                .then(([playlists]) => {
                    res.render('songs', { songs: rows, playlists });
                })
                .catch(error => {
                    console.error(error);
                    res.status(500).send('Error retrieving playlists');
                });
        })
        .catch(error => {
            console.error(error);
            res.status(500).send('Error retrieving songs');
        });
};

// Add song to a playlist
exports.addSongToPlaylist = (req, res) => {
    const { playlistId, songId } = req.body;

    db.query('INSERT INTO playlist_songs (playlist_id, song_id) VALUES (?, ?)', [playlistId, songId])
        .then(result => {
            res.status(200).send('Song added to playlist successfully');
        })
        .catch(error => {
            console.error(error);
            res.status(500).send('Error adding song to playlist');
        });
};


// songsController.js

exports.createPlaylist = (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).send('Playlist name is required');
    }

    db.query('INSERT INTO playlists (name) VALUES (?)', [name])
        .then(result => {
            res.status(201).send('Playlist created successfully');
        })
        .catch(error => {
            console.error('Database error:', error);
            res.status(500).send('Error creating playlist');
        });
};



// Search for songs
exports.searchSong = (req, res) => {
    const { query } = req.query;
    db.query('SELECT * FROM tblsongs WHERE title LIKE ? OR artist LIKE ?', [`%${query}%`, `%${query}%`])
        .then(([rows]) => {
            db.query('SELECT * FROM playlists')
                .then(([playlists]) => {
                    res.render('songs', { songs: rows, playlists });
                })
                .catch(error => {
                    console.error(error);
                    res.status(500).send('Error retrieving playlists');
                });
        })
        .catch(error => {
            console.error(error);
            res.status(500).send('Server Error');
        });
};

// Play a song
exports.playSong = (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM tblsongs WHERE id = ?', [id])
        .then(([rows]) => {
            if (rows.length > 0) {
                const song = rows[0];
                getAlbumArt(song.title, song.artist).then(albumArtUrl => {
                    db.query('SELECT id FROM tblsongs WHERE id < ? ORDER BY id DESC LIMIT 1', [id])
                        .then(([previousSong]) => {
                            db.query('SELECT id FROM tblsongs WHERE id > ? ORDER BY id ASC LIMIT 1', [id])
                                .then(([nextSong]) => {
                                    const previousSongId = previousSong[0] ? previousSong[0].id : song.id; 
                                    const nextSongId = nextSong[0] ? nextSong[0].id : song.id;

                                    res.render('player', { 
                                        song, 
                                        previousSongId, 
                                        nextSongId,
                                        albumArtUrl 
                                    });
                                });
                        });
                });
            } else {
                res.status(404).send('Song Not Found');
            }
        })
        .catch(error => {
            console.error(error);
            res.status(500).send('Server Error');
        });
};

// Render upload page
exports.renderUploadPage = (req, res) => {
    res.render('upload');
};

// Edit song title
exports.editSong = (req, res) => {
    const { id } = req.params;
    const { title } = req.body;

    db.query('UPDATE tblsongs SET title = ? WHERE id = ?', [title, id])
        .then(() => {
            res.status(200).json({ message: 'Song title updated successfully' });
        })
        .catch(error => {
            console.error(error);
            res.status(500).send('Error updating song title');
        });
};

// Delete a song
exports.deleteSong = (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM tblsongs WHERE id = ?', [id])
        .then(() => {
            res.status(200).send('Song deleted successfully');
        })
        .catch(error => {
            console.error(error);
            res.status(500).send('Error deleting song');
        });
};

// Function to add a song to a playlist
exports.addToPlaylist = (req, res) => {
    const { playlistId, songId } = req.body;
    db.query('INSERT INTO playlist_songs (playlist_id, song_id) VALUES (?, ?)', [playlistId, songId])
        .then(() => {
            res.status(200).send('Song added to playlist successfully');
        })
        .catch(error => {
            console.error(error);
            res.status(500).send('Error adding song to playlist');
        });
};

// Upload a song
exports.uploadSong = [
    upload.single('song'),
    (req, res) => {
        const { title, artist, album } = req.body;
        const songUrl = `/uploads/${req.file.filename}`;

        db.query('INSERT INTO tblsongs (title, artist, album, song_url) VALUES (?, ?, ?, ?)', [title, artist, album, songUrl])
            .then(() => {
                res.redirect('/songs'); 
            })
            .catch(error => {
                console.error(error);
                res.status(500).send('Error uploading song');
            });
    }
];
