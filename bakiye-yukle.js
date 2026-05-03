const Iyzipay = require('iyzipay');

const iyzipay = new Iyzipay({
  apiKey: process.env.IYZICO_API_KEY,
  secretKey: process.env.IYZICO_SECRET_KEY,
  uri: 'https://api.iyzipay.com'
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { cardNumber, expireMonth, expireYear, cvc, cardHolderName, amount, userId, email } = req.body;

  console.log('Request body:', { cardNumber: cardNumber?.slice(0,4)+'****', expireMonth, expireYear, amount, userId, email });

  if (!cardNumber || !expireMonth || !expireYear || !cvc || !amount || !userId) {
    return res.status(400).json({ error: 'Eksik bilgi', received: { cardNumber: !!cardNumber, expireMonth: !!expireMonth, expireYear: !!expireYear, cvc: !!cvc, amount: !!amount, userId: !!userId } });
  }

  const callbackUrl = `https://www.emarkan.com.tr/api/bakiye-callback?userId=${userId}&amount=${amount}`;

  const request = {
    locale: Iyzipay.LOCALE.TR,
    conversationId: `bakiye_${userId}_${Date.now()}`,
    price: amount.toString(),
    paidPrice: amount.toString(),
    currency: Iyzipay.CURRENCY.TRY,
    installment: '1',
    basketId: `basket_${userId}_${Date.now()}`,
    paymentChannel: Iyzipay.PAYMENT_CHANNEL.WEB,
    paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
    callbackUrl,
    paymentCard: {
      cardHolderName: cardHolderName || 'Kart Sahibi',
      cardNumber: cardNumber.replace(/\s/g, ''),
      expireMonth: expireMonth.trim(),
      expireYear: expireYear.trim(),
      cvc,
      registerCard: '0'
    },
    buyer: {
      id: userId,
      name: (cardHolderName || 'Kullanici').split(' ')[0],
      surname: (cardHolderName || 'Kullanici Soyad').split(' ')[1] || 'Kullanici',
      gsmNumber: '+905000000000',
      email: email || 'kullanici@emarkan.com.tr',
      identityNumber: '74300864791',
      lastLoginDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
      registrationDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
      registrationAddress: 'Turkiye',
      ip: req.headers['x-forwarded-for']?.split(',')[0] || '85.34.78.112',
      city: 'Istanbul',
      country: 'Turkey',
    },
    shippingAddress: {
      contactName: cardHolderName || 'Kart Sahibi',
      city: 'Istanbul',
      country: 'Turkey',
      address: 'Turkiye',
    },
    billingAddress: {
      contactName: cardHolderName || 'Kart Sahibi',
      city: 'Istanbul',
      country: 'Turkey',
      address: 'Turkiye',
    },
    basketItems: [
      {
        id: 'bakiye',
        name: 'emarkan Platform Bakiyesi',
        category1: 'Dijital',
        itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
        price: amount.toString()
      }
    ]
  };

  return new Promise((resolve) => {
    iyzipay.threedsInitialize.create(request, (err, result) => {
      console.log('iyzico result:', JSON.stringify(result));
      if (err) {
        console.error('iyzico error:', err);
        res.status(500).json({ error: err.message || 'Odeme baslatılamadı' });
        return resolve();
      }
      if (result.status === 'success') {
        res.status(200).json({
          success: true,
          threeDSHtml: result.threeDSHtmlContent
        });
      } else {
        res.status(400).json({
          error: result.errorMessage || 'Odeme baslatılamadı',
          errorCode: result.errorCode,
          errorGroup: result.errorGroup,
          fullResult: result
        });
      }
      resolve();
    });
  });
}
