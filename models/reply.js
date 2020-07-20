"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class reply extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  reply.init(
    {
      user_id: DataTypes.INTEGER,
      text: DataTypes.STRING,
      q_lists_id: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "reply",
    }
  );
  return reply;
};
