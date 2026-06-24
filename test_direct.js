const eWeLink = require("ewelink-api-next").default;

async function run() {
  const appId = "oeVkj2lYFGnJu5XUtWisfW4utiN4u9Mq"; // Known App ID from old ewelink-api
  const appSecret = "6Nz4n0xA8s8qdxQf2GqurZj2Fs55FUvM";
  
  const client = new eWeLink.WebAPI({
    appId,
    appSecret,
    region: "us",
  });

  const account = "gonzalo@radiosancarlos.co.cr";
  const password = "Radio1430am";
  const areaCode = "+506";

  console.log("Logging in directly...");
  const loginRes = await client.user.login({ account, password, areaCode });
  console.log("Login Res:", loginRes);

  if (loginRes.error === 0 && loginRes.data) {
    client.at = loginRes.data.at;
    const devices = await client.device.getAllThings({});
    console.log("Devices:", devices);
  }
}
run().catch(console.error);
