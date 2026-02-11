"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("order_items", {
      order_item_id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },

      order_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "orders", key: "order_id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      product_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: { model: "products", key: "product_id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      qty: { type: Sequelize.INTEGER, allowNull: false },
      price: { type: Sequelize.DECIMAL(10, 2), allowNull: false },

      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("order_items");
  },
};
