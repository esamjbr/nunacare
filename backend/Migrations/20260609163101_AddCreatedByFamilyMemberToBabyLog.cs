using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NunaCare.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCreatedByFamilyMemberToBabyLog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByFamilyMemberId",
                table: "BabyLogs",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_BabyLogs_CreatedByFamilyMemberId",
                table: "BabyLogs",
                column: "CreatedByFamilyMemberId");

            migrationBuilder.AddForeignKey(
                name: "FK_BabyLogs_FamilyMembers_CreatedByFamilyMemberId",
                table: "BabyLogs",
                column: "CreatedByFamilyMemberId",
                principalTable: "FamilyMembers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_BabyLogs_FamilyMembers_CreatedByFamilyMemberId",
                table: "BabyLogs");

            migrationBuilder.DropIndex(
                name: "IX_BabyLogs_CreatedByFamilyMemberId",
                table: "BabyLogs");

            migrationBuilder.DropColumn(
                name: "CreatedByFamilyMemberId",
                table: "BabyLogs");
        }
    }
}
