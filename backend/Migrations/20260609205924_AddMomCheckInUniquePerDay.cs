using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NunaCare.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMomCheckInUniquePerDay : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_MomCheckIns_FamilyId_Date",
                table: "MomCheckIns");

            migrationBuilder.CreateIndex(
                name: "IX_MomCheckIns_FamilyId_Date",
                table: "MomCheckIns",
                columns: new[] { "FamilyId", "Date" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_MomCheckIns_FamilyId_Date",
                table: "MomCheckIns");

            migrationBuilder.CreateIndex(
                name: "IX_MomCheckIns_FamilyId_Date",
                table: "MomCheckIns",
                columns: new[] { "FamilyId", "Date" });
        }
    }
}
