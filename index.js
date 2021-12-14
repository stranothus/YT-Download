const express = require("express");
const dotenv = require("dotenv");
const fs = require("fs");
const Innertube = require("youtubei.js");

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.static(__dirname + "/public"));

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/views/home.html");
});

app.get("/info/:key", async (req, res) => {
    let params = req.params;
    let key = params.key;

    let youtube = await new Innertube();
    let search = await youtube.search(key);

    res.json(search.videos);
});

app.get("/details/:key", async (req, res) => {
    let params = req.params;
    let key = params.key;

    let youtube = await new Innertube();
    let details = await youtube.getDetails(key);

    res.json(details);
});

app.get("/download/:key/:id", async (req, res) => {
    let params = req.params;
    let key = params.key;
    let id = params.id;
    let queries = req.query;
    let quality = queries.quality || "360p";
    let type = queries.type || "videoandaudio";

    let start = new Date().getTime();
    let youtube = await new Innertube();
    let search = await youtube.search(key);

    if(!search.videos.length) {
        res.status(500).send("Video not found");
        return;
    }
    
    let stream = youtube.download(search.videos[id].id, {
        format: "mp4", // Optional, ignored when type is set to audio and defaults to mp4, and I recommend to leave it as it is
        quality: quality, // if a video doesn't have a specific quality it'll fall back to 360p, also ignored when type is set to audio
        type: type // can be “video”, “audio” and “videoandaudio”
    });

    stream.pipe(fs.createWriteStream(process.env.DOWNLOADS_PATH + `/${search.videos[id].title.replace(/\//g, "\\")}.mp4`));

    stream.on("start", () => {
        res.write("Starting download now!\n");
    });

    stream.on("info", info => {
        // { video_details: {..}, selected_format: {..}, formats: {..} }
        res.write(`Downloading ${info.video_details.title} by ${info.video_details.metadata.channel_name}\n`);
    });

    stream.on("progress", info => {
        res.write(`Downloaded ${info.percentage}% (${info.downloaded_size}MB) of ${info.size}MB\n`);
    });

    stream.on("end", () => {
        res.write("Done!\n");
        res.write("Download took " + ((new Date().getTime() - start) / 1000) + " Seconds");
        res.end();
    });

    stream.on("error", err => res.status(500).send(err));
});

app.listen(process.env.PORT, () => {
    console.log("App listening on PORT " + process.env.PORT);
});