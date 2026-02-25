'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
     await queryInterface.createTable("products", {
      product_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal("uuid()"),
      },

      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: null,
      },

      price: {
        type: Sequelize.DECIMAL(10,2),
        allowNull: false,
      },

      discount_percent: {
        type: Sequelize.DECIMAL(5,2),
        allowNull: true,
        defaultValue: 0.00,
      },

      stock_qty: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },

      image_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
        defaultValue: null,
      },

      category: {
        type: Sequelize.STRING(100),
        allowNull: true,
        defaultValue: null,
      },

      is_active: {
        type: Sequelize.BOOLEAN, 
        allowNull: true,
        defaultValue: 1,
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
    });

    
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('products');
     
  }
};
