const url = 'https://api.penpencil.co/v3/oauth/token';
const mobileNumber = process.argv[2]
const otp = process.argv[3]
const options = {
  method: 'POST',
  headers: {
    connection: 'keep-alive',
    'sec-ch-ua-platform': '"Windows"',
    randomid: '9e54042d-339d-4764-b33c-b8d7c81f5b4b',
    'x-sdk-version': '0.0.12',
    'sec-ch-ua': '"Chromium";v="146", "Not-A.Brand";v="24", "Microsoft Edge";v="146"',
    'sec-ch-ua-mobile': '?0',
    'client-type': 'WEB',
    'client-id': '5eb393ee95fab7468a79d189',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0',
    dnt: '1',
    'content-type': 'application/json',
    accept: '*/*',
    origin: 'https://www.pw.live',
    'sec-fetch-site': 'cross-site',
    'sec-fetch-mode': 'cors',
    'sec-fetch-dest': 'empty',
    referer: 'https://www.pw.live/',
    'accept-language': 'en-GB,en;q=0.9,en-US;q=0.8,en-IN;q=0.7,hi;q=0.6'
  },
  body: JSON.stringify({
    username: `${mobileNumber}`,
    otp:`${otp}`,
    client_id: 'system-admin',
    client_secret: 'KjPXuAVfC5xbmgreETNMaL7z',
    grant_type: 'password',
    organizationId: '5eb393ee95fab7468a79d189',
    latitude: 0,
    longitude: 0
  })
};

(async()=>{
  const response = await fetch(url, options)
  const data = await response.json()
  console.log(JSON.stringify(data))
})();