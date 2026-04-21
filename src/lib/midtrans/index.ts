import midtransClient from 'midtrans-client'

let snap: midtransClient.Snap | null = null

export function getMidtransSnap() {
  if (!snap) {
    snap = new midtransClient.Snap({
      isProduction: process.env.NODE_ENV === 'production',
      serverKey: process.env.MIDTRANS_SERVER_KEY!,
      clientKey: process.env.MIDTRANS_CLIENT_KEY!
    })
  }
  return snap
}

export async function createTransaction(rideId: string, amount: number, customerName: string) {
  const snap = getMidtransSnap()
  
  const parameter = {
    transaction_details: {
      order_id: rideId,
      gross_amount: amount
    },
    customer_details: {
      first_name: customerName,
      email: `${customerName.toLowerCase().replace(/\s/g, '')}@example.com`
    },
    enabled_payments: ['qris', 'bank_transfer', 'gopay', 'ovo']
  }
  
  const transaction = await snap.createTransaction(parameter)
  return {
    token: transaction.token,
    redirectUrl: transaction.redirect_url
  }
}

export async function handleNotification(notificationBody: any) {
  const snap = getMidtransSnap()
  const statusResponse = await snap.transaction.notification(notificationBody)
  return statusResponse
}
