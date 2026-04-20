'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("product_updates", {
      update_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      product_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: "products",
          key: "product_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },

      discount_percent: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: 0.00,
      },

      stock_qty: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("current_timestamp()"),
      },

      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("current_timestamp()"),
      },
    },
    {
  charset: "utf8mb4",
  collate: "utf8mb4_unicode_ci",
}
  );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("product_updates");
  }
};