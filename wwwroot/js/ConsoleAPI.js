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

function GetDevice(deviceId) {

    var funcName = `${arguments.callee.name}()`;
    console.debug("=>", funcName)

    try {

        return $.ajax({
            async: true,
            type: "GET",
            url: window.location.origin + '/' + 'AITRIOSConsole/GetDevices',
            data: { deviceId: deviceId }
        });
    } catch (err) {
    } finally {
    }
}

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

function PostToken(token) {

    var funcName = `${arguments.callee.name}()`;
    console.debug(`=> ${funcName}`);

    $.ajax({
        type: "POST",
        url: window.location.origin + '/' + 'AITRIOSConsole/PostToken',
        data: { token: token },
    }).done(function (response) {
        console.debug(`<= ${funcName}`);
        
    }).fail(function (response, status, err) {
        alert("PostToken Error " + status);
    });
}