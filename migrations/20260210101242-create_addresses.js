'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("addresses", {
      address_id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },

       user_id: {
      type: Sequelize.CHAR(36),
      allowNull: false,
      references: { model: "users", key: "user_id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },

      full_name: { type: Sequelize.STRING(120), allowNull: false },
      phone: { type: Sequelize.STRING(30), allowNull: false },

      province: { type: Sequelize.STRING(80), allowNull: true },
      district: { type: Sequelize.STRING(80), allowNull: true },
      zone: { type: Sequelize.STRING(120), allowNull: true },

      city: { type: Sequelize.STRING(80), allowNull: true },
      area: { type: Sequelize.STRING(120), allowNull: true },
      street: { type: Sequelize.STRING(255), allowNull: true },
      postal_code: { type: Sequelize.STRING(20), allowNull: true },

      is_default: { type: Sequelize.TINYINT, allowNull: false, defaultValue: 0 },

      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("addresses");
  },
};

