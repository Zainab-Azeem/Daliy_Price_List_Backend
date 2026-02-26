'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "favourites",
      {
        favourite_id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },

        user_id: {
          type: Sequelize.CHAR(36),
          allowNull: false,
          references: {
            model: "users",
            key: "user_id",
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
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

        created_at: {
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

    // Prevent same product from being added twice to favourites
    await queryInterface.addConstraint("favourites", {
      fields: ["user_id", "product_id"],
      type: "unique",
      name: "uniq_user_product_favourite",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("favourites");
  },
};
