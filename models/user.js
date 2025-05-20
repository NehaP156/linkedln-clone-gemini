'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
User.init({
    username: {
      type: DataTypes.STRING, // or DataTypes.STRING(80)
      allowNull: false,      // <-- Add this (or ensure it's there)
      unique: true           // <-- Add this line
    },
    passwordHash: {
      type: DataTypes.STRING(128), // <-- Update string length (e.g., 128 or 256)
      allowNull: false       // <-- Add this (or ensure it's there)
    },
    bio: DataTypes.TEXT,      // or DataTypes.STRING(255) if you prefer a shorter bio
    // Sequelize automatically adds 'id', 'createdAt', and 'updatedAt' columns by default
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};
 