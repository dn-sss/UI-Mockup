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

    var funcName = `${arguments.callee.name}()`;
    console.debug("=>", funcName)

    try {

        return  $.ajax({
            async: true,
            type: "GET",
            url: window.location.origin + '/' + 'AITRIOSConsole/GetDevices',
            data: { deviceId: deviceId }
            //success: function (response) {
            //    debugger            
            //    return response;
            //},
            //error: function (jqXHR) {
            //    DisplayAlert(fn, jqXHR);
            //},
            //complete: function (response) {
            //    DisplayAlert(fn, "complete")
            //}
        });
    } catch (err) {
    } finally {
    }
}

//
// Calls GetDirectImage() API through AITRIOSConsole Controller
//
function GetDirectImage(deviceId) {

    var funcName = `${arguments.callee.name}()`;
    console.debug("=>", funcName)

    try {

        return $.ajax({
            async: true,
            type: "GET",
            url: window.location.origin + '/' + 'AITRIOSConsole/GetDirectImage',
            data: { deviceId: deviceId }
            //success: function (response) {
            //    debugger            
            //    return response;
            //},
            //error: function (jqXHR) {
            //    DisplayAlert(fn, jqXHR);
            //},
            //complete: function (response) {
            //    DisplayAlert(fn, "complete")
            //}
        });
    } catch (err) {
    } finally {
    }
}

//
// Calls StartUploadInferenceResult() API through AITRIOSConsole Controller
//
function StartUploadInferenceResult(deviceId) {

    var funcName = `${arguments.callee.name}()`;
    console.debug("=>", funcName)

    try {
        return $.ajax({
            async: true,
            type: "POST",
            url: window.location.origin + '/' + 'AITRIOSConsole/StartUploadInferenceResult',
            data: { deviceId: deviceId }
            //success: function (response) {
            //    debugger            
            //    return response;
            //},
            //error: function (jqXHR) {
            //    DisplayAlert(fn, jqXHR);
            //},
            //complete: function (response) {
            //    DisplayAlert(fn, "complete")
            //}
        });
    } catch (err) {
    } finally {
    }
}

//
// Calls StopUploadInferenceResult() API through AITRIOSConsole Controller
//
function StopUploadInferenceResult(deviceId) {

    var funcName = `${arguments.callee.name}()`;
    console.debug("=>", funcName)

    try {
        return $.ajax({
            async: true,
            type: "POST",
            url: window.location.origin + '/' + 'AITRIOSConsole/StopUploadInferenceResult',
            data: { deviceId: deviceId }
            //success: function (response) {
            //    debugger            
            //    return response;
            //},
            //error: function (jqXHR) {
            //    DisplayAlert(fn, jqXHR);
            //},
            //complete: function (response) {
            //    DisplayAlert(fn, "complete")
            //}
        });
    } catch (err) {
    } finally {
    }
}

