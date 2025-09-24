/** Disable no-unused-vars just for Topbar.tsx */
module.exports = {
  overrides: [
    {
      files: ["src/components/Topbar.tsx"],
      rules: {
        "@typescript-eslint/no-unused-vars": "off"
      }
    }
  ]
};
