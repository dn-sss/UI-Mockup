// Utility Functions


// Get date from 'T' in inference results
function getDate(dateString) {
    var date = new Date(Date.UTC(dateString.substr(0, 4), dateString.substr(4, 2), dateString.substr(6, 2), dateString.substr(8, 2), dateString.substr(10, 2), dateString.substr(12, 2), dateString.substr(14, 3)));
    return date;
}

// Initialize cameras
async function initCameras() {

    var fn = `${arguments.callee.name}()`;
    console.debug(`=> ${fn}`);

    // Get Model Information to populate drop down
    const modelRet = GetModelInfo();

    // Initialize cameras
    const camera1 = InitializeCamera(deviceIds[0], 'suitcase_people');
    const camera2 = InitializeCamera(deviceIds[1], 'suitcase_car');

    // Wait for all promises
    const final = [await modelRet, await camera1, await camera2];

    console.debug(`<= ${fn}`);
    return;
}

//
// Retrieve and update UI for a cameara.
//
async function InitializeCamera(deviceId, modelName) {

    var fn = `${arguments.callee.name}(${deviceId})`;
    console.debug(`=> ${fn}`);

    // Get device information
    if (deviceId.length == 0) {
        return false;
    }

    let cameraInfo = cameraInfoMap.get(deviceId);
    let canvasId = cameraInfo.canvas;

    // Can GetDevice API to retrieve Camera Info
    const response = await GetDevices(deviceId);

    // Parse response
    let jsonData = JSON.parse(response.value);

    // make sure we are looking at the right device.
    if (jsonData.device_id == deviceId) {

        // Update UI with Camera's display name (vs. Device ID)
        // Replace '_' with white space? 
        $(`#${cameraInfo.cameraNameId}`).html(jsonData['property'].device_name.replaceAll('_', '&nbsp'));

        // Remember Device ID as an attribute so that we know which device buttons are for.
        cameraInfo.cameraName = jsonData['property'].device_name;
        $(`#${cameraInfo.cameraNameId}`).attr('data-deviceId', deviceId);
        $(`#${cameraInfo.btnAiId}`).attr('data-deviceId', deviceId);
        $(`#${cameraInfo.btnRefreshImageId}`).attr('data-deviceId', deviceId);
        $(`#${cameraInfo.btnClearImageId}`).attr('data-deviceId', deviceId);

        // Update Model drop down list
        var list = $(`#${cameraInfo.modelListId}`);
        let defaultModelId = '';
        list.empty();
        for (var model in jsonData.models) {
            var option = $('<option>').val(jsonData.models[model].model_version_id.split(":")[0]);
            option.text(jsonData.models[model].model_version_id);

            // check if this matches to the specified default model ID
            if (jsonData.models[model].model_version_id.includes(modelName)) {
                defaultModelId = jsonData.models[model].model_version_id.split(":")[0];
            }
            list.append(option);
        }

        // Set the selection
        list.val(defaultModelId);

        // Check connection status
        // Update WiFi icon color through CSS Class based on connection status
        if (jsonData.connectionState == "Connected") {
            $(`#${cameraInfo.wifiIconId}`).addClass('Svg-Active');
            $(`#${cameraInfo.wifiIconId}`).removeClass('Svg-Inactive');

            if (jsonData['state'].Status.Sensor == 'Streaming') {
                // stop streaming
                const response = await StopUploadInferenceResult(deviceId);
            }
            else {
                // Make srue AI button is inactive state
                toggleAiButtonActiveState(cameraInfo.btnAiId, false);
            }

            // We are done.
            displayMessage(canvasId, "Device Ready");

            // enable buttons
            DisableButtons(cameraInfo, false);
            bRet = true;

        } else {
            // Camera is not online.

            $(`#${cameraInfo.wifiIconId}`).addClass('Svg-Inactive');
            $(`#${cameraInfo.wifiIconId}`).removeClass('Svg-Active');
            document.getElementById(`${canvasId}_loaderWrapper`).style.display = "none";
            displayMessage(canvasId, "Device Offline");
            bRet = false;
        }
    }
    console.debug(`<= ${fn} bRet : ${bRet}`);
    return bRet;
}

// Initialize canvases.
// There are 3 canvases for the image.
// - canvas to draw image using GetDirectImage() API
// - canvasAnnotation to draw bouding boxes based on inference results.

function initCanvas(canvasId) {

    var fn = `${arguments.callee.name}()`;
    console.debug(`=> ${fn}`);

    let image = document.getElementById("aitrios-logo");

    // Initialize canvas to draw image
    let canvas = document.getElementById(canvasId);
    let ctx = canvas.getContext('2d');

    // Set canvas size using background image
    canvas.width = image.width;
    canvas.height = image.height;

    // Draw background image
    ctx.drawImage(image, 0, 0);

    // Set size for annotation overlay canvas
    let canvasAnnotation = document.getElementById(`${canvasId}_overlay_annotation`);
    let ctxAnnotation = canvasAnnotation.getContext('2d');
    ctxAnnotation.canvas.width = image.width;
    ctxAnnotation.canvas.height = image.height;

    // Set size for message overlay canvas
    let canvasMessage = document.getElementById(`${canvasId}_overlay_message`);
    let ctxMessage = canvasMessage.getContext('2d');
    ctxMessage.canvas.width = image.width;
    ctxMessage.canvas.height = image.height;

    console.debug(`<= ${fn}`);
}

//
// Function to display spinner and message
//
function showSpinnerAndDisplayMessage(canvasId, message) {

    document.getElementById(`${canvasId}_loaderWrapper`).style.display = "block";

    // Display a message
    if (message)
    {
        displayMessage(canvasId, message);
    }
}

//
// Function to display message on message overlay canvas
//
function displayMessage(canvasId, message) {
    var fn = `${arguments.callee.name}()`;
    console.debug(`=> ${fn} : ${message}`);

    // Initialize overlay canvas 
    let canvasMessage = document.getElementById(`${canvasId}_overlay_message`);
    let ctxMessage = canvasMessage.getContext('2d');

    // set font
    ctxMessage.font = '24px Inter';
    ctxMessage.textBaseline = "top";
    ctxMessage.fillStyle = "#ffffff";
    ctxMessage.textAlign = "center";
    ctxMessage.clearRect(0, 0, canvasMessage.width, canvasMessage.height);

    // Display a message
    ctxMessage.fillText(message, parseInt(canvasMessage.width / 2), parseInt((canvasMessage.height / 7) * 5));
}

//
// Function to hide spinner on canvas
//
function HideSpinner(canvasId) {
    let loader = document.getElementById(`${canvasId}_loaderWrapper`);
    loader.style.display = "none";

    let canvasMessage = document.getElementById(`${canvasId}_overlay_message`);
    let ctxMessage = canvasMessage.getContext('2d');
    ctxMessage.clearRect(0, 0, canvasMessage.width, canvasMessage.height);
}

//
// Function to load an image to image canvas
//
function loadImageToCanvas(canvasId, fileName) {
    let canvas = document.getElementById(canvasId);
    let ctx = canvas.getContext('2d');

    var image = new Image();
    image.onload = function () {
        let imageWidth = image.width;
        let imageHeight = image.height;
        ctx.canvas.height = imageHeight;
        ctx.canvas.width = imageWidth;
        ctx.drawImage(image, 0, 0, imageWidth, imageHeight);
        ctx.save();
    };

    image.src = `/images/${fileName}`;
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
// Processes Telemetry (Inference results)
// Draws bounding boxes
//
function processTelemetry(payload) {

    // Fill out logging area
    let jsonData = JSON.parse(payload);
    let jsonPretty = JSON.stringify(jsonData, undefined, 2);
    let timeStamp = getDate(jsonData["T"]);
    // Add to log

    if (bInitialized == false) {
        return;
    }
    Add2Log(`${timeStamp} Telemetry : ${jsonPretty}`);

    // Find results section based on device id match.
    let deviceId = jsonData["DeviceId"];
    let cameraInfo = cameraInfoMap.get(deviceId);

    HideSpinner(cameraInfoMap.get(deviceId).canvas);

    for (index = 1; index < 4; index++) {

        let detectCount = 0;

        if ($(`#camera_${index}_name`).attr('data-deviceId') == deviceId) {

            let canvasId = cameraInfo.canvas;
            let canvas = document.getElementById(canvasId);
            let canvasAnnotationId = `${canvasId}_overlay_annotation`;
            let inferenceCountLabel = `#camera_${index}_inf_count_label`;
            let detectCountLabel = `#camera_${index}_detect_count_label`;
            let modelInfo = modelInfoMap.get(cameraInfo.currentModelId); 

            let pendingInferenceCount = -1;  // assume autopilot

            if (pendingInferenceCount == 0) {
                // enable buttons
                DisableButtons(cameraInfo, false);
                return;
            }

            if (cameraInfo.pendingInferenceCount > 0) {
                pendingInferenceCount = cameraInfo.pendingInferenceCount - 1;

                console.debug(`${timeStamp.toISOString()} Pending Inference Count ${pendingInferenceCount}`);

                SetPendingInferenceCount(deviceId, pendingInferenceCount);
            }

            // update Results => Inference Results UI
            $(`${inferenceCountLabel}`).attr('data-inferenceCount', parseInt($(`${inferenceCountLabel}`).attr('data-inferenceCount')) + 1);
            // remember the last count as an attribute
            $(`${inferenceCountLabel}`).html($(`${inferenceCountLabel}`).attr('data-inferenceCount'));

            if (jsonData["inferenceResults"].length > 0) {
                let canvasAnnotation = document.getElementById(canvasAnnotationId);
                let ctxAnnotation = canvasAnnotation.getContext('2d');

                ctxAnnotation.lineWidth = 2
                ctxAnnotation.clearRect(0, 0, canvasAnnotation.clientWidth, canvasAnnotation.clientHeight);

                // Loop through inference results

                for (const key in jsonData["inferenceResults"]) {
                    // work in progress
                    // Need a way to configure confidence level threshold (Global)
                    if (jsonData["inferenceResults"][key].Class == modelInfo.classId && jsonData["inferenceResults"][key].Confidence > 0.1) {

                        ctxAnnotation.strokeStyle = classColorMap.get(jsonData["inferenceResults"][key].Class);
                        // draw a bounding box
                        let x = parseInt(canvas.width * jsonData["inferenceResults"][key].x);
                        let y = parseInt(canvas.height * jsonData["inferenceResults"][key].y);
                        let X = parseInt(canvas.width * jsonData["inferenceResults"][key].X);
                        let Y = parseInt(canvas.height * jsonData["inferenceResults"][key].Y);
                        ctxAnnotation.strokeRect(x, y, X - x, Y - y);
                        detectCount += 1;
                    }
                    else {
                    }
                }

                $(`${detectCountLabel}`).html(detectCount);
            }

            if (pendingInferenceCount == 0) {

                toggleAiButtonActiveState(cameraInfoMap.get(deviceId).btnAiId, false);

                if (bAutoPilot == true && bAutoPilotImage == true) {

                    GetDirectImage(deviceId, true)
                        .then(function (response) {
                            let jsonData = JSON.parse(response.value);
                            ProcessGetDirectImageResponse(canvasId, jsonData, false, cameraInfoMap.get(deviceId).btnAiId);
                            StartUploadInferenceResultWrapper(deviceId);
                        });
                }
                else {
                    DisableButtons(cameraInfo, false);
                }
            }
        }
    }
}

// Toggles state of AI button in the header
// Control button color using CSS class (Green vs. Grey)
function toggleAiButtonActiveState(buttonId, bActive) {

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

/**********************************************************************************/
// Button Click Event Handlers
/**********************************************************************************/
async function btnAiClick(item) {

    var fn = `${arguments.callee.name}()`;
    console.debug(`=> ${fn}`);

    let deviceId = $(item).attr('data-deviceid');
    let cameraInfo = cameraInfoMap.get(deviceId);
    let bStreaming = ($(item).attr('data-streaming') == 'true');

    try {
        showSpinnerAndDisplayMessage(cameraInfo.canvas, null);
        // disable buttons
        DisableButtons(cameraInfo, true);

        // if Auto Pilot (Start buttons) is not running, start autopilot. 
        if (bAutoPilot == false || bAutoPilotImage == true) {

            // Get Image from the device
            const response = await GetDirectImage(deviceId, false);

            if (response != null) {

                let jsonData = JSON.parse(response.value);

                ProcessGetDirectImageResponse(cameraInfo.canvas, jsonData, false, cameraInfo.btnAiId);

                let fileName;
                let selectedModel = $(`#${cameraInfo.modelListId}`).find(":selected").val();

                if (selectedModel != undefined) {
                    if (selectedModel === 'suitcase_people') {
                        fileName = 'suitcase_people_1.json';
                    }
                    else {
                        fileName = 'suitcase_car_1.json';
                    }
                }

                if (bStreaming != 'true') {

                    const bRetApply = await ApplyCommandParameteFile(deviceId, fileName, cameraInfo.canvas);

                    if (bRetApply == true) {

                        SetPendingInferenceCount(deviceId, 1);

                        bRetStart = await StartUploadInferenceResult(deviceId);

                        if (bRetStart == false) {
                            console.error('StartUploadInferenceResult failed');
                            displayMessage(cameraInfo.canvas, 'Failed to start AI');
                            DisableButtons(cameraInfo, false);
                        }
                    }
                }
            }
            else {
                displayMessage(cameraInfo.canvas, 'Failed to retrieve image');
            }
        }
        else {
            let fileName;
            let selectedModel = $(`#${cameraInfo.modelListId}`).find(":selected").val();

            if (selectedModel != undefined) {
                if (selectedModel === 'suitcase_people') {
                    fileName = 'suitcase_people_0.json';
                }
                else {
                    fileName = 'suitcase_car_0.json';
                }
            }

            loadImageToCanvas(cameraInfo.canvas, 'Black-BG.png');

            if (bStreaming != 'true') {

                showSpinnerAndDisplayMessage(cameraInfo.canvas, "Sending Command to camera");

                const bRetApply = await ApplyCommandParameteFile(deviceId, fileName);

                if (bRetApply == true) {
                    await StartUploadInferenceResult(deviceId);
                }
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
    }

    console.debug(`<= ${fn}`);
}

async function btnGetDirectImageClick(item) {

    var fn = `${arguments.callee.name}()`;
    console.debug(`=> ${fn}`);

    let bStreaming = ($(item).attr('data-streaming') == 'true');
    let deviceId = $(item).attr('data-deviceId');
    let camearInfo = cameraInfoMap.get(deviceId);
    let canvasId = camearInfo.canvas;

    // To Do : Complete This
    //window.requestAnimationFrame(function () {
    //    fadeOut(canvasId);
    //});

    DisableButtons(camearInfo, true);

    if (bStreaming == 'true') {
        const response = await StopUploadInferenceResult(deviceId, false);
    }

    const response = await GetDirectImage(deviceId, true);

    if (response != null) {
        let jsonData = JSON.parse(response.value);
        ProcessGetDirectImageResponse(canvasId, jsonData, true, cameraInfoMap.get(deviceId).btnAiId);
        DisableButtons(camearInfo, false);
    }

    console.debug(`<= ${fn}`);
}

function btnImageClearClick(item) {

    let deviceId = $(item).attr('data-deviceId');
    let canvasId = cameraInfoMap.get(deviceId).canvas;

    var canvas = document.getElementById(canvasId);
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    let canvasAnnotation = document.getElementById(`${canvasId}_overlay_annotation`);
    let ctxAnnotation = canvasAnnotation.getContext('2d');
    ctxAnnotation.clearRect(0, 0, canvasAnnotation.clientWidth, canvasAnnotation.clientHeight);

    let canvasMessage = document.getElementById(`${canvasId}_overlay_message`);
    let ctxMessage = canvasMessage.getContext('2d');
    ctxMessage.clearRect(0, 0, canvasMessage.clientWidth, canvasMessage.clientHeight);

    var image = new Image();
    image.onload = function () {
        let imageWidth = image.width;
        let imageHeight = image.height;
        ctx.canvas.height = imageHeight;
        ctx.canvas.width = imageWidth;
        //ctx.globalAlpha = 0;
        ctx.drawImage(image, 0, 0, imageWidth, imageHeight);
        ctx.save();
        // to do : Complete this
        //window.requestAnimationFrame(function () {
        //    fadeIn(canvasId);
        //});
    };
    image.src = '/images/AITRIOS-Logo-Canvas-BG.png';

}

//
// Get info on models
// 1. Set imageCountMap for # of inferences expected
// 2. Set Model in the Drop Down list.
async function GetModelInfo() {

    var fn = `${arguments.callee.name}()`;
    console.debug(`=> ${fn}`);

    const response = await GetCommandParameterFile();

    if (response != null) {

        let jsonData = JSON.parse(response.value);

        for (var index in jsonData.parameter_list) {

            for (var device in jsonData.parameter_list[index].device_ids) {

                if (deviceIds.includes(jsonData.parameter_list[index].device_ids[device])) {
                    let deviceId = jsonData.parameter_list[index].device_ids[device];

                    for (var command in jsonData.parameter_list[index].parameter.commands) {
                        // remember value of NumberOfImages and ModelId
                        let numImages = jsonData.parameter_list[index].parameter.commands[command].parameters.NumberOfImages;
                        let modelId = jsonData.parameter_list[index].parameter.commands[command].parameters.ModelId;

                        imageCountMap.set(deviceId, numImages);
                        SetCurrentModelId(deviceId, modelId);
                        SetCurrentCommandParameterFile(deviceId, jsonData.parameter_list[index].file_name);
                    }
                }
            }
        }
    }
    console.debug(`<= ${fn}`);
    return;
}

function ProcessGetDirectImageResponse(canvasId, jsonData, bClearOverlay, buttonId) {
    var fn = `${arguments.callee.name}()`;
    console.debug(`=> ${fn}`);

    try {

        if (jsonData.result == "SUCCESS") {

            // work in progress.  Image size/aspect ratio breaks when window is resized.
            var canvas = document.getElementById(canvasId);
            var ctx = canvas.getContext("2d");

            var canvasAnnotation = document.getElementById(`${canvasId}_overlay_annotation`);
            var ctxAnnotation = canvasAnnotation.getContext("2d");

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

                ctxAnnotation.canvas.height = newHeight;
                ctxAnnotation.canvas.width = newWidth;

                // get the top left position of the image
                // in order to center the image within the canvas
                let x = (canvas.width / 2) - (newWidth / 2);
                let y = (canvas.height / 2) - (newHeight / 2);

                // When drawing the image, we have to scale down the image
                // width and height in order to fit within the canvas
                ctx.drawImage(image, x, y, newWidth, newHeight);
                ctx.save();
            };
            image.src = `data:image/jpeg;base64,${jsonData.contents}`;

            if (bClearOverlay) {
                ctxAnnotation.clearRect(0, 0, canvasAnnotation.width, canvasAnnotation.height);
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
    }
}

function StartUploadInferenceResultWrapper(deviceId) {
    let btnAiId = cameraInfoMap.get(deviceId).btnAiId;

    // Start AI Inference by triggering a click on AI Button
    $(`#${btnAiId}`).trigger("click");
}

async function StopUploadInferenceResultWrapper(deviceId) {
    const response = await StopUploadInferenceResult(deviceId, true);

    if (response == true) {
        console.error('Failed to Stop Inference');
    }
    DisableButtons(cameraInfoMap.get(deviceId), false);
}

async function ApplyCommandParameteFile(deviceId, fileName, canvasId) {

    var fn = `${arguments.callee.name}(${deviceId})`;
    console.debug(`=> ${fn} file : ${fileName}`);
    var bRet = false;
    var cameraInfo = cameraInfoMap.get(deviceId);

    try {
        if (cameraInfo.currentCommandParameterFile === fileName) {
            bRet = true;
        }
        else {
            console.debug(`Changing Command Parameter file from ${cameraInfo.currentCommandParameterFile} to ${fileName}`)
            if (cameraInfo.currentCommandParameterFile.length > 0) {
                const response = await CancelCommandParameterFile(deviceId, cameraInfo.currentCommandParameterFile);

                if (response == false) {
                    console.error('Failed to Cancel Command Parameter Files');
                }
            }

            const response = await ApplyCommandParameterFileToDevice(deviceId, fileName);

            if (response == false) {
                console.error('Failed to Apply Command Parameter Files');
            }

            bRet = response;
        }

    } catch (err) {
        console.error(err);
    } finally {
        console.debug(`<= ${fn} bRet : ${bRet}`);
    }

    return bRet;
}

function StartAutoPilotNoImage() {

    deviceIds.forEach((deviceId) => {

        let cameraInfo = cameraInfoMap.get(deviceId);
        let fileName;
        let selectedModel = $(`#${cameraInfo.modelListId}`).find(":selected").val();

        DisableButtons(cameraInfo, true);
        loadImageToCanvas(cameraInfo.canvas, 'Black-BG.png');
        showSpinnerAndDisplayMessage(cameraInfo.canvas, "Sending Command to camera");

        if (selectedModel != undefined) {
            if (selectedModel === 'suitcase_people') {
                fileName = 'suitcase_people_0.json';
            }
            else {
                fileName = 'suitcase_car_0.json';
            }
        }

        if (cameraInfo.currentCommandParameterFile.length > 0) {
            CancelCommandParameterFile(deviceId, cameraInfo.currentCommandParameterFile);
        }
        ApplyCommandParameterFileToDevice(deviceId, fileName);

        StartUploadInferenceResult(deviceId);
    });
}

function DisableButtons(cameraInfo, disable) {
    var fn = `${arguments.callee.name}(${disable})`;
    console.debug(`=> ${fn}`);

    $(`#${cameraInfo.btnAiId}`).prop('disabled', disable);
    $(`#${cameraInfo.btnRefreshImageId}`).prop('disabled', disable);
    $(`#${cameraInfo.btnClearImageId}`).prop('disabled', disable);

    if (disable) {
        $(`#autopilot-start-No-Image-ahref`).addClass('link-disabled');
        $(`#autopilot-start-ahref`).addClass('link-disabled');
        $(`#autopilot-stop-ahref`).addClass('link-disabled')

    }
    else {
        $(`#autopilot-start-No-Image-ahref`).removeClass('link-disabled');
        $(`#autopilot-start-ahref`).removeClass('link-disabled');
        $(`#autopilot-stop-ahref`).removeClass('link-disabled')
    }
}


function SetCurrentCommandParameterFile(deviceId, fileName) {

    var cameraInfoValue = cameraInfoMap.get(deviceId);
    cameraInfoValue.currentCommandParameterFile = fileName;
    cameraInfoMap.set(deviceId, cameraInfoValue);
    Add2Log(`${fileName} Applied`);
}

function SetCurrentModelId(deviceId, modelId) {

    var cameraInfoValue = cameraInfoMap.get(deviceId);

    if (modelId.includes('.json')) {

        for (let [key, value] of modelInfoMap) {
            let found = Object.keys(value).find(key => value[key] === modelId.split('.')[0]);

            if (found != undefined) {
                cameraInfoValue.currentModelId = key;
                break;
            }
        };
    }
    else {
        cameraInfoValue.currentModelId = modelId;
    }

    cameraInfoMap.set(deviceId, cameraInfoValue);
}

function FindModelIdFromJsonFileName(jsonFile) {

}


function SetPendingInferenceCount(deviceId, count) {

    var cameraInfoValue = cameraInfoMap.get(deviceId);
    cameraInfoValue.pendingInferenceCount = count;
    cameraInfoMap.set(deviceId, cameraInfoValue);

}

function Add2Log(message) {
    document.getElementById("txAreaStatus").value += `---------------------------------------------------------\r\n${message}\r\n`;
}

function GetCanvasFromDeviceId(deviceId) {

    return cameraInfoMap.get(deviceId).canvas;
}

function fadeIn(canvasId) {
    let canvas = document.getElementById(canvasId);
    let context = canvas.getContext("2d");
    context.restore();
    context.globalAlpha += 0.02;
    let imgData = context.getImageData(0, 0, canvas.width, canvas.height);

    if (context.globalAlpha < 1) {
        context.putImageData(imgData, 0, 0);
        context.save();
        window.requestAnimationFrame(function () {
            fadeIn(canvasId);
        });
    }
}

function fadeOut(canvasId) {
    let canvas = document.getElementById(canvasId);
    let context = canvas.getContext("2d");
    let imgData = context.getImageData(0, 0, canvas.width, canvas.height);
    context.restore();
    context.globalAlpha -= 0.02;

    if (context.globalAlpha > 0) {
        context.putImageData(imgData, 0, 0);
        context.save();
        window.requestAnimationFrame(function () {
            fadeOut(canvasId);
        });
    }

    //for (let i = 0; i < imgData.data.length; i += 4) {
    //    r = imgData.data[i];
    //    g = imgData.data[i + 1];
    //    b = imgData.data[i + 2];
    //    if (r > 0) r--;
    //    imgData.data[i] = r;
    //    if (g > 0) g--;
    //    imgData.data[i + 1] = g;
    //    if (b > 0) b--;
    //    imgData.data[i + 2] = b;
    //}
    //context.putImageData(imgData, 0, 0);
    //window.requestAnimationFrame(function () {
    //    fadeOut(canvasId);
    //});
}