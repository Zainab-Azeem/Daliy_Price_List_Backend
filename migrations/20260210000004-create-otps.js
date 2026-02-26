'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
 async up(queryInterface, Sequelize) {
    await queryInterface.createTable("otps", {
      otp_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal("uuid()"),
      },

      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      otp: {
        type: Sequelize.STRING(10),
        allowNull: false,
      },

      purpose: {
        type: Sequelize.ENUM("register", "login", "reset_password"),
        allowNull: false,
      },

      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("current_timestamp()"),
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("current_timestamp()"),
      },

      resend_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      last_sent: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("current_timestamp()"),
      },

      attempts: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      block_until: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
      },
    }
      ,
    {
  charset: "utf8mb4",
  collate: "utf8mb4_unicode_ci",
});

   
    await queryInterface.addIndex("otps", ["email", "purpose"], {
      name: "idx_otps_email_purpose",
    });

    await queryInterface.addIndex("otps", ["expires_at"], {
      name: "idx_otps_expires_at",
    });

 
    await queryInterface.sequelize.query(`
      ALTER TABLE otps
      MODIFY expires_at TIMESTAMP NOT NULL
      DEFAULT current_timestamp()
      ON UPDATE current_timestamp();
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE otps
      MODIFY created_at TIMESTAMP NOT NULL
      DEFAULT current_timestamp();
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE otps
      MODIFY last_sent TIMESTAMP NOT NULL
      DEFAULT current_timestamp();
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE otps
      MODIFY block_until TIMESTAMP NULL DEFAULT NULL;
    `);

  },

  async down (queryInterface, Sequelize) {
     await queryInterface.dropTable('otps');
    
  }
};
