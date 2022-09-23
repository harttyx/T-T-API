const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const _ = require('lodash');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');

const app = express();

const service = require('./controllers')
// enable files upload
app.use(fileUpload({
    createParentPath: true
}));

//add other middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));


app.post('/transcribe', async (req, res) => {
    let done = false;
    let language = req.body.language;
    try {
        if (!req.files) {
            res.send({
                status: false,
                message: 'No file uploaded'
            });
        } else if (!language) {
            res.send({
                status: false,
                message: 'No language selected'
            });
        } else {
            //Use the name of the input field (i.e. "file") to retrieve the uploaded file
            let file = req.files.file;

            //Use the mv() method to place the file in upload directory (i.e. "uploads")
            await file.mv('./uploads/' + file.name);

            let filepath = './uploads/' + file.name;

            ffmpeg.setFfmpegPath(ffmpegPath);

            ffmpeg(filepath)
                .toFormat('mp3')
                .save('audio.mp3')
                .on('error', (err) => {
                    console.log(err)
                })
                .on('progress', (progress) => {
                    console.log('Frames... ' + progress)
                })
                .on('end', () => {
                    console.log("finished");
                    if (!done) {
                        done = true;
                        transript = service.transcribe(res, file, language)
                    }
                })
                .run();
        }
    } catch (err) {
        res.status(500).send(err);
    }
});

app.post('/translate', async (req, res) => {
    let text = req.body.text;
    let target_language = req.body.lang;

    if (!text) {
        res.send({
            status: false,
            message: 'No text sent with the body to translate'
        });
    }
    if (!target_language) {
        res.send({
            status: false,
            message: 'No language selected'
        });
    }

    try {
        // detect lang code from text
        let origin_language = await service.detectLang(text);

        if (origin_language) {
            if (origin_language === target_language) {
                res.send({
                    status: false,
                    message: 'The text is already in the desired language'
                });
            } else {
                service.translateText(text, target_language, res);
            }
        } else {
            res.status(500).send({
                error: err,
                message: 'could not detect any language from the text'
            });
        }
    } catch (err) {
        res.status(500).send(err);
    }
})

//start app 
const port = process.env.PORT || 3000;

app.listen(port, () =>
    console.log(`App is listening on port ${port}.`)
);