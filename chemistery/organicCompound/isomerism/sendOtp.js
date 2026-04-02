const mobileNumber = process.argv[2]

const options = {
  method: 'POST',
  headers: {
    connection: 'keep-alive',
    'sec-ch-ua-platform': '"Windows"',
    randomid: 'e06a28bb-7de4-430d-b6dd-bac19a86d421',
    'x-sdk-version': '0.0.19',
    'sec-ch-ua': '"Chromium";v="146", "Not-A.Brand";v="24", "Microsoft Edge";v="146"',
    'sec-ch-ua-mobile': '?0',
    'client-type': 'WEB',
    'client-id': '5eb393ee95fab7468a79d189',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0',
    dnt: '1',
    'content-type': 'application/json',
    accept: '*/*',
    origin: 'https://demo.pw.live',
    'sec-fetch-site': 'cross-site',
    'sec-fetch-mode': 'cors',
    'sec-fetch-dest': 'empty',
    referer: 'https://demo.pw.live/',
    'accept-language': 'en-GB,en;q=0.9,en-US;q=0.8,en-IN;q=0.7,hi;q=0.6'
  },
  body: JSON.stringify({
    username: `${mobileNumber}`,
    countryCode: '+91',
    organizationId: '5eb393ee95fab7468a79d189'
  })
};

(async()=>{
    const response = await fetch('https://api.penpencil.co/v1/users/get-otp?smsType=0&fallback=true', options)
    const data = await response.json()
    console.log(data)
})();

