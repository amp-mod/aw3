export const hmacKey =
  process.env.AW3_HMAC_KEY ??
  (() => {
    console.warn(
      'AW3_HMAC_KEY not set. Literally using "hmac" as the key instead. If this is a production server, please restart aw3 with AW3_HMAC_KEY set to something secure. If you are developing, you can ignore this.'
    );
    return 'hmac';
  })();
