using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AutoWay.Migrations
{
    /// <inheritdoc />
    public partial class gg : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Roles",
                table: "Utilisateur");

            migrationBuilder.AddColumn<DateOnly>(
                name: "DateModification",
                table: "Avis",
                type: "date",
                nullable: false,
                defaultValue: new DateOnly(1, 1, 1));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DateModification",
                table: "Avis");

            migrationBuilder.AddColumn<string>(
                name: "Roles",
                table: "Utilisateur",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }
    }
}
