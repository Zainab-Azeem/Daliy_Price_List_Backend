'use strict';

/** @type {import('sequelize-cli').Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
  await queryInterface.createTable(
  "carts",
  {
    cart_id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    user_id: {
      type: Sequelize.CHAR(36),
      allowNull: false,
      references: { model: "users", key: "user_id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },

    status: {
      type: Sequelize.ENUM("active", "ordered"),
      allowNull: false,
      defaultValue: "active",
    },

    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },

    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },
  },
  {
    charset: "utf8mb4",
    collate: "utf8mb4_unicode_ci",
  }
);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("carts");
  },
};
