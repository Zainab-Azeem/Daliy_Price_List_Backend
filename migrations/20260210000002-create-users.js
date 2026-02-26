'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
      await queryInterface.createTable("users", {
      user_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal("uuid()"),
      },

      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },

      full_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      avatar_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },

      role_id: {
     type: Sequelize.CHAR(36),
     allowNull: false,
     references: { model: "roles", key: "role_id" },
     onUpdate: "CASCADE",
     onDelete: "RESTRICT", },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("current_timestamp()"),
      },

      last_login_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
      },

      is_verified: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: 0,
      },

      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("current_timestamp()"),
      },

      google_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
        unique: true,
      },

      facebook_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
        unique: true,
      },
      },
      {
  charset: "utf8mb4",
  collate: "utf8mb4_unicode_ci",
} );

  },

  async down (queryInterface, Sequelize) {
      await queryInterface.dropTable('users');
   
  }
};
