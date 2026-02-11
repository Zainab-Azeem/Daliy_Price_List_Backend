'use strict';

/** @type {import('sequelize-cli').Migration} */
"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("orders", {
      order_id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },

      user_id: {
      type: Sequelize.CHAR(36),
      allowNull: false,
      references: { model: "users", key: "user_id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    
      address_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "addresses", key: "address_id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },

      total_amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      discount_amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      final_amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },

      status: {
        type: Sequelize.ENUM("pending", "confirmed", "shipped", "delivered", "cancelled"),
        allowNull: false,
        defaultValue: "pending",
      },

      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("orders");
  },
};

