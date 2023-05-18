
// Initialize canvases.
// There are 2 canvases for the image.
// - canvas to draw image using GetDirectImage() API
// - overlaycanvas to draw bouding boxes based on inference results.

function initCanvas(canvasId) {

    let container = $(`#${canvasId}Container`);
    let ContainerWidth = container.innerWidth();
    let ContainerHeight = container.innerHeight();

    // Initialize canvas to draw image
    let canvas = document.getElementById(canvasId);
    let ctx = canvas.getContext('2d');

    // set canvas size to fit Container DIV
    ctx.canvas.width = ContainerHeight
    ctx.canvas.height = ContainerWidth;

    // Initialize overlay canvas 
    let overlayCanvas = document.getElementById(`${canvasId}Overlay`);
    let overlayCtx = overlayCanvas.getContext('2d');

    // set canvas size to fit Container DIV
    overlayCtx.canvas.width = ContainerWidth;
    overlayCtx.canvas.height = ContainerHeight;

    // set font in case we want to draw text on the overlay canvas.
    overlayCtx.font = '24px Inter';
    overlayCtx.lineWidth = 1;
    overlayCtx.textBaseline = "top";
    overlayCtx.fillStyle = "#11283E";
    overlayCtx.textAlign = "center";

    // Display a message
    overlayCtx.fillText("Loading Image", parseInt(overlayCanvas.width / 2), parseInt((overlayCanvas.height/3) * 2));
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
function EnableDisableLogCard() {
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

    UpdateCameraInfo(device_1_id, 'camera_1_name', 'camera_1_wifi_icon', 'modelListCamera1', 'canvasCamera1', 'btnAICamera1');
    UpdateCameraInfo(device_2_id, 'camera_2_name', 'camera_2_wifi_icon', 'modelListCamera2', 'canvasCamera2', 'btnAICamera2');
    UpdateCameraInfo(device_3_id, 'camera_3_name', 'camera_3_wifi_icon', 'modelListCamera3', 'canvasCamera3', 'btnAICamera3');
}

//
// Retrieve and update UI for a cameara.
//
function UpdateCameraInfo(deviceId, cameraNameId, wifiIconId, modelListId, canvasId, btnAiCamera) {

    // Get device information
    GetDevices(deviceId)
        .done(function (response) {
            let jsonData = JSON.parse(response.value);
            let jsonPretty = JSON.stringify(jsonData, undefined, 2);

            // add to log
            document.getElementById("txAreaStatus").value += `GetDevices : ${jsonPretty}\r\n`;

            // make sure we are looking at the right device.
            if (jsonData.device_id == deviceId) {

                // if sensor status is streaming, inference is running.
                // Update "AI" button in the header
                if (jsonData['state'].Status.Sensor == 'Streaming') {
                    toggleAiButton(btnAiCamera, true);
                }
                else {
                    toggleAiButton(btnAiCamera, false);
                }

                // Update UI with Camera's display name (vs. Device ID)
                $(`#${cameraNameId}`).html(jsonData['property'].device_name);

                // Remember Device ID as an attribute
                $(`#${cameraNameId}`).attr('data-deviceId', deviceId);

                // Check connection status
                // Update WiFi icon color through CSS Class based on connection status
                if (jsonData.connectionState == "Connected") {
                    $(`#${wifiIconId}`).addClass('WiFi-Svg-Connect');
                    $(`#${wifiIconId}`).removeClass('WiFi-Svg-DisConnect');
                } else {
                    $(`#${wifiIconId}`).addClass('WiFi-Svg-DisConnect');
                    $(`#${wifiIconId}`).removeClass('WiFi-Svg-Connect');
                }
            }

            // Update Mode drop down list
            var list = $(`#${modelListId}`);

            list.empty();
            debugger
            for (var model in jsonData.models) {
                var option = $('<option>').val(jsonData.models[model].model_version_id);
                option.text(jsonData.models[model].model_version_id);
                list.append(option);
            }
        });

    // Get a snapshot through GetDirectImage() console API.
    // work in progress
    // Should call this onlyl when the device is connected.
    GetDirectImage(deviceId)
        .done(function (response) {

            let jsonData = JSON.parse(response.value);

            if (jsonData.result == "SUCCESS") {

                // work in progress.  Image size/aspect ratio breaks when window is resized.
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

    for (index = 1; index < 4; index++)
    {
        if ($(`#camera_${index}_name`).attr('data-deviceId') == deviceId)
        {
            let labelId = `#result_label_${index}`;

            // update Results => Inference Results UI
            $(`${labelId}`).attr('data-inferenceCount', parseInt($(`${labelId}`).attr('data-inferenceCount')) + 1);
            // remember the last count as an attribute
            $(`${labelId}`).html($(`${labelId}`).attr('data-inferenceCount'));

            if (jsonData["inferenceResults"].length > 0) {

                let canvas = document.getElementById(`canvasCamera${index}`);
                let ctx = canvas.getContext('2d');

                let overlayCanvas = document.getElementById(`canvasCamera${index}Overlay`);
                let overlayCtx = overlayCanvas.getContext('2d');
                overlayCtx.strokeStyle = 'red';
                overlayCtx.lineWidth = 2
                overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

                // Loop through inference results
                for (const key in jsonData["inferenceResults"])
                {
                    // work in progress
                    // Need a way to configure confidence level threshold (Global)
                    if (jsonData["inferenceResults"][key].Confidence > 0.5) {

                        // draw a bounding box
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

// Toggles state of AI button in the header
// Control button color using CSS class (Green vs. Grey)
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

//
// Called from button click event hander.
// Placeholder for additional control (call StartUploadInferenceResult())
function btnAiClick(item) {
    let bStreaming = ($(item).attr('data-streaming') == 'true');

    // Work in progress
    // 1. Should check current sensor status
    // 2. If not "streaming", call StartUploadInferenceResult()
    // 3. If "streaming", do nothing or display warning?

    toggleAiButton(item.id, !bStreaming);
}

//
// Called when "Start Demo" button in Navbar is clicked.
// Calls StartUploadInferenceResult() on all devices.
//
function StartInferences(device_1_id, device_2_id, device_3_id) {
    StartUploadInferenceResult(device_1_id);
    StartUploadInferenceResult(device_2_id);
    StartUploadInferenceResult(device_3_id);
}