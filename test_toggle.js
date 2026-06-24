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
      const firstDevice = devices.data.thingList[0].itemData;
      console.log("First device:", firstDevice.name, "ID:", firstDevice.deviceid);
      console.log("Params:", firstDevice.params);
      
      // Determine what to toggle based on current state
      const currentState = firstDevice.params.switches[0].switch || 'off';
      const newState = currentState === 'on' ? 'off' : 'on';
      
      console.log(`Toggling to ${newState}...`);
      
      // Toggle device
      const toggleRes = await client.device.setThingStatus({
        type: 1, // 1 for device, 2 for group
        id: firstDevice.deviceid,
        params: { switches: [{ outlet: 0, switch: newState }] }
      });
      
      console.log("Toggle Result:", toggleRes);
    } else {
      console.log("No devices found.");
    }
  }
}
run().catch(console.error);
