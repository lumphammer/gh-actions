// const { id } = require("./public/system.json");

module.exports = {
  extends: ["./packages/shared-fvtt-bits/dotfiles/import/.eslintrc.cjs"],
  ignorePatterns: ["**/dist/*", "!.github"],
  settings: {
    react: {
      version: "19",
    },
  },
  // add rules changes here
  rules: {},
};
