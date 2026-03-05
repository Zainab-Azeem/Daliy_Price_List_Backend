'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {

  async up(queryInterface, Sequelize) {

    // 1️⃣ Add category_id column
    await queryInterface.addColumn("suggestion", "category_id", {
      type: Sequelize.INTEGER,
      allowNull: true
    });

    // 2️⃣ Add foreign key constraint
    await queryInterface.addConstraint("suggestion", {
      fields: ["category_id"],
      type: "foreign key",
      name: "fk_suggestion_category",
      references: {
        table: "categories",
        field: "category_id"
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    });

    // 3️⃣ Remove old category column
    await queryInterface.removeColumn("suggestion", "category");

  },

  async down(queryInterface, Sequelize) {

    await queryInterface.addColumn("suggestion", "category", {
      type: Sequelize.STRING(100),
      allowNull: true
    });

    await queryInterface.removeConstraint("suggestion", "fk_suggestion_category");

    await queryInterface.removeColumn("suggestion ", "category_id");

  }

};