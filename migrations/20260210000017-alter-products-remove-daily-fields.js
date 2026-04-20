'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn("products", "price");
    await queryInterface.removeColumn("products", "discount_percent");
    await queryInterface.removeColumn("products", "stock_qty");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn("products", "price", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
    });

    await queryInterface.addColumn("products", "discount_percent", {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 0.00,
    });

    await queryInterface.addColumn("products", "stock_qty", {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0,
    });
  }
};