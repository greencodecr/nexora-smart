const dotenv = require('dotenv');
const ewelink = require('ewelink-api-next').default;

dotenv.config({ path: '.env.local' });

async function testHistory() {
  const client = new ewelink.WebAPI({
    appId: process.env.EWELINK_USER_APP_ID || "oeVkj2lYFGnJu5XUtWisfW4utiN4u9Mq",
    appSecret: process.env.EWELINK_USER_APP_SECRET || "6Nz4n0xA8s8qdxQf2GqurZj2Fs55FUvM",
    region: 'us',
  });

  const loginRes = await client.user.login({
    account: process.env.EWELINK_USER_EMAIL,
    password: process.env.EWELINK_USER_PASSWORD,
    areaCode: process.env.EWELINK_USER_AREA,
  });

  if (loginRes.error === 0) {
    const deviceId = "100253c515";
    const historyRes = await client.device.getOperationHistory({ deviceId, num: 30 });
    console.log('History response:', JSON.stringify(historyRes, null, 2));
  } else {
    console.error('Login failed:', loginRes);
  }
}

testHistory();
