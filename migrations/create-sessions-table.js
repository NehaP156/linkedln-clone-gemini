'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('Sessions', {
      sid: {
        type: Sequelize.STRING,
        primaryKey: true
      },
      userId: { // This was optional but good to keep
        type: Sequelize.INTEGER,
        allowNull: true // Allow null if session isn't immediately tied to a user (e.g., guest session)
      },
      expires: {
        type: Sequelize.DATE,
        allowNull: true // Can be null if sessions don't expire for some reason, though unlikely
      },
      data: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      // --- ADD THESE LINES ---
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
      // --- END ADDED LINES ---
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('Sessions');
  }
};
