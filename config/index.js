/* eslint-disable no-undef */
"use strict";
require("dotenv").config();

module.exports = {

  ADMIN_PRIVATE_KEY:process.env.ADMIN_PRIVATE_KEY_TEST,

  MUMBAI_RPC_URL:process.env.MUMBAI_RPC_URL,

  GOERLI:  process.env.GOERLI_RPC_URL,

  ETHERSCAN_API_KEY: process.env.ETHERSCAN_API_KEY
};
