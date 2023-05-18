using AITRIOS_Console_Mockup.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System.Diagnostics;
using System.Net;
using System.Net.Http.Headers;
using static AITRIOS_Console_Mockup.Models.AITRIOSConsole;

namespace AITRIOS_Console_Mockup.Controllers
{

    //
    // Receives REST API calls from the browser, then makes API calls to AITRIOS using Console API v1.2.0
    //
    public class AITRIOSConsole : Controller
    {
        private readonly ILogger<AITRIOSConsole> _logger;
        private readonly AppSettings _appSettings;
        private static ConsoleToken _consoleToken = new ConsoleToken{
                                                                        response = null,
                                                                        expiration = DateTime.UtcNow
                                                                    };
        public AITRIOSConsole(IOptions<AppSettings> optionsAccessor, ILogger<AITRIOSConsole> logger)
        {
            _appSettings = optionsAccessor.Value;
            _logger = logger;

            //
            // Get an access token during initialization
            //
            Task<bool> task = Task.Run<bool>(async () => await GetConsoleTokenAsync());
        }

        //
        // A wrapper function to configure headers
        // - Authorization 
        // - Host
        //
        private void AddRequestHeader(HttpClient client)
        {
            Debug.Assert(_appSettings.ConsoleSettings.BaseUrl != null, "BaseUrl App Setting is missing");
            Debug.Assert(_consoleToken.response != null, "Token Response is missing");

            Uri baseUri = new Uri(_appSettings.ConsoleSettings.BaseUrl);
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(_consoleToken.response.token_type, _consoleToken.response.access_token);
            client.DefaultRequestHeaders.Host = baseUri.Host;
        }

        //
        // A wrapper function to send a GET request
        // Throws exception on an error so callers must be made inside try..except SEH.
        //
        private async Task<HttpResponseMessage> SendGet(string requestSegment)
        {
            if ((_appSettings == null) || (_appSettings.ConsoleSettings == null) || (_appSettings.ConsoleSettings.BaseUrl == null))
            {
                throw new ArgumentException("{\"status\":\"Missing App Settings.\"}");
            }

            // Make sure token is available and not expired.
            // should move this to AddRequestHeader()
            if (_consoleToken.response == null || ((_consoleToken.expiration - DateTime.UtcNow).Minutes < 5 ))
            {
                // Get a new token
                var ret = await GetConsoleTokenAsync();
                if (!ret)
                {
                    throw new ArgumentException("{\"status\":\"Failed to get Access Token\"}");
                }
            }
            using (HttpClient client = new HttpClient())
            {
                Uri baseUri = new Uri(_appSettings.ConsoleSettings.BaseUrl);
                Uri requestUri = new Uri($"{baseUri.AbsoluteUri}/{requestSegment}");

                AddRequestHeader(client);

                return await client.GetAsync(requestUri.AbsoluteUri);
            }
        }

        //
        // A wrapper function to send a POST request
        // Throws exception on an error so callers must be made inside try..except SEH.
        //
        private async Task<HttpResponseMessage> SendPost(string requestSegment, HttpContent? requestContent)
        {
            if ((_appSettings == null) || (_appSettings.ConsoleSettings == null) || (_appSettings.ConsoleSettings.BaseUrl == null))
            {
                throw new ArgumentException("{\"status\":\"Missing App Settings.\"}");
            }

            // Make sure token is available and not expired.
            // should move this to AddRequestHeader()
            if (_consoleToken.response == null || ((_consoleToken.expiration - DateTime.UtcNow).Minutes < 5))
            {
                var ret = await GetConsoleTokenAsync();
                if (!ret)
                {
                    throw new ArgumentException("{\"status\":\"Failed to get Access Token\"}");
                }
            }
            using (HttpClient client = new HttpClient())
            {
                Uri baseUri = new Uri(_appSettings.ConsoleSettings.BaseUrl);
                Uri requestUri = new Uri($"{baseUri.AbsoluteUri}/{requestSegment}");

                AddRequestHeader(client);

                return await client.PostAsync(requestUri.AbsoluteUri, requestContent);
            }
        }

        //
        // Gets access token
        //
        private async Task<bool> GetConsoleTokenAsync()
        {
            if ((_appSettings == null) || (_appSettings.ConsoleSettings == null) || (_appSettings.ConsoleSettings.BaseUrlToken == null))
            {
                return false;
            }

            try
            {
                using (HttpClient client = new HttpClient())
                {
                    Uri baseUri = new Uri(_appSettings.ConsoleSettings.BaseUrlToken);
                    var parameters = new Dictionary<string, string> { { "grant_type", "client_credentials" }, { "scope", "system" } };
                    var encodedContent = new FormUrlEncodedContent(parameters);

                    string authCode = $"{_appSettings.ConsoleSettings.AppClientId}:{_appSettings.ConsoleSettings.AppSecret}";
                    var base64authcode = System.Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(authCode));

                    client.DefaultRequestHeaders.Accept.Clear();
                    client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", $"{base64authcode}");
                    client.DefaultRequestHeaders.Host = baseUri.Host;
                    client.DefaultRequestHeaders.CacheControl = new CacheControlHeaderValue { NoCache = true };
                    client.DefaultRequestHeaders.TryAddWithoutValidation("Content-Type", "application/x-www-form-urlencoded");

                    var response = await client.PostAsync(baseUri.AbsoluteUri, encodedContent).ConfigureAwait(false);

                    if (response.StatusCode == HttpStatusCode.OK)
                    {
                        var responseContent = await response.Content.ReadAsStringAsync().ConfigureAwait(false);

                        if (responseContent != null)
                        {
                            _consoleToken.response = JsonConvert.DeserializeObject<ConsoleTokenResponse>(responseContent);
                            _consoleToken.expiration = DateTime.UtcNow.AddSeconds(Convert.ToDouble(_consoleToken.response.expires_in));
                            return true;
                        }
                        else
                        {
                            _consoleToken.response= null;
                        }
                    }

                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Excetion in {System.Reflection.MethodBase.GetCurrentMethod().Name}() {ex.Message}");
                return false;
            }

        }

        #region GET Request 
        //
        // Get the device list information.
        // If "deviceId" is provided, calls GetDevice() API.
        // If not, calls GetDevices() API
        //
        [HttpGet]
        public async Task<ActionResult> GetDevices(string deviceId)
        {
            try
            {
                string url = string.Empty;

                if (string.IsNullOrEmpty(deviceId))
                {
                    url = $"devices";
                }
                else
                {
                    url = $"devices/{deviceId}";
                }

                var response = await SendGet(url);

                if (response != null)
                {
                    var jsonString = await response.Content.ReadAsStringAsync();

                    if (response.IsSuccessStatusCode)
                    {
                        return Ok(Json(jsonString));
                    }
                    else
                    {
                        return StatusCode(StatusCodes.Status500InternalServerError, Json(jsonString));
                    }
                }
                else
                {
                    return StatusCode(StatusCodes.Status500InternalServerError);
                }
            }
            catch (ArgumentException ex)
            {
                return StatusCode(StatusCodes.Status400BadRequest, Json(ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError($"Excetion in {System.Reflection.MethodBase.GetCurrentMethod().Name}() {ex.Message}");
                return BadRequest(ex.Message);
            }
        }

        //
        // Get the image of a specified device in real-time.
        // This API is for pseudo-streaming.
        //
        [HttpGet]
        public async Task<ActionResult> GetDirectImage(string deviceId)
        {
            Debug.Assert(deviceId != null, "Device ID missing");

            try
            {
                var url = $"devices/{deviceId}/images/latest";

                var response = await SendGet(url);

                if (response != null)
                {
                    var jsonString = await response.Content.ReadAsStringAsync();

                    if (response.IsSuccessStatusCode)
                    {
                        return Ok(Json(jsonString));
                    }
                    else
                    {
                        return StatusCode(StatusCodes.Status500InternalServerError, Json(jsonString));
                    }
                }
                else
                {
                    return StatusCode(StatusCodes.Status500InternalServerError);
                }
            }
            catch (ArgumentException ex)
            {
                return StatusCode(StatusCodes.Status400BadRequest, Json(ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError($"Excetion in {System.Reflection.MethodBase.GetCurrentMethod().Name}() {ex.Message}");
                return BadRequest(ex.Message);
            }
        }

        // to do
        // Add GetCommandParameterFile()
        // 

        #endregion

        #region POST
        //
        // Start Inference on a specified device
        //
        [HttpPost]
        public async Task<ActionResult> StartUploadInferenceResult(string deviceId)
        {
            Debug.Assert(deviceId != null, "Device ID missing");

            try
            {
                var url = $"devices/{deviceId}/inferenceresults/collectstart";

                var response = await SendPost(url, null);

                if (response != null)
                {
                    var jsonString = await response.Content.ReadAsStringAsync();

                    if (response.IsSuccessStatusCode)
                    {
                        return Ok(Json(jsonString));
                    }
                    else
                    {
                        return StatusCode(StatusCodes.Status500InternalServerError, Json(jsonString));
                    }
                }
                else
                {
                    return StatusCode(StatusCodes.Status500InternalServerError);
                }
            }
            catch (ArgumentException ex)
            {
                return StatusCode(StatusCodes.Status400BadRequest, Json(ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError($"Excetion in {System.Reflection.MethodBase.GetCurrentMethod().Name}() {ex.Message}");
                return BadRequest(ex.Message);
            }
        }

        //
        // Start Inference on a specified device
        //
        [HttpPost]
        public async Task<ActionResult> StopUploadInferenceResult(string deviceId)
        {
            Debug.Assert(deviceId != null, "Device ID missing");

            try
            {
                var url = $"devices/{deviceId}/inferenceresults/collectstop";

                var response = await SendPost(url, null);

                if (response != null)
                {
                    var jsonString = await response.Content.ReadAsStringAsync();

                    if (response.IsSuccessStatusCode)
                    {
                        return Ok(Json(jsonString));
                    }
                    else
                    {
                        return StatusCode(StatusCodes.Status500InternalServerError, Json(jsonString));
                    }
                }
                else
                {
                    return StatusCode(StatusCodes.Status500InternalServerError);
                }
            }
            catch (ArgumentException ex)
            {
                return StatusCode(StatusCodes.Status400BadRequest, Json(ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError($"Excetion in {System.Reflection.MethodBase.GetCurrentMethod().Name}() {ex.Message}");
                return BadRequest(ex.Message);
            }
        }
        #endregion

        #region PUT

        // to do
        // Add ApplyCommandParameterFileToDevice()
        // 
        #endregion

        #region PATCH
        // to do
        // Add UpdateCommandParameterFile()
        // 

        #endregion

    }
}
