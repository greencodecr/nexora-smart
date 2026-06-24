import eWeLink from "ewelink-api-next";
require("dotenv").config({ path: ".env.local" });

async function run() {
  const client = new eWeLink.WebAPI({
    appId: process.env.EWELINK_APP_ID || "",
    appSecret: process.env.EWELINK_APP_SECRET || "",
    region: "us",
  });

  const account = process.env.EWELINK_USER_EMAIL || "";
  const password = process.env.EWELINK_USER_PASSWORD || "";
  const areaCode = process.env.EWELINK_USER_AREA || "";

  console.log("Logging in with", account, areaCode);
  const loginRes = await client.user.login({ account, password, areaCode });
  
  console.log("Login Response:");
  console.log(JSON.stringify(loginRes, null, 2));

  if (loginRes.error === 0 && loginRes.data) {
    client.at = loginRes.data.at;
    console.log("Fetching devices...");
    const devices = await client.device.getAllThings({} as any);
    console.log("Devices Response:");
    console.log(JSON.stringify(devices, null, 2));
  }
}

run().catch(console.error);
