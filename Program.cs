
using AITRIOS_Console_Mockup.SignalR.Hubs;
using Microsoft.Extensions.Configuration;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();
//builder.Services.AddCors(options =>
//{
//    options.AddPolicy("CoresPolicy", policy => { policy.AllowAnyHeader().AllowAnyMethod().WithOrigins("http://localhost:8000").AllowCredentials(); });
//});

builder.Services.AddSignalR().AddAzureSignalR(builder.Configuration.GetSection("Azure")
                                    .GetSection("SignalR")
                                    .GetValue<string>("ConnectionString"));

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
}
app.UseStaticFiles();

app.UseRouting();

app.UseAuthorization();

app.MapHub<SignalRHub>("/hub");

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();
