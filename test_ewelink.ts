import eWeLink from "ewelink-api-next";

async function test() {
  const appId = process.env.EWELINK_APP_ID;
  const appSecret = process.env.EWELINK_APP_SECRET;
  const email = process.env.EWELINK_USER_EMAIL;
  const password = process.env.EWELINK_USER_PASSWORD;
  const areaCode = process.env.EWELINK_USER_AREA;

  console.log(`Using AppID: ${appId?.substring(0, 5)}... Email: ${email}`);

  const client = new eWeLink.WebAPI({
    appId: appId || '',
    appSecret: appSecret || '',
    region: 'us',
    logObj: console
  });

  try {
    console.log("Attempting login...");
    const response = await client.user.login({
      account: email || '',
      password: password || '',
      areaCode: areaCode || ''
    });

    console.log("Login Response:", JSON.stringify(response, null, 2));

    if (response && response.error === 0) {
      console.log("Fetching devices...");
      const devices = await client.device.getThingList();
      console.log("Devices Response:", JSON.stringify(devices, null, 2));
    }
  } catch (err) {
    console.error("Test Exception:", err);
  }
}

test();
