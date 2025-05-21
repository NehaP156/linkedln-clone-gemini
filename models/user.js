module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    passwordHash: { // <--- CHANGE THIS LINE: Renamed from 'password' to 'passwordHash'
      type: DataTypes.STRING, // Make sure it's a STRING to store the hash
      // allowNull: false, // You can keep or remove this based on your preference for future social login integration
    },
    // Add other fields as needed for your user profile
    // e.g., firstName, lastName, headline, etc.
  }, {
    tableName: 'users', // Ensure this matches your migration table name
    timestamps: true    // Ensure timestamps are enabled (createdAt, updatedAt)
  });

  return User;
};
