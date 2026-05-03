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

  if (!cardNumber || !expireMonth || !expireYear || !cvc || !amount || !userId) {
    return res.status(400).json({ error: 'Eksik bilgi' });
  }

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
    paymentCard: {
      cardHolderName,
      cardNumber: cardNumber.replace(/\s/g, ''),
      expireMonth,
      expireYear,
      cvc,
      registerCard: '0'
    },
    buyer: {
      id: userId,
      name: email.split('@')[0],
      surname: 'Kullanici',
      gsmNumber: '+905000000000',
      email: email,
      identityNumber: '74300864791',
      lastLoginDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
      registrationDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
      registrationAddress: 'Türkiye',
      ip: req.headers['x-forwarded-for'] || '85.34.78.112',
      city: 'Istanbul',
      country: 'Turkey',
    },
    shippingAddress: {
      contactName: 'emarkan Kullanici',
      city: 'Istanbul',
      country: 'Turkey',
      address: 'Türkiye',
    },
    billingAddress: {
      contactName: 'emarkan Kullanici',
      city: 'Istanbul',
      country: 'Turkey',
      address: 'Türkiye',
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

  iyzipay.payment.create(request, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message || 'Ödeme hatası' });
    }
    if (result.status === 'success') {
      return res.status(200).json({ 
        success: true, 
        paymentId: result.paymentId,
        conversationId: result.conversationId
      });
    } else {
      return res.status(400).json({ 
        error: result.errorMessage || 'Ödeme başarısız',
        errorCode: result.errorCode
      });
    }
  });
}
