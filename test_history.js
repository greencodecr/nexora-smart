const eWeLink = require("ewelink-api-next").default;

async function run() {
  const appId = "oeVkj2lYFGnJu5XUtWisfW4utiN4u9Mq";
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
  
  if (loginRes.error === 0 && loginRes.data) {
    client.at = loginRes.data.at;
    const devices = await client.device.getAllThings({});
    
    if (devices.data.thingList && devices.data.thingList.length > 0) {
      const deviceId = devices.data.thingList[0].itemData.deviceid;
      console.log("Fetching history for device:", deviceId);
      
      const historyRes = await client.device.getOperationHistory({ deviceId, num: 30 });
      console.log("History Response:", JSON.stringify(historyRes, null, 2));
    }
  }
}
run().catch(console.error);
