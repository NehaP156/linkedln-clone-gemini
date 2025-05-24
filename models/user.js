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

      // Day 10, Task 3: Define Many-to-Many Self-Referencing Association for Follows
      // A User can follow many other Users
      User.belongsToMany(models.User, {
        as: 'Following',          // Alias for the users THIS user follows
        through: 'Follows',       // The name of the junction table
        foreignKey: 'followerId', // The foreign key in 'Follows' that refers to THIS user (the one doing the following)
        otherKey: 'followingId'   // The foreign key in 'Follows' that refers to the user BEING followed
      });

      // A User can be followed by many other Users
      User.belongsToMany(models.User, {
        as: 'Followers',          // Alias for the users who follow THIS user
        through: 'Follows',       // The same junction table
        foreignKey: 'followingId', // The foreign key in 'Follows' that refers to THIS user (the one BEING followed)
        otherKey: 'followerId'   // The foreign key in 'Follows' that refers to the user DOING the following
      });
    }
  }
User.init({
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notNull: { msg: 'Username is required' },
      notEmpty: { msg: 'Username cannot be empty' },
    }
  },
  email: { // <--- THIS IS THE COLUMN IT'S LOOKING FOR
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notNull: { msg: 'Email is required' },
      notEmpty: { msg: 'Email cannot be empty' },
      isEmail: { msg: 'Must be a valid email address' }
    }
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'User',
});
  return User;
};