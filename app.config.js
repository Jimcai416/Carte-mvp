const appJson = require("./app.json");

const webBaseUrl = process.env.TAVUE_WEB_BASE_URL?.trim();

module.exports = {
  expo: {
    ...appJson.expo,
    ...(webBaseUrl
      ? {
          experiments: {
            ...(appJson.expo.experiments ?? {}),
            baseUrl: webBaseUrl,
          },
        }
      : {}),
  },
};
