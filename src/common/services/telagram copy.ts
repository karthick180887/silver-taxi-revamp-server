import axios from "axios";
// Test Bot ID and Chat ID
const TELEGRAM_BOT_ID = "7748291044:AAHVmUaNcEMyui1Jzy2h8r_cRYJffdK2vfs"
const TELEGRAM_CHAT_ID = "-1002316866788"

export const sendEnquiry = async (data: any) => {
    try {
        console.log("sendEnquiry", data)
        const response = await axios.get(`https://api.telegram.org/bot${TELEGRAM_BOT_ID}/sendMessage?chat_id=${TELEGRAM_CHAT_ID}&text=Enquiry%3A%0AFrom%3A+${data?.data.from}%0ATo%3A+${data?.data.to}%0AService%3A+${data?.data.service == "0" ? "OneWay" : "Round Trip"}%0AMobile%3A++%2B91${data?.data.mobile}%0APickup+Date%3A+${new Date(data?.data.pickupDateTime).toLocaleDateString()}%0APickup+Time%3A+${new Date(data?.data.pickupDateTime).toLocaleTimeString()}%0AEstimated+Distance%3A+${data?.data.distance}km`)
            .catch(err => {
                console.log(err);
            });
        // console.log(response);
        console.log('Enquiry sent to Telegram');
    } catch (err) {
        console.log('Telegram Error:', err);
    }
}


export const sendSuccess = async (data: any, bookId: string) => {
    try {
        await axios.get(`https://api.telegram.org/bot${TELEGRAM_BOT_ID}/sendMessage?chat_id=${TELEGRAM_CHAT_ID}&text=Booking%3A%0ABookId%3A+${bookId}%0D%0AmerchantOrderId%3A${data?.merchantOrderId}%0D%0APhone%3A++%2B91${data?.custPhone}%0D%0APickup+City%3A+${data?.from}%0D%0ADrop+City%3A+${data?.to}%0D%0APickup+Date%3A+${new Date(data?.pickupDateTime).toLocaleDateString()}%0D%0APickup+Time%3A+${new Date(data?.pickupDateTime).toLocaleTimeString()}%0D%0A` + `${(data?.trip == 'One Way Trip') ? "" : "Drop+Date%3A+" + new Date(data?.dropDate).toLocaleDateString() + "%0D%0A"}` + `Service:+${data?.trip}%0D%0ACartype:+${data?.carType}${data?.gst ? `%0D%0AGST+Amount%3A+${data?.gstAmount}` : ""}%0D%0AAdvance+amount:+${data?.advancePaid}%0D%0AEstimated+Price%3A+${data?.totalAmount}%0D%0APending+amount:+${(parseInt(data?.totalAmount) - parseInt(data?.advancePaid))}%0D%0AEstimated+Distance%3A+${data?.totalDistance}km`)
            .catch(err => {
                console.log(err);
            });
    } catch (err) {
        console.log('Telegram Error:', err);
    }
}


