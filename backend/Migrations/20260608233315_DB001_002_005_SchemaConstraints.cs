using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NunaCare.Api.Migrations
{
    /// <inheritdoc />
    public partial class DB001_002_005_SchemaConstraints : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Appointments_BabyProfiles_BabyId",
                table: "Appointments");

            migrationBuilder.DropForeignKey(
                name: "FK_Appointments_Families_FamilyId",
                table: "Appointments");

            migrationBuilder.DropForeignKey(
                name: "FK_BabyLogs_BabyProfiles_BabyId",
                table: "BabyLogs");

            migrationBuilder.DropForeignKey(
                name: "FK_BabyLogs_Families_FamilyId",
                table: "BabyLogs");

            migrationBuilder.DropForeignKey(
                name: "FK_DoctorQuestions_BabyProfiles_BabyId",
                table: "DoctorQuestions");

            migrationBuilder.DropForeignKey(
                name: "FK_DoctorQuestions_Families_FamilyId",
                table: "DoctorQuestions");

            migrationBuilder.DropForeignKey(
                name: "FK_FoodReactions_BabyProfiles_BabyId",
                table: "FoodReactions");

            migrationBuilder.DropForeignKey(
                name: "FK_FoodReactions_Families_FamilyId",
                table: "FoodReactions");

            migrationBuilder.DropForeignKey(
                name: "FK_MedicineDoses_BabyProfiles_BabyId",
                table: "MedicineDoses");

            migrationBuilder.DropForeignKey(
                name: "FK_MedicineDoses_Families_FamilyId",
                table: "MedicineDoses");

            migrationBuilder.DropForeignKey(
                name: "FK_Medicines_BabyProfiles_BabyId",
                table: "Medicines");

            migrationBuilder.DropForeignKey(
                name: "FK_Medicines_Families_FamilyId",
                table: "Medicines");

            migrationBuilder.DropForeignKey(
                name: "FK_WeightEntries_BabyProfiles_BabyId",
                table: "WeightEntries");

            migrationBuilder.DropForeignKey(
                name: "FK_WeightEntries_Families_FamilyId",
                table: "WeightEntries");

            migrationBuilder.DropIndex(
                name: "IX_WeightEntries_BabyId",
                table: "WeightEntries");

            migrationBuilder.DropIndex(
                name: "IX_Medicines_BabyId",
                table: "Medicines");

            migrationBuilder.DropIndex(
                name: "IX_MedicineDoses_BabyId",
                table: "MedicineDoses");

            migrationBuilder.DropIndex(
                name: "IX_FoodReactions_BabyId",
                table: "FoodReactions");

            migrationBuilder.DropIndex(
                name: "IX_Families_OwnerUserId",
                table: "Families");

            migrationBuilder.DropIndex(
                name: "IX_DoctorQuestions_BabyId",
                table: "DoctorQuestions");

            migrationBuilder.DropIndex(
                name: "IX_BabyLogs_BabyId",
                table: "BabyLogs");

            migrationBuilder.DropIndex(
                name: "IX_Appointments_BabyId",
                table: "Appointments");

            migrationBuilder.AlterColumn<string>(
                name: "Mood",
                table: "MomCheckIns",
                type: "character varying(80)",
                maxLength: 80,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(80)",
                oldMaxLength: 80,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Liked",
                table: "FoodReactions",
                type: "character varying(40)",
                maxLength: 40,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(40)",
                oldMaxLength: 40,
                oldNullable: true);

            migrationBuilder.AddUniqueConstraint(
                name: "AK_BabyProfiles_Id_FamilyId",
                table: "BabyProfiles",
                columns: new[] { "Id", "FamilyId" });

            migrationBuilder.CreateIndex(
                name: "IX_WeightEntries_BabyId_FamilyId",
                table: "WeightEntries",
                columns: new[] { "BabyId", "FamilyId" });

            migrationBuilder.CreateIndex(
                name: "IX_Medicines_BabyId_FamilyId",
                table: "Medicines",
                columns: new[] { "BabyId", "FamilyId" });

            migrationBuilder.CreateIndex(
                name: "IX_MedicineDoses_BabyId_FamilyId",
                table: "MedicineDoses",
                columns: new[] { "BabyId", "FamilyId" });

            migrationBuilder.CreateIndex(
                name: "IX_FoodReactions_BabyId_FamilyId",
                table: "FoodReactions",
                columns: new[] { "BabyId", "FamilyId" });

            migrationBuilder.CreateIndex(
                name: "IX_Families_OwnerUserId",
                table: "Families",
                column: "OwnerUserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DoctorQuestions_BabyId_FamilyId",
                table: "DoctorQuestions",
                columns: new[] { "BabyId", "FamilyId" });

            migrationBuilder.CreateIndex(
                name: "IX_BabyLogs_BabyId_FamilyId",
                table: "BabyLogs",
                columns: new[] { "BabyId", "FamilyId" });

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_BabyId_FamilyId",
                table: "Appointments",
                columns: new[] { "BabyId", "FamilyId" });

            migrationBuilder.AddForeignKey(
                name: "FK_Appointments_BabyProfiles_BabyId_FamilyId",
                table: "Appointments",
                columns: new[] { "BabyId", "FamilyId" },
                principalTable: "BabyProfiles",
                principalColumns: new[] { "Id", "FamilyId" },
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_BabyLogs_BabyProfiles_BabyId_FamilyId",
                table: "BabyLogs",
                columns: new[] { "BabyId", "FamilyId" },
                principalTable: "BabyProfiles",
                principalColumns: new[] { "Id", "FamilyId" },
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_DoctorQuestions_BabyProfiles_BabyId_FamilyId",
                table: "DoctorQuestions",
                columns: new[] { "BabyId", "FamilyId" },
                principalTable: "BabyProfiles",
                principalColumns: new[] { "Id", "FamilyId" },
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_FoodReactions_BabyProfiles_BabyId_FamilyId",
                table: "FoodReactions",
                columns: new[] { "BabyId", "FamilyId" },
                principalTable: "BabyProfiles",
                principalColumns: new[] { "Id", "FamilyId" },
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_MedicineDoses_BabyProfiles_BabyId_FamilyId",
                table: "MedicineDoses",
                columns: new[] { "BabyId", "FamilyId" },
                principalTable: "BabyProfiles",
                principalColumns: new[] { "Id", "FamilyId" });

            migrationBuilder.AddForeignKey(
                name: "FK_Medicines_BabyProfiles_BabyId_FamilyId",
                table: "Medicines",
                columns: new[] { "BabyId", "FamilyId" },
                principalTable: "BabyProfiles",
                principalColumns: new[] { "Id", "FamilyId" },
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_WeightEntries_BabyProfiles_BabyId_FamilyId",
                table: "WeightEntries",
                columns: new[] { "BabyId", "FamilyId" },
                principalTable: "BabyProfiles",
                principalColumns: new[] { "Id", "FamilyId" },
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Appointments_BabyProfiles_BabyId_FamilyId",
                table: "Appointments");

            migrationBuilder.DropForeignKey(
                name: "FK_BabyLogs_BabyProfiles_BabyId_FamilyId",
                table: "BabyLogs");

            migrationBuilder.DropForeignKey(
                name: "FK_DoctorQuestions_BabyProfiles_BabyId_FamilyId",
                table: "DoctorQuestions");

            migrationBuilder.DropForeignKey(
                name: "FK_FoodReactions_BabyProfiles_BabyId_FamilyId",
                table: "FoodReactions");

            migrationBuilder.DropForeignKey(
                name: "FK_MedicineDoses_BabyProfiles_BabyId_FamilyId",
                table: "MedicineDoses");

            migrationBuilder.DropForeignKey(
                name: "FK_Medicines_BabyProfiles_BabyId_FamilyId",
                table: "Medicines");

            migrationBuilder.DropForeignKey(
                name: "FK_WeightEntries_BabyProfiles_BabyId_FamilyId",
                table: "WeightEntries");

            migrationBuilder.DropIndex(
                name: "IX_WeightEntries_BabyId_FamilyId",
                table: "WeightEntries");

            migrationBuilder.DropIndex(
                name: "IX_Medicines_BabyId_FamilyId",
                table: "Medicines");

            migrationBuilder.DropIndex(
                name: "IX_MedicineDoses_BabyId_FamilyId",
                table: "MedicineDoses");

            migrationBuilder.DropIndex(
                name: "IX_FoodReactions_BabyId_FamilyId",
                table: "FoodReactions");

            migrationBuilder.DropIndex(
                name: "IX_Families_OwnerUserId",
                table: "Families");

            migrationBuilder.DropIndex(
                name: "IX_DoctorQuestions_BabyId_FamilyId",
                table: "DoctorQuestions");

            migrationBuilder.DropUniqueConstraint(
                name: "AK_BabyProfiles_Id_FamilyId",
                table: "BabyProfiles");

            migrationBuilder.DropIndex(
                name: "IX_BabyLogs_BabyId_FamilyId",
                table: "BabyLogs");

            migrationBuilder.DropIndex(
                name: "IX_Appointments_BabyId_FamilyId",
                table: "Appointments");

            migrationBuilder.AlterColumn<string>(
                name: "Mood",
                table: "MomCheckIns",
                type: "character varying(80)",
                maxLength: 80,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(80)",
                oldMaxLength: 80);

            migrationBuilder.AlterColumn<string>(
                name: "Liked",
                table: "FoodReactions",
                type: "character varying(40)",
                maxLength: 40,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(40)",
                oldMaxLength: 40);

            migrationBuilder.CreateIndex(
                name: "IX_WeightEntries_BabyId",
                table: "WeightEntries",
                column: "BabyId");

            migrationBuilder.CreateIndex(
                name: "IX_Medicines_BabyId",
                table: "Medicines",
                column: "BabyId");

            migrationBuilder.CreateIndex(
                name: "IX_MedicineDoses_BabyId",
                table: "MedicineDoses",
                column: "BabyId");

            migrationBuilder.CreateIndex(
                name: "IX_FoodReactions_BabyId",
                table: "FoodReactions",
                column: "BabyId");

            migrationBuilder.CreateIndex(
                name: "IX_Families_OwnerUserId",
                table: "Families",
                column: "OwnerUserId");

            migrationBuilder.CreateIndex(
                name: "IX_DoctorQuestions_BabyId",
                table: "DoctorQuestions",
                column: "BabyId");

            migrationBuilder.CreateIndex(
                name: "IX_BabyLogs_BabyId",
                table: "BabyLogs",
                column: "BabyId");

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_BabyId",
                table: "Appointments",
                column: "BabyId");

            migrationBuilder.AddForeignKey(
                name: "FK_Appointments_BabyProfiles_BabyId",
                table: "Appointments",
                column: "BabyId",
                principalTable: "BabyProfiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Appointments_Families_FamilyId",
                table: "Appointments",
                column: "FamilyId",
                principalTable: "Families",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_BabyLogs_BabyProfiles_BabyId",
                table: "BabyLogs",
                column: "BabyId",
                principalTable: "BabyProfiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_BabyLogs_Families_FamilyId",
                table: "BabyLogs",
                column: "FamilyId",
                principalTable: "Families",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_DoctorQuestions_BabyProfiles_BabyId",
                table: "DoctorQuestions",
                column: "BabyId",
                principalTable: "BabyProfiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_DoctorQuestions_Families_FamilyId",
                table: "DoctorQuestions",
                column: "FamilyId",
                principalTable: "Families",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_FoodReactions_BabyProfiles_BabyId",
                table: "FoodReactions",
                column: "BabyId",
                principalTable: "BabyProfiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_FoodReactions_Families_FamilyId",
                table: "FoodReactions",
                column: "FamilyId",
                principalTable: "Families",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_MedicineDoses_BabyProfiles_BabyId",
                table: "MedicineDoses",
                column: "BabyId",
                principalTable: "BabyProfiles",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_MedicineDoses_Families_FamilyId",
                table: "MedicineDoses",
                column: "FamilyId",
                principalTable: "Families",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Medicines_BabyProfiles_BabyId",
                table: "Medicines",
                column: "BabyId",
                principalTable: "BabyProfiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Medicines_Families_FamilyId",
                table: "Medicines",
                column: "FamilyId",
                principalTable: "Families",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_WeightEntries_BabyProfiles_BabyId",
                table: "WeightEntries",
                column: "BabyId",
                principalTable: "BabyProfiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_WeightEntries_Families_FamilyId",
                table: "WeightEntries",
                column: "FamilyId",
                principalTable: "Families",
                principalColumn: "Id");
        }
    }
}
