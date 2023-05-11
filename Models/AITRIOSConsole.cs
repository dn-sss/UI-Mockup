namespace AITRIOS_Console_Mockup.Models
{
    public class AITRIOSConsole
    {
        public class ConsoleTokenResponse
        {
            public string? token_type { get; set; }
            public int? expires_in { get; set; }
            public string? access_token { get; set; }
            public string? scope { get; set; }
        }

        public class ConsoleToken
        {
            public ConsoleTokenResponse? response { get; set; }
            public DateTime expiration { get; set; }
        }
    }
}
