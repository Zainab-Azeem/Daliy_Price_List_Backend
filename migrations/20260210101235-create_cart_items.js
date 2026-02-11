'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "cart_items",
      {
        cart_item_id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },

        cart_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "carts", key: "cart_id" },
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

        qty: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },

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

    await queryInterface.addConstraint("cart_items", {
      fields: ["cart_id", "product_id"],
      type: "unique",
      name: "uniq_cart_product",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("cart_items");
  },
};
