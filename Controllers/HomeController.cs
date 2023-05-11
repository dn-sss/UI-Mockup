using AITRIOS_Console_Mockup.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using System.Diagnostics;

namespace AITRIOS_Console_Mockup.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;
        private readonly AppSettings _appSettings;

        public HomeController(IOptions<AppSettings> optionsAccessor, ILogger<HomeController> logger)
        {
            
            _logger = logger;
            _appSettings = optionsAccessor.Value;

        }

        public IActionResult Index()
        {
            if (_appSettings != null && _appSettings.SuitcaseDemoSetting != null)
            {
                ViewData["Camera_1_ID"] = _appSettings.SuitcaseDemoSetting.Camera_1_ID;
                ViewData["Camera_2_ID"] = _appSettings.SuitcaseDemoSetting.Camera_2_ID;
                ViewData["Camera_3_ID"] = _appSettings.SuitcaseDemoSetting.Camera_3_ID;
            }
            return View();
        }

        public IActionResult Privacy()
        {
            return View();
        }
        public IActionResult Advanced()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}