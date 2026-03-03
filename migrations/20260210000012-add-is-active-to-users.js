'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'is_active', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });

    // Optional: make sure all existing rows are active
    await queryInterface.sequelize.query(
      `UPDATE users SET is_active = true`
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'is_active');
  }
};
