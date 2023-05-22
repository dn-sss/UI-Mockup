
// Initialize canvases.
// There are 2 canvases for the image.
// - canvas to draw image using GetDirectImage() API
// - overlaycanvas to draw bouding boxes based on inference results.

function initCanvas(canvasId) {

    let container = $(`#${canvasId}_container`);
    let ContainerWidth = container.innerWidth();
    let ContainerHeight = container.innerHeight();

    // Initialize canvas to draw image
    let canvas = document.getElementById(canvasId);
    let ctx = canvas.getContext('2d');

    // set canvas size to fit Container DIV
    ctx.canvas.width = ContainerHeight
    ctx.canvas.height = ContainerWidth;

    canvas = document.getElementById(`${canvasId}_overlay`);
    ctx = canvas.getContext('2d');

    // set canvas size to fit Container DIV
    ctx.canvas.width = ContainerHeight
    ctx.canvas.height = ContainerWidth;

    canvas = document.getElementById(`${canvasId}_overlay_message`);
    ctx = canvas.getContext('2d');

    // set canvas size to fit Container DIV
    ctx.canvas.clientWidth = ContainerHeight
    ctx.canvas.clientHeight = ContainerWidth;

    showSpinnerAndDisplayMessage(canvasId, "Fetching Image");
}

//
// Function to display spinner and message
//

function showSpinnerAndDisplayMessage(canvasId, message) {

    // Initialize overlay canvas 
    let overlayCanvas = document.getElementById(`${canvasId}_overlay_message`);
    let overlayCtx = overlayCanvas.getContext('2d');

    document.getElementById(`${canvasId}_loaderWrapper`).style.display = "block";

    // set font in case we want to draw text on the overlay canvas.
    overlayCtx.font = '24px Inter';
    overlayCtx.textBaseline = "top";
    overlayCtx.fillStyle = "#ffffff";
    overlayCtx.textAlign = "center";

    overlayCtx.clearRect(0, 0, overlayCanvas.clientWidth, overlayCanvas.clientHeight);

    // Display a message
    overlayCtx.fillText(message, parseInt(overlayCanvas.width / 2), parseInt((overlayCanvas.height / 5) * 3));

}
//
// Called from input change event listner for sliders
// 
function processSliderInput(evt) {
    $(`#${evt.target.id}Label`).html(`${evt.target.value}%`);
}

//
// Toggle Log Frame on/off
// Called when a button in the navbar is clicked.
//
function ToggleDisplayLogTile() {
    let divLog = document.getElementById("divLog");
    let labeldivLog = document.getElementById("labeltxAreaStatus");

    divLog.hidden = !divLog.hidden;

    // Change button label
    if (divLog.hidden == true) {
        labeldivLog.innerHTML = 'Display Logs';
    }
    else {
        labeldivLog.innerHTML = 'Hide Logs';
    }
}

//
// A wrapper function to initialize frames (columns for each camera)
// Called when a page is ready
//
function UpdateAllCameraData(device_1_id, device_2_id, device_3_id) {

    UpdateCameraInfo(device_1_id, 'camera_1_name', 'camera_1_wifi_icon', 'camera_1_model_list', 'camera_1_ai_btn', 'camera_1_image_refresh');
    UpdateCameraInfo(device_2_id, 'camera_2_name', 'camera_2_wifi_icon', 'camera_2_model_list', 'camera_2_ai_btn', 'camera_2_image_refresh');
    //Disabled for EVS
    //UpdateCameraInfo(device_3_id, 'camera_3_name', 'camera_3_wifi_icon', 'camera_3_model_list', 'camera_3_canvas', 'camera_3_ai_btn', 'camera_3_image_refresh');

}

//
// Retrieve and update UI for a cameara.
//
async function UpdateCameraInfo(deviceId, cameraNameId, wifiIconId, modelListId, btnAiCameraId, btnRefreshImageId) {


    // Get device information
    console.log("==> GetDevices");

    if (deviceId.length == 0) {
        return false;
    }

    let canvasId = device2canvasMap.get(deviceId);

    GetDevices(deviceId)
        .done(async function (response) {
            let jsonData = JSON.parse(response.value);
            let jsonPretty = JSON.stringify(jsonData, undefined, 2);

            // add to log
            document.getElementById("txAreaStatus").value += `GetDevices : ${jsonPretty}\r\n`;

            // make sure we are looking at the right device.
            if (jsonData.device_id == deviceId) {
                // Update UI with Camera's display name (vs. Device ID)
                $(`#${cameraNameId}`).html(jsonData['property'].device_name);
                // Remember Device ID as an attribute
                $(`#${cameraNameId}`).attr('data-deviceId', deviceId);
                $(`#${btnAiCameraId}`).attr('data-deviceId', deviceId);
                $(`#${btnRefreshImageId}`).attr('data-deviceId', deviceId);

                // Update Model drop down list
                var list = $(`#${modelListId}`);

                list.empty();
                for (var model in jsonData.models) {
                    var option = $('<option>').val(jsonData.models[model].model_version_id.split(":")[0]);
                    option.text(jsonData.models[model].model_version_id);
                    list.append(option);
                }

                list.val(modelInfoMap.get(deviceId));

                // Check connection status
                // Update WiFi icon color through CSS Class based on connection status
                if (jsonData.connectionState == "Connected") {
                    $(`#${wifiIconId}`).addClass('Svg-Active');
                    $(`#${wifiIconId}`).removeClass('Svg-Inactive');

                    
                    if (jsonData['state'].Status.Sensor == 'Streaming') {
                        //toggleAiButton(btnAiCameraId, true);
                        console.debug(`${deviceId} is streaming`);
                        // stop streaming so we can grab an image
                        StopUploadInferenceResult(deviceId);
                    }
                    else {
                        toggleAiButton(btnAiCameraId, false);
                    }

                    // Get a snapshot through GetDirectImage() console API.
                    // work in progress
                    // Should call this onlyl when the device is connected.
                    showSpinnerAndDisplayMessage(canvasId, "Fetching Image");
                    GetDirectImage(deviceId)
                        .done(function (response) {
                            let jsonData = JSON.parse(response.value);
                            ProcessGetDirectImageResponse(canvasId, jsonData, true);

                        });

                    return true;

                } else {
                    $(`#${wifiIconId}`).addClass('Svg-Inactive');
                    $(`#${wifiIconId}`).removeClass('Svg-Active');

                    // to do
                    // should draw a message on overlay canvas
                    showSpinnerAndDisplayMessage(canvasId, "Device Offline");
                    document.getElementById(`${canvasId}_loaderWrapper`).style.display = "none";
                    return false;
                }
            }
        });
}

//
// Processes Telemetry (Inference results)
// Draws bounding boxes
//
function processTelemetry(payload) {

    // Fill out logging area
    let jsonData = JSON.parse(payload);
    let jsonPretty = JSON.stringify(jsonData, undefined, 2);
    let timeStamp = getDate(jsonData["T"]);

    // Add to log
    document.getElementById("txAreaStatus").value += `${timeStamp} Telemetry : ${jsonPretty}\r\n`;

    // Find results section based on device id match.
    let deviceId = jsonData["DeviceId"];

    HideSpinner(device2canvasMap.get(deviceId));

    pendingInferenceCount.set(deviceId, (pendingInferenceCount.get(deviceId) - 1));
    console.debug(`${timeStamp.toISOString()} Pending Inference Count ${pendingInferenceCount.get(deviceId)}`);

    for (index = 1; index < 4; index++) {

        let detectCount = 0;
        let canvasId = device2canvasMap.get(deviceId);
        let overlayCanvasId = `${canvasId}_overlay`;

        if ($(`#camera_${index}_name`).attr('data-deviceId') == deviceId) {
            let inferenceCountLabel = `#camera_${index}_inf_count_label`;
            let detectCountLabel = `#camera_${index}_detect_count_label`;
            // update Results => Inference Results UI
            $(`${inferenceCountLabel}`).attr('data-inferenceCount', parseInt($(`${inferenceCountLabel}`).attr('data-inferenceCount')) + 1);
            // remember the last count as an attribute
            $(`${inferenceCountLabel}`).html($(`${inferenceCountLabel}`).attr('data-inferenceCount'));

            if (jsonData["inferenceResults"].length > 0) {
                let canvas = document.getElementById(canvasId);
                let ctx = canvas.getContext('2d');

                let overlayCanvas = document.getElementById(overlayCanvasId);
                let overlayCtx = overlayCanvas.getContext('2d');
                overlayCtx.strokeStyle = 'red';
                overlayCtx.lineWidth = 2
                overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
                let classId = $(`#${overlayCanvasId}`).attr('data-obclass');

                // Loop through inference results
                for (const key in jsonData["inferenceResults"]) {
                    // work in progress
                    // Need a way to configure confidence level threshold (Global)
                    if (jsonData["inferenceResults"][key].Class == classId && jsonData["inferenceResults"][key].Confidence > 0.1) {

                        // draw a bounding box
                        let x = parseInt(canvas.width * jsonData["inferenceResults"][key].x);
                        let y = parseInt(canvas.height * jsonData["inferenceResults"][key].y);
                        let X = parseInt(canvas.width * jsonData["inferenceResults"][key].X);
                        let Y = parseInt(canvas.height * jsonData["inferenceResults"][key].Y);

                        overlayCtx.strokeRect(x, y, X - x, Y - y);
                        detectCount += 1;
                    }
                    else {
                    }
                }

                $(`${detectCountLabel}`).html(detectCount);
            }

            if (pendingInferenceCount.get(deviceId) == 0) {

                toggleAiButton(aiButtonMap.get(deviceId), false);

                if (bAutoPilot == true) {
                    showSpinnerAndDisplayMessage(canvasId, "Refreshing Image");
                    GetDirectImage(deviceId)
                        .done(function (response) {
                            let jsonData = JSON.parse(response.value);
                            ProcessGetDirectImageResponse(canvasId, jsonData, false);
                            StartUploadInferenceResultWrapper(deviceId);
                        });
                }
            }
        }
    }
}

// Toggles state of AI button in the header
// Control button color using CSS class (Green vs. Grey)
function toggleAiButton(buttonId, bActive) {

    let buttonIdArray = buttonId.split("_");
    let imageRefreshBtnId = `${buttonIdArray[0]}_${buttonIdArray[1]}_image_refresh`;

    if (bActive) {
        $(`#${buttonId}`).attr('data-streaming', true);
        $(`#${imageRefreshBtnId}`).attr('data-streaming', true);
        $(`#${buttonId}`).addClass('btn-ai-active');
        $(`#${buttonId}`).removeClass('btn-ai-inactive');
    }
    else {
        $(`#${buttonId}`).attr('data-streaming', false);
        $(`#${imageRefreshBtnId}`).attr('data-streaming', false);
        $(`#${buttonId}`).addClass('btn-ai-inactive');
        $(`#${buttonId}`).removeClass('btn-ai-active');
    }

}

//
// Called from button click event hander.
// Placeholder for additional control (call StartUploadInferenceResult())
function btnAiClick(item) {
    let bStreaming = ($(item).attr('data-streaming') == 'true');

    // Work in progress
    // 1. Should check current sensor status
    // 2. If not "streaming", call StartUploadInferenceResult()
    // 3. If "streaming", do nothing or display warning?

    if (bStreaming == 'true'); // do warning or nothing?
    else {
        let deviceId = $(item).attr('data-deviceid');

        showSpinnerAndDisplayMessage(device2canvasMap.get(deviceId), "Sending Command to camera");
        StartUploadInferenceResult($(item).attr('data-deviceId'))
            .done(function () {
                showSpinnerAndDisplayMessage(device2canvasMap.get(deviceId), "Waiting for AI results");
            });
    }
    toggleAiButton(item.id, !bStreaming);
}

function btnImageRefreshClick(item) {

    let bStreaming = ($(item).attr('data-streaming') == 'true');
    let deviceId = $(item).attr('data-deviceId');
    let canvasId = device2canvasMap.get(deviceId);

    showSpinnerAndDisplayMessage(canvasId, "Refreshing Image");

    if (bStreaming == 'true') {
        StopUploadInferenceResult(deviceId);
    }

    GetDirectImage(deviceId)
        .done(function (response) {
            let jsonData = JSON.parse(response.value);
            ProcessGetDirectImageResponse(canvasId, jsonData, true);
        });
}

//
// Get info on models
// 1. Set imageCountMap for # of inferences expected
// 2. Set Model in the Drop Down list.
function GetModelInfo() {

    GetCommandParameterFile()
        .done(async function (response) {

            let jsonData = JSON.parse(response.value);

            for (var index in jsonData.parameter_list) {
                var parameter = jsonData.parameter_list[index];

                for (var device in jsonData.parameter_list[index].device_ids) {
                    if (deviceIds.includes(jsonData.parameter_list[index].device_ids[device]))
                    {
                        for (var command in jsonData.parameter_list[index].parameter.commands) {
                            let deviceId = jsonData.parameter_list[index].device_ids[device];
                            let modelListId = modelListMap.get(deviceId);
                            let numImages = jsonData.parameter_list[index].parameter.commands[command].parameters.NumberOfImages;
                            let modelId = jsonData.parameter_list[index].parameter.commands[command].parameters.ModelId;
                            imageCountMap.set(deviceId, numImages);
                            modelInfoMap.set(deviceId, modelId);
                        }
                    }
                }
            }
        });
}

function ProcessGetDirectImageResponse(canvasId, jsonData, bClearOverlay) {

    if (jsonData.result == "SUCCESS") {

        // work in progress.  Image size/aspect ratio breaks when window is resized.
        var canvas = document.getElementById(canvasId);
        var ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        var canvasOverlay = document.getElementById(`${canvasId}_overlay`);
        var ctxCanvasOverlay = canvasOverlay.getContext("2d");
        var image = new Image();
        image.onload = function () {

            let imageWidth = image.width;
            let imageHeight = image.height;

            let container = $(`#${canvasId}_container`);

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

        let overlayCanvas = document.getElementById(`${canvasId}_overlay`);
        let overlayCtx = overlayCanvas.getContext('2d');

        if (bClearOverlay) {
            overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
        }
    }

    HideSpinner(canvasId);
}

function HideSpinner(canvasId) {
    let loader = document.getElementById(`${canvasId}_loaderWrapper`);
    loader.style.display = "none";

    let overlayCanvas = document.getElementById(`${canvasId}_overlay_message`);
    let overlayCtx = overlayCanvas.getContext('2d');
    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
}

function StartUploadInferenceResultWrapper(deviceId) {
    btnAiClick(document.getElementById(`${aiButtonMap.get(deviceId)}`));
}

function StopUploadInferenceResultWrapper(deviceId) {
    btnAiClick(document.getElementById(`${aiButtonMap.get(deviceId)}`));
}