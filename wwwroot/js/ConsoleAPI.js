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
function GetDevices(deviceId) {

    var funcName = `${arguments.callee.name}(${deviceId})`;
    console.debug(`==> ${funcName}`);
    const start = Date.now();

    try {
        return $.ajax({
            async: true,
            type: "GET",
            url: window.location.origin + '/' + 'AITRIOSConsole/GetDevices',
            data: { deviceId: deviceId },
            success: function (response) {
                const end = Date.now();
                console.log(`${funcName} success ${end - start} ms`);
            },
            error: function (jqXHR) {
                const end = Date.now();
                console.log(`${funcName} error ${end - start} ms`);
        //    },
        //    complete: function (response) {
        //        console.log(`${funcName} complete`);
            }
        });
    } catch (err) {
    } finally {
    }
}

//
// Calls GetDirectImage() API through AITRIOSConsole Controller
//
function GetDirectImage(deviceId) {

    var funcName = `${arguments.callee.name}(${deviceId})`;
    console.debug(`==> ${funcName}`);
    const start = Date.now();

    try {

         return $.ajax({
            async: true,
            type: "GET",
            url: window.location.origin + '/' + 'AITRIOSConsole/GetDirectImage',
            data: { deviceId: deviceId },
            success: function (response) {
                const end = Date.now();
                console.log(`${funcName} success ${end - start} ms`);
            },
            error: function (jqXHR) {
                const end = Date.now();
                console.log(`${funcName} error ${end - start} ms`);
            //},
            //complete: function (response) {
            //    console.log(`${funcName} complete`);
            }
        });

        return response
    } catch (err) {
    } finally {
    }
}

//
// Calls StartUploadInferenceResult() API through AITRIOSConsole Controller
//
function StartUploadInferenceResult(deviceId) {
    var funcName = `${arguments.callee.name}(${deviceId})`;
    console.debug(`==> ${funcName}`);
    const start = Date.now();

    try {

        pendingInferenceCount.set(deviceId, imageCountMap.get(deviceId));

        return $.ajax({
            async: true,
            type: "POST",
            url: window.location.origin + '/' + 'AITRIOSConsole/StartUploadInferenceResult',
            data: { deviceId: deviceId },
            success: function (response) {
                const end = Date.now();
                console.log(`${funcName} success ${end - start} ms`);

            },
            error: function (jqXHR) {
                console.log(`${funcName} error`);
            //},
            //complete: function (response) {
            //    console.log(`${funcName} complete`);
            }
        });
    } catch (err) {
    } finally {
    }
}

//
// Calls StopUploadInferenceResult() API through AITRIOSConsole Controller
//
function StopUploadInferenceResult(deviceId) {

    var funcName = `${arguments.callee.name}(${deviceId})`;
    console.debug(`==> ${funcName} `);
    const start = Date.now();

    try {
        pendingInferenceCount.set(deviceId, 0);
        toggleAiButton(aiButtonMap.get(deviceId), false);

        return $.ajax({
            async: true,
            type: "POST",
            url: window.location.origin + '/' + 'AITRIOSConsole/StopUploadInferenceResult',
            data: { deviceId: deviceId },
            success: function (response) {
                const end = Date.now();
                console.log(`${funcName} success ${end - start} ms`);
            },
            error: function (jqXHR) {
                const end = Date.now();
                console.log(`${funcName} error ${end - start} ms`);
            //},
            //complete: function (response) {
            //    console.log(`${funcName} complete`);
            }
        });

        return response;
    } catch (err) {
    } finally {
    }
}

//
// Calls GetCommandParameterFile() API through AITRIOSConsole Controller
//
function GetCommandParameterFile() {

    var funcName = `${arguments.callee.name}()`;
    console.debug(`==> ${funcName}`);
    const start = Date.now();

    try {
        return $.ajax({
            async: true,
            type: "GET",
            url: window.location.origin + '/' + 'AITRIOSConsole/GetCommandParameterFile',
            data: { },
            success: function (response) {
                const end = Date.now();
                console.log(`${funcName} success ${end - start} ms`);
            },
            error: function (jqXHR) {
                const end = Date.now();
                console.log(`${funcName} error ${end - start} ms`);
                debugger
                //},
                //complete: function (response) {
                //    console.log(`${funcName} complete`);
            }
        });

        return response;
    } catch (err) {
    } finally {
    }
}


