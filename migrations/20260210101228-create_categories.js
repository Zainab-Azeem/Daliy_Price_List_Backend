'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("categories", {
      category_id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      image_url: { type: Sequelize.TEXT, allowNull: true },
      is_active: { type: Sequelize.TINYINT, allowNull: false, defaultValue: 1 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("categories");
  },
};
