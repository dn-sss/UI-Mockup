function initCanvas(canvasId) {

    let container = $(`#${canvasId}Container`);
    let ContainerWidth = container.innerWidth();
    let ContainerHeight = container.innerHeight();

    let canvas = document.getElementById(canvasId);
    let ctx = canvas.getContext('2d');

    ctx.canvas.width = ContainerHeight
    ctx.canvas.height = ContainerWidth;

    //ctx.fillStyle = "#f0f0f0";
    //ctx.fillRect(0, 0, canvas.width, canvas.height)

    let overlayCanvas = document.getElementById(`${canvasId}Overlay`);
    let overlayCtx = overlayCanvas.getContext('2d');

    overlayCtx.canvas.width = ContainerWidth;
    overlayCtx.canvas.height = ContainerHeight;

    overlayCtx.font = '24px Inter';
    overlayCtx.lineWidth = 1;
    overlayCtx.textBaseline = "top";
    overlayCtx.fillStyle = "#11283E";
    overlayCtx.textAlign = "center";
    overlayCtx.fillText("Loading Image", parseInt(overlayCanvas.width / 2), parseInt((overlayCanvas.height/3) * 2));
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
    //$(`#${evt.target.nextSibling.nextSibling.id}`).html(`${evt.target.value}%`);
    $(`#${evt.target.id}Label`).html(`${evt.target.value}%`);
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
}

function UpdateCameraNames(device_1_id, device_2_id, device_3_id) {

    UpdateCameraName(device_1_id, 'camera_1_name', 'camera_1_wifi_icon', 'modelListCamera1', 'canvasCamera1', 'btnAICamera1');
    UpdateCameraName(device_2_id, 'camera_2_name', 'camera_2_wifi_icon', 'modelListCamera2', 'canvasCamera2', 'btnAICamera2');
    UpdateCameraName(device_3_id, 'camera_3_name', 'camera_3_wifi_icon', 'modelListCamera3', 'canvasCamera3', 'btnAICamera3');
}

function StartInferences(device_1_id, device_2_id, device_3_id) {
    StartUploadInferenceResult(device_1_id);
    StartUploadInferenceResult(device_2_id);
    StartUploadInferenceResult(device_3_id);
}

function UpdateCameraName(deviceId, cameraNameId, wifiIconId, modelListId, canvasId, btnAiCamera) {
    GetDevices(deviceId)
        .done(function (response) {
            let jsonData = JSON.parse(response.value);
            let jsonPretty = JSON.stringify(jsonData, undefined, 2);

            document.getElementById("txAreaStatus").value += `GetDevices : ${jsonPretty}\r\n`;

            if (jsonData.device_id == deviceId) {
                // set name of the camera in the header
                if (jsonData['state'].Status.Sensor == 'Streaming') {
                    toggleAiButton(btnAiCamera, true);
                }
                else {
                    toggleAiButton(btnAiCamera, false);
                }
                $(`#${cameraNameId}`).html(jsonData['property'].device_name);
                $(`#${cameraNameId}`).attr('data-deviceId', deviceId);

                if (jsonData.connectionState == "Connected") {
                    $(`#${wifiIconId}`).addClass('WiFi-Svg-Connect');
                    $(`#${wifiIconId}`).removeClass('WiFi-Svg-DisConnect');
                } else {
                    $(`#${wifiIconId}`).addClass('WiFi-Svg-DisConnect');
                    $(`#${wifiIconId}`).removeClass('WiFi-Svg-Connect');
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

                var canvasOverlay = document.getElementById(`${canvasId}Overlay`);
                var ctxCanvasOverlay = canvasOverlay.getContext("2d");
                var image = new Image();
                image.onload = function () {

                    let imageWidth = image.width;
                    let imageHeight = image.height;

                    let container = $(`#${canvasId}Container`);

                    let ContainerWidth = container.innerWidth();
                    let ContainerHeight = container.innerHeight();
 
                    let scaleFactor;
                    // get the scale
                    scaleFactor = Math.min(ContainerWidth / imageWidth, ContainerHeight / imageHeight);

                    // Finding the new width and height based on the scale factor
                    let newWidth = parseInt(imageWidth * scaleFactor);
                    let newHeight = parseInt(imageHeight * scaleFactor);

                    // Adjust canvas size.  
                    container.width = newWidth;
                    container.height = newHeight;
                    ctx.canvas.height = newHeight;
                    ctx.canvas.width = newWidth;
                    ctxCanvasOverlay.canvas.height = newHeight;
                    ctxCanvasOverlay.canvas.width = newWidth;

                    // get the top left position of the image
                    // in order to center the image within the canvas
                    let x = (canvas.width / 2) - (newWidth / 2);
                    let y = (canvas.height / 2) - (newHeight / 2);

                    // When drawing the image, we have to scale down the image
                    // width and height in order to fit within the canvas
                    ctx.drawImage(image, x, y, newWidth, newHeight);
                    //document.getElementById(`${canvasId}Container`);
                    //ctx.canvas.width = document.getElementById(`${canvasId}Container`).clientWidth;
                    //ctx.canvas.height = document.getElementById(`${canvasId}Container`).clientHeight;
                    //ctx.drawImage(image, 0, 0, image.width, image.height);

                };
                image.src = `data:image/jpeg;base64,${jsonData.contents}`;

                let overlayCanvas = document.getElementById(`${canvasId}Overlay`);
                let overlayCtx = overlayCanvas.getContext('2d');

                overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
                overlayCtx.strokeStyle = 'red';
                overlayCtx.lineWidth = 1;
                overlayCtx.strokeRect(0, 0, 100, 100);
            }

            let loader = document.getElementById(`${canvasId}LoaderWrapper`);
            loader.style.display = "none";
    });
}

function processTelemetry(payload) {

    // Fill out logging area
    let jsonData = JSON.parse(payload);
    let jsonPretty = JSON.stringify(jsonData, undefined, 2);
    let timeStamp = getDate(jsonData["T"]);

    //$("#txAreaStatus").val($("#txAreaStatus").val() + `${timeStamp} Telemetry : ${jsonPretty}\r\n`);
    document.getElementById("txAreaStatus").value += `${timeStamp} Telemetry : ${jsonPretty}\r\n`;

    // Find results section based on device id match.
    let deviceId = jsonData["DeviceId"];

    for (index = 1; index < 4; index++)
    {
        if ($(`#camera_${index}_name`).attr('data-deviceId') == deviceId)
        {
            let labelId = `#result_label_${index}`;
            $(`${labelId}`).attr('data-inferenceCount', parseInt($(`${labelId}`).attr('data-inferenceCount')) + 1);
            $(`${labelId}`).html($(`${labelId}`).attr('data-inferenceCount'));

            if (jsonData["inferenceResults"].length > 0) {

                let canvas = document.getElementById(`canvasCamera${index}`);
                let ctx = canvas.getContext('2d');

                let overlayCanvas = document.getElementById(`canvasCamera${index}Overlay`);
                let overlayCtx = overlayCanvas.getContext('2d');
                overlayCtx.strokeStyle = 'red';
                overlayCtx.lineWidth = 1
                overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

                for (const key in jsonData["inferenceResults"])
                {
                    if (jsonData["inferenceResults"][key].Confidence > 0.5) {
                        console.log(jsonData["inferenceResults"][key])

                        let x = parseInt(canvas.width * jsonData["inferenceResults"][key].x);
                        let y = parseInt(canvas.height * jsonData["inferenceResults"][key].y);
                        let X = parseInt(canvas.width * jsonData["inferenceResults"][key].X);
                        let Y = parseInt(canvas.height * jsonData["inferenceResults"][key].Y);

                        overlayCtx.strokeRect(x, y, X - x, Y - y);
                    }
                }
            }
        }
    }
}

function toggleAiButton(buttonId, bActive) {
    if (bActive) {
        $(`#${buttonId}`).attr('data-streaming', true);
        $(`#${buttonId}`).addClass('btn-ai-active');
        $(`#${buttonId}`).removeClass('btn-ai-inactive');
    }
    else {
        $(`#${buttonId}`).attr('data-streaming', false);
        $(`#${buttonId}`).addClass('btn-ai-inactive');
        $(`#${buttonId}`).removeClass('btn-ai-active');
    }

}

function btnAiClick(item) {
    let bStreaming = ($(item).attr('data-streaming') == 'true');
    toggleAiButton(item.id, !bStreaming);

}
