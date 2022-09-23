const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');


function main() {
    let filepath = './ok/1.mp4';

    ffmpeg.setFfmpegPath(ffmpegPath);

    ffmpeg(filepath)
        .save('audio.mp3')
        .on('error', (err) => {
            console.log(err)
        })
        .on('progress', (progress) => {
            console.log('Frames... ' + progress)
        })
        .on('end', () => {
            console.log("finished");
            // transript = service.transcribe(res, file)
        })
        .run();
}

main();