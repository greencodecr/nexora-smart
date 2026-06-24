import eWeLink from "ewelink-api-next";

// Define a singleton to keep the eWeLink client instance across hot-reloads in dev
const globalForEwelink = global as unknown as { ewelinkClient: any };

let client: any = globalForEwelink.ewelinkClient;

export async function getEwelinkClient(forceLogin = false) {
  if (!forceLogin && client && client.at) {
    return client;
  }

  // Use the legacy App ID and Secret which permit direct login
  const appId = "oeVkj2lYFGnJu5XUtWisfW4utiN4u9Mq";
  const appSecret = "6Nz4n0xA8s8qdxQf2GqurZj2Fs55FUvM";

  // Determine region from API URL if possible, or default to us
  let region = 'us';
  if (process.env.EWELINK_API_URL) {
    const match = process.env.EWELINK_API_URL.match(/https:\/\/(.*?)-apia/);
    if (match && match[1]) {
      region = match[1];
    }
  }

  client = new eWeLink.WebAPI({
    appId,
    appSecret,
    region,
  });

  const account = process.env.EWELINK_USER_EMAIL;
  const password = process.env.EWELINK_USER_PASSWORD;
  const areaCode = process.env.EWELINK_USER_AREA;

  if (account && password && areaCode) {
    try {
      console.log(`Logging in directly with email: ${account}`);
      const loginRes = await client.user.login({
        account,
        password,
        areaCode
      });
      
      if (loginRes.error === 0) {
        console.log("Direct login successful.");
        if (loginRes.data && loginRes.data.at) {
          client.at = loginRes.data.at;
        }
      } else {
        console.error("Direct login failed with response:", JSON.stringify(loginRes));
        throw new Error("NOT_AUTHENTICATED");
      }
    } catch (err) {
      console.error("Exception during direct login:", err);
      throw new Error("NOT_AUTHENTICATED");
    }
  } else {
    console.warn("Direct login credentials missing in .env.local");
    throw new Error("NOT_AUTHENTICATED");
  }

  if (process.env.NODE_ENV !== 'production') {
    globalForEwelink.ewelinkClient = client;
  }

  return client;
}
