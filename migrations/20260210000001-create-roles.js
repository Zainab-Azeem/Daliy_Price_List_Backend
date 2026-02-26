'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
      await queryInterface.createTable("roles", {
      role_id: {type: Sequelize.CHAR(36),allowNull: false, primaryKey: true,defaultValue: Sequelize.literal("uuid()"), },
      role_name: {type: Sequelize.STRING(50),allowNull: false, unique: true,},
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      
      }
        ,
      {
  charset: "utf8mb4",
  collate: "utf8mb4_unicode_ci",
});

  },
     


  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('roles');
    
  }
};
