import RingCentral from '@rc-ex/core';
import PubNubExtension from '@rc-ex/pubnub';
import waitFor from 'wait-for-async';

const rc = new RingCentral({
  clientId: process.env.RINGCENTRAL_CLIENT_ID!,
  clientSecret: process.env.RINGCENTRAL_CLIENT_SECRET!,
  server: process.env.RINGCENTRAL_SERVER_URL!,
});

const main = async () => {
  await rc.login({
    username: process.env.RINGCENTRAL_USERNAME!,
    extension: process.env.RINGCENTRAL_EXTENSION!,
    password: process.env.RINGCENTRAL_PASSWORD!,
  });
  const pubNubExtension = new PubNubExtension();
  await rc.installExtension(pubNubExtension);
  const r = await rc.restapi().account().extension().device().get();
  const eventFilter = (r.records ?? []).map(
    r => `/restapi/v1.0/account/~/device/${r.id}/emergency-address`
  );
  eventFilter.push('/restapi/v1.0/account/~/extension/~/message-store');
  console.log(eventFilter);
  const r2 = await pubNubExtension.subscribe(eventFilter, (event: any) => {
    console.log(JSON.stringify(event, null, 2));
  });
  console.log(JSON.stringify(r2.subscriptionInfo, null, 2));
  await waitFor({interval: 10000});
  await await rc
    .restapi()
    .account()
    .extension()
    .companyPager()
    .post({
      from: {extensionNumber: '11115'},
      to: [{extensionNumber: '11115'}], // send pager to oneself
      text: 'Hello world',
    });
  await waitFor({interval: 3600000}); // 1 hour
  await rc.revoke();
};

main();
