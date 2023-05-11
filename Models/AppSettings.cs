namespace AITRIOS_Console_Mockup.Models
{
    public class AITRIOSConsoleSettings
    {
        public string? BaseUrl { get; set; }
        public string? AppClientId { get; set; }
        public string? AppSecret { get; set; }
        public string? BaseUrlToken { get; set; }
    }

    public class SuitcaseDemo
    {
        public string? Camera_1_ID { get; set; }
        public string? Camera_2_ID { get; set; }
        public string? Camera_3_ID { get; set; }
    }

    public class AppSettings
    {
        public AITRIOSConsoleSettings? ConsoleSettings { get; set; }
        public SuitcaseDemo? SuitcaseDemoSetting { get; set; }
    }
}
