// Imports the Google Cloud client library
const speech = require('@google-cloud/speech').v1p1beta1;
const { Translate } = require('@google-cloud/translate').v2;
const fs = require('fs');
const util = require('util');

// dot env
require('dotenv').config();

// my google credentials
// const CREDENTIALS = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);

// // Configuration for the translate client
const translate = new Translate();

exports.transcribe = async (res, file, lang) => {
    try {
        const client = new speech.SpeechClient();


        const filename = 'audio.mp3';
        const encoding = 'MP3';
        const sampleRateHertz = 16000;
        const languageCode = lang;
        // const gcsUri = 'gs://my-bucket/audio.raw';
        // const encoding = 'LINEAR16';
        // const sampleRateHertz = 16000;
        // const languageCode = 'en-US';

        const config = {
            encoding: encoding,
            sampleRateHertz: sampleRateHertz,
            languageCode: languageCode
        };

        const audio = {
            // uri: gcsUri,
            content: fs.readFileSync(filename).toString('base64'),
        };

        const request = {
            config: config,
            audio: audio,
        };

        // Detects speech in the audio file. This creates a recognition job that you
        // can wait for now, or get its result later.
        const [response] = await client.recognize(request);
        const transcription = response.results
            .map(result => result.alternatives[0].transcript)
            .join('\n');
        console.log('Transcription: ', transcription);

        await fs.unlinkSync('audio.mp3');
        await fs.unlinkSync('./uploads/' + file.name);

        if (transcription) {
            let i = await this.detectLang(transcription);
            console.log(i);
            res.send({
                status: true,
                message: 'File is transcribed',
                data: {
                    name: file.name,
                    mimetype: file.mimetype,
                    text: transcription
                }
            });
        } else {
            res.send({
                status: false,
                message: 'File was not transcribe, an error occured.'
            });
        }
    } catch (err) {
        await fs.unlinkSync('audio.mp3');
        await fs.unlinkSync('./uploads/' + file.name);
        res.status(500).send(err);
    }
}

exports.detectLang = async (text) => {
    try {
        let response = await translate.detect(text);
        return response[0].language;
    } catch (err) {
        console.log('Error at detectLang --> ' + err);
        return 0;
    }
}

exports.translateText = async (text, targetlang, res) => {
    try {
        let [response] = await translate.translate(text, targetlang);
        if (response) {
            res.send({
                status: true,
                message: 'Text translated successfully',
                data: {
                    original: text,
                    translation: response
                }
            });
        } else {
            res.send({
                status: false,
                message: 'Text was not translated, an error occured.'
            });
        }
    } catch (err) {
        res.status(500).send(err);
    }
}
