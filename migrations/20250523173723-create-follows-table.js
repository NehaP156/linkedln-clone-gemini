// migrations/xxxx-create-follows-table.js (replace xxxx with your timestamp)
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Follows', {
      id: { // An auto-incrementing primary key for the Follows table itself
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      followerId: { // The ID of the user who is doing the following
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { // Foreign key constraint to the Users table
          model: 'Users', // Name of the target table (your User model's table name)
          key: 'id'
        },
        onUpdate: 'CASCADE', // If a user's ID changes, update this field
        onDelete: 'CASCADE' // If a user is deleted, delete their follow records
      },
      followingId: { // The ID of the user who is being followed
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { // Foreign key constraint to the Users table
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Add a unique constraint: ensures a user cannot follow another user multiple times
    await queryInterface.addConstraint('Follows', {
      fields: ['followerId', 'followingId'],
      type: 'unique',
      name: 'unique_follow_constraint'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Follows');
  }
};