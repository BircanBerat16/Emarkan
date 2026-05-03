const Iyzipay = require('iyzipay');
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const iyzipay = new Iyzipay({
  apiKey: process.env.IYZICO_API_KEY,
  secretKey: process.env.IYZICO_SECRET_KEY,
  uri: 'https://api.iyzipay.com'
});

// Firebase Admin başlat
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: 'emarkan-54637',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    })
  });
}
const db = getFirestore();

export default async function handler(req, res) {
  const { userId, amount } = req.query;
  const { paymentId, conversationData, conversationId } = req.body;

  if (!paymentId || !userId || !amount) {
    return res.redirect('https://www.emarkan.com.tr?odeme=hata');
  }

  const request = {
    locale: Iyzipay.LOCALE.TR,
    conversationId,
    paymentId,
    conversationData
  };

  return new Promise((resolve) => {
    iyzipay.threedsPayment.create(request, async (err, result) => {
      if (err || result.status !== 'success') {
        res.redirect('https://www.emarkan.com.tr?odeme=hata');
        return resolve();
      }
      try {
        // Bakiyeyi Firebase'de güncelle
        const profileRef = db.collection('profiles').doc(userId);
        const profile = await profileRef.get();
        const mevcutBakiye = profile.data()?.bakiye || 0;
        await profileRef.update({ bakiye: mevcutBakiye + parseInt(amount) });
        res.redirect(`https://www.emarkan.com.tr?odeme=basarili&miktar=${amount}`);
      } catch(e) {
        res.redirect('https://www.emarkan.com.tr?odeme=hata');
      }
      resolve();
    });
  });
}
