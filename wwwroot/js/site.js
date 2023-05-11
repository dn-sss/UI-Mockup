function initCanvas(canvasId) {
    let canvas = document.getElementById(canvasId);
    let ctx = canvas.getContext('2d');
    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    let overlayCanvas = document.getElementById(`${canvasId}Overlay`);
    let overlayCtx = overlayCanvas.getContext('2d');
    overlayCtx.font = '30px serif';
    overlayCtx.lineWidth = 1;
    overlayCtx.textBaseline = "bottom";
    overlayCtx.fillStyle = "red";
    overlayCtx.textAlign = "center";
    overlayCtx.fillText("Loading Image", parseInt(overlayCanvas.width / 2), parseInt(overlayCanvas.height/2));
}

function drawCanvas(image, canvasId) {

    let canvas = document.getElementById(canvasId);
    let canvasCtx = canvas.getContext('2d');

    let imageWidth = image.width;
    let imageHeight = image.height;

    canvasCtx.drawImage(image, 0, 0);
}

function processSliderInput(evt) {
    // get label
    let label = this.labels[0];
    label.firstElementChild.innerText = evt.target.value;
}

function EnableDisableLogCard() {
    let divLog = document.getElementById("divLog");
    let labeldivLog = document.getElementById("labeltxAreaStatus");

    divLog.hidden = !divLog.hidden;

    if (divLog.hidden == true) {
        labeldivLog.innerHTML = 'Display Logs';
    }
    else {
        labeldivLog.innerHTML = 'Hide Logs';
    }
    
/*    GetDevices();*/
}

function UpdateCameraNames(device_1_id, device_2_id, device_3_id) {

    UpdateCameraName(device_1_id, 'camera_1_name', 'camera_1_wifi_icon', 'modelListCamera1', 'canvasCamera1');
    UpdateCameraName(device_2_id, 'camera_2_name', 'camera_2_wifi_icon', 'modelListCamera2', 'canvasCamera2');
    UpdateCameraName(device_3_id, 'camera_3_name', 'camera_3_wifi_icon', 'modelListCamera3', 'canvasCamera3');
}


function UpdateCameraName(deviceId, cameraNameId, wifiIconId, modelListId, canvasId) {
    GetDevices(deviceId)
        .done(function (response) {
            let jsonData = JSON.parse(response.value);
            let jsonPretty = JSON.stringify(jsonData, undefined, 2);
            document.getElementById("txAreaStatus").value += `GetDevices : ${jsonPretty}\r\n`;

            if (jsonData.device_id == deviceId) {
                $(`#${cameraNameId}`).html(jsonData['property'].device_name);
                if (jsonData.connectionState == "Connected") {
                    $(`#${wifiIconId}`).addClass('fa-wifi-connected');
                    $(`#${wifiIconId}`).removeClass('fa-wifi-disconnected');
                } else {
                    $(`#${wifiIconId}`).addClass('fa-wifi-disconnected');
                    $(`#${wifiIconId}`).removeClass('fa-wifi-connected');
                }
            }

            var list = $(`#${modelListId}`);

            list.empty();

            for (var model in jsonData.models) {
                var option = $('<option>').val(jsonData.models[model].model_version_id);
                option.text(jsonData.models[model].model_version_id);
                list.append(option);
            }
        });

    GetDirectImage(deviceId)
        .done(function (response) {

            let jsonData = JSON.parse(response.value);

            if (jsonData.result == "SUCCESS") {
                var canvas = document.getElementById(canvasId);
                var ctx = canvas.getContext("2d");
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                var image = new Image();
                image.onload = function () {
                    let loadedImageWidth = image.width;
                    let loadedImageHeight = image.height;

                    // get the scale
                    // it is the min of the 2 ratios
                    let scaleFactor = Math.max(canvas.width / image.width, canvas.height / image.height);

                    // Finding the new width and height based on the scale factor
                    let newWidth = image.width * scaleFactor;
                    let newHeight = image.height * scaleFactor;

                    // get the top left position of the image
                    // in order to center the image within the canvas
                    let x = (canvas.width / 2) - (newWidth / 2);
                    let y = (canvas.height / 2) - (newHeight / 2);

                    // When drawing the image, we have to scale down the image
                    // width and height in order to fit within the canvas
                    ctx.drawImage(image, x, y, newWidth, newHeight);
                };
                image.src = `data:image/jpeg;base64,${jsonData.contents}`;

                let overlayCanvas = document.getElementById(`${canvasId}Overlay`);
                let overlayCtx = overlayCanvas.getContext('2d');

                overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);


            }

            let loader = document.getElementById(`${canvasId}LoaderWrapper`);
            loader.style.display = "none";
    });
}