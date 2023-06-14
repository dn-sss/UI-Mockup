//
// Wrapper Functions to call AITRIOSConsole controller to make
// Console API REST Calls.
//
// Work in progress
// Need to add error handling
//

//
// Calls GetDevices() API
// If Device ID is provided, AITRIOSConsole controller calls GetDevice() API.
// If Device ID is empty, AITRIOSConsole controller calls GetDevices() API.
//
async function GetDevices(deviceId) {

    var fn = `${arguments.callee.name}(${deviceId})`;
    console.debug(`==> ${fn}`);
    const start = Date.now();
    var result;
    var canvasId = GetCanvasFromDeviceId(deviceId);


    try {
        showSpinnerAndDisplayMessage(canvasId, `Retrieving Device Information`);

        await $.ajax({
            async: true,
            type: "GET",
            url: window.location.origin + '/' + 'AITRIOSConsole/GetDevices',
            data: { deviceId: deviceId },
            success: function (response) {
                const end = Date.now();
                console.log(`   ${fn} success ${end - start} ms`);
                let jsonData = JSON.parse(response.value);
                let jsonPretty = JSON.stringify(jsonData, undefined, 2);
                // add to log
                Add2Log(`GetDevices : ${jsonPretty}`);
                result = response;
            },
            error: function (jqXHR) {
                const end = Date.now();
                console.log(`${fn} error ${end - start} ms`);
                result = null;
                //debugger
            }
        });
    } catch (err) {
        console.error(err);
    } finally {
        HideSpinner(canvasId);
    }
    return result;
}

//
// Calls GetDirectImage() API through AITRIOSConsole Controller
//
async function GetDirectImage(deviceId, bHideSpinner) {

    var fn = `${arguments.callee.name}(${deviceId})`;
    console.debug(`==> ${fn}`);
    const start = Date.now();
    var result = null;
    var canvasId = GetCanvasFromDeviceId(deviceId);

    try {

        showSpinnerAndDisplayMessage(canvasId, `Capturing an Image from ${cameraInfoMap.get(deviceId).cameraName}`);

        await $.ajax({
            async: true,
            type: "GET",
            url: window.location.origin + '/' + 'AITRIOSConsole/GetDirectImage',
            data: { deviceId: deviceId },
            success: function (response) {
                const end = Date.now();
                console.log(`   ${fn} success ${end - start} ms`);
                result = response;
            },
            error: function (jqXHR) {
                const end = Date.now();
                console.log(`${fn} error ${end - start} ms`);
                //debugger
            }
        });

    } catch (err) {
        console.error(err);
    } finally {
        if (bHideSpinner) {
            HideSpinner(canvasId);
        }
    }
    return result;

}

//
// Calls StartUploadInferenceResult() API through AITRIOSConsole Controller
//
async function StartUploadInferenceResult(deviceId) {

    var fn = `${arguments.callee.name}(${deviceId})`;
    console.debug(`==> ${fn}`);
    const start = Date.now();
    var bResult = false;
    var canvasId = GetCanvasFromDeviceId(deviceId);
    
    try {

        showSpinnerAndDisplayMessage(canvasId, `Sending a command to start AI on Image Sensor`);

        await $.ajax({
            async: true,
            type: "POST",
            url: window.location.origin + '/' + 'AITRIOSConsole/StartUploadInferenceResult',
            data: { deviceId: deviceId },
            success: function (response) {
                const end = Date.now();
                console.log(`   ${fn} success ${end - start} ms`);
                toggleAiButtonActiveState(cameraInfoMap.get(deviceId).btnAiId, true);
                showSpinnerAndDisplayMessage(canvasId, "Waiting for AI results");
                bResult = true;
            },
            error: function (jqXHR) {
                const end = Date.now();
                console.log(`${fn} error ${end - start} ms`);
                displayMessage(canvasId, 'Failed to start AI Inference');
                HideSpinner(canvasId);
                //debugger;
            }
        });
    } catch (err) {
        console.error(err);
    } finally {
    }
    return bResult;
}

//
// Calls StopUploadInferenceResult() API through AITRIOSConsole Controller
// This is synchronous call.
//
async function StopUploadInferenceResult(deviceId) {

    var fn = `${arguments.callee.name}(${deviceId})`;
    console.debug(`==> ${fn} `);
    const start = Date.now();
    var canvasId = GetCanvasFromDeviceId(deviceId);

    try {
        showSpinnerAndDisplayMessage(canvasId, `Sending a command to stop AI on Image Sensor`);
        // Put AI Button into inactive state
        toggleAiButtonActiveState(cameraInfoMap.get(deviceId).btnAiId, false);

        await $.ajax({
            async: true,
            type: "POST",
            url: window.location.origin + '/' + 'AITRIOSConsole/StopUploadInferenceResult',
            data: { deviceId: deviceId },
            success: function (response) {
                const end = Date.now();
                console.log(`   ${fn} success ${end - start} ms`);
                return true;
            },
            error: function (jqXHR) {
                const end = Date.now();
                console.log(`${fn} error ${end - start} ms`);
                displayMessage(canvasId, 'Failed to stop AI Inference');
                //debugger;
                return false;
            }
        });
    } catch (err) {
        console.erro(err);
    } finally {
        HideSpinner(canvasId);
    }
    return false;
}


//
// Calls GetCommandParameterFile() API through AITRIOSConsole Controller
//
async function GetCommandParameterFile() {

    var fn = `${arguments.callee.name}()`;
    console.debug(`==> ${fn}`);
    const start = Date.now();
    var result = null;

    try {
        await $.ajax({
            async: true,
            type: "GET",
            url: window.location.origin + '/' + 'AITRIOSConsole/GetCommandParameterFile',
            data: {},
            success: function (response) {
                const end = Date.now();
                console.log(`   ${fn} success ${end - start} ms`);
                result = response;
            },
            error: function (jqXHR) {
                const end = Date.now();
                console.log(`${fn} error ${end - start} ms`);
                //debugger;
            }
        });

    } catch (err) {
        console.error(err);
    } finally {
    }
    return result;
}

//
// Calls ApplyCommandParameterFileToDevice() API through AITRIOSConsole Controller
//
async function ApplyCommandParameterFileToDevice(deviceId, file_name) {

    var fn = `${arguments.callee.name}(${deviceId})`;
    console.debug(`==> ${fn} file : ${file_name}`);

    const start = Date.now();
    var bResult = false;
    var canvasId = GetCanvasFromDeviceId(deviceId);

    try {

        showSpinnerAndDisplayMessage(canvasId, `Applying AI Configuration to camera`);

        await $.ajax({
            async: true,
            type: "PUT",
            url: window.location.origin + '/' + 'AITRIOSConsole/ApplyCommandParameterFileToDevice',
            data: {
                deviceId: deviceId,
                file_name: file_name
            },
            success: function (response) {
                const end = Date.now();
                console.log(`   ${fn} success ${end - start} ms`);
                SetCurrentCommandParameterFile(deviceId, file_name);
                SetCurrentModelId(deviceId, file_name);
                bResult = true;
            },
            error: function (jqXHR) {
                const end = Date.now();
                console.log(`${fn} error ${end - start} ms`);
                //debugger;
            }
        });
    } catch (err) {
        console.error(err);
    } finally {
        HideSpinner(canvasId);
    }

    console.debug(`<== ${fn}`);
    return bResult;
}

//
// Calls CancelCommandParameterFile() API through AITRIOSConsole Controller
//
async function CancelCommandParameterFile(deviceId, file_name) {

    var fn = `${arguments.callee.name}(${deviceId})`;
    console.debug(`==> ${fn} file : ${file_name}`);
    const start = Date.now();
    var bResult = false;

    try {
        await $.ajax({
            async: true,
            type: "DELETE",
            url: window.location.origin + '/' + 'AITRIOSConsole/CancelCommandParameterFile',
            data: {
                deviceId: deviceId,
                file_name: file_name
            },
            success: function (response) {
                const end = Date.now();
                console.log(`   ${fn} success ${end - start} ms`);
                bResult = true;
            },
            error: function (jqXHR) {
                const end = Date.now();
                console.log(`${fn} error ${end - start} ms`);
                //debugger;
            }
        });
    } catch (err) {
        console.error(err);
    } finally {
    }
    console.debug(`<= ${fn}`);
    return bResult;
}

