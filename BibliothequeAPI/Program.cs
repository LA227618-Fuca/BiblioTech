using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using BibliothequeAPI.Data;
using Microsoft.OpenApi.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using BibliothequeAPI.Services;

var builder = WebApplication.CreateBuilder(args);

// Configuration de la base de données
builder.Services.AddDbContext<BibliothequeAPIContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("BibliothequeAPIContext") ?? 
        throw new InvalidOperationException("Connection string 'BibliothequeAPIContext' not found.")));

// Add services to the container.
builder.Services.AddControllers();

// Enregistrer AuthorizationService
builder.Services.AddScoped<AuthorizationService>();

// Configuration JWT
var privateKey = "b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW\r\nQyNTUxOQAAACBAAHuj4EY5BCrJoIbne/CYhXWH4YWKYa/qszDMqa/v/QAAAJhsq4IObKuC\r\nDgAAAAtzc2gtZWQyNTUxOQAAACBAAHuj4EY5BCrJoIbne/CYhXWH4YWKYa/qszDMqa/v/Q\r\nAAAEBspyNsIv6CezOEUbcDXN3W6Wp6OcukwhnFfoTXNyXHA0AAe6PgRjkEKsmghud78JiF\r\ndYfhhYphr+qzMMypr+/9AAAADmJickBiYnItdWJ1bnR1AQIDBAUGBw==";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(privateKey))
    };
});

builder.Services.AddAuthorization();

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "BiblioTech API",
        Version = "v1",
        Description = "API de gestion de bibliothèque en ligne - BiblioTech"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        In = ParameterLocation.Header,
        Description = "Please enter a valid BearerToken",
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        BearerFormat = "JWT",
        Scheme = "Bearer"
    });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] { }
        }
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

