const query = document.querySelector("#query");
const videos = document.querySelector("#videos");
const loading = document.querySelector("#loading");
const info = document.querySelector("#download-info");
const link = info.querySelector("#link");
const image = info.querySelector("#image");
const quality = info.querySelector("#quality");
const type = info.querySelector("#type");
const download = info.querySelector("#download");


info.style.display = "none";


async function selectVideo(id) {
    videos.innerHTML = "";
    loading.textContent = "Loading...";
    let data = await fetch("/info/" + query.value)
    .then(response => response.json())
    .catch(err => ({ length: 0 }));

    if(!data.length) {
        loading.textContent = "There was an error";
        return;
    }

    data = data[id];

    loading.textContent = "";
    query.style.display = "none";
    info.style.display = "block";

    link.href = data.url;
    link.textContent = data.title;

    image.src = data.metadata.thumbnails[0].url;

    let thumbnails = data.metadata.thumbnails;

    thumbnails.forEach(v => {
        let option = document.createElement("option");

        option.textContent = v.width;
        option.value = v.width + "p";

        quality.appendChild(option);
    });

    download.onclick = async () => {
        loading.textContent = "Downloading...";
        fetch("/download/" + query.value + "/" + id + "?quality=" + quality.value + "&type=" + type.value)
        .then(response => response.text())
        .then(text => {
            loading.textContent = text.split("!").reverse()[0];

            loading.onclick = () => {
                loading.textContent = "";
                query.value = "";
                quality.value = "";
                type.value = "";
                quality.innerHTML = "<option selected disabled>Quality</option>";

                info.style.display = "none";
            }
        })
        .catch(err => {
            loading.textContent = err;
        });
    }
}

query.onkeydown = async event => {
    if(event.keyCode === 13) {
        info.style.display = "none";
        loading.textContent = "Loading...";
        let data = await fetch("/info/" + query.value)
        .then(response => response.json())
        .catch(err => ({ length: 0 }));

        if(!data.length) {
            loading.textContent = "No videos found";
            return;
        }


        loading.textContent = "";
        videos.innerHTML = "";

        data.forEach((v, i) => {
            let element = document.createElement("div");

            element.innerHTML = `
                <img src = "${v.metadata.thumbnails[0].url}">
                <a href = "${v.url}">${v.title}</a>
            `;

            let select = document.createElement("button");

            select.textContent = "Select";

            select.onclick = () => selectVideo(i);

            element.appendChild(select);

            videos.appendChild(element);
        });
    }
}