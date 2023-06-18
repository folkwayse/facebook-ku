const puppeteer = require('puppeteer');
const fs = require('fs');
require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');
const { Configuration, OpenAIApi } = require("openai");
const { off } = require('process');

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
const UA = `Mozilla/5.0 (Linux; Android 7.1.2; Kindle Fire HDX Build/NJH47D) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/59.0.3071.92 Safari/537.36`
// https://www.facebook.com/groups/4146369458784377

const appId = '11348620064';
const secret = 'K7NUNSXHDUUWA6SWTCSHGJ3IGIX2LXZU';

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createShop = async (data) => {
    return prisma.shop.create({ data });
};



async function checkLoginStatus() {
    const browser = await puppeteer.launch({ headless: false }); // Buka browser
    const page = await browser.newPage(); // Buka halaman baru
    const cookiesString = fs.readFileSync('cookies.json');
    const cookies = JSON.parse(cookiesString);
    await page.setCookie(...cookies);

    // Buka www.facebook.com
    await page.goto('https://www.facebook.com', { waitUntil: 'networkidle2' });

    // Muat cookies dari file
    //wait for 10 seconds
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Set cookies di halaman saat ini

    // Refresh halaman untuk menerapkan cookies
    // await page.reload();

    // Tunggu hingga masuk ke halaman beranda
    // await page.waitForNavigation();

    // Periksa apakah pengguna telah masuk dengan memeriksa elemen yang hanya muncul setelah login
    const isLoggedin = await page.evaluate(() => {
        const pesanBaru = document.querySelector('[aria-label="Pesan baru"]');
        return !!pesanBaru;
    });

    // Tutup browser
    await browser.close();

    return isLoggedin;
}
async function doLogin() {
    const browser = await puppeteer.launch({ headless: false }); // Buka browser
    const page = await browser.newPage(); // Buka halaman baru

    await page.goto('https://www.facebook.com'); // Buka www.facebook.com

    // Isi formulir login dengan menggunakan nilai dari .env
    await page.type('#email', process.env.email, { delay: 100 });
    await page.type('#pass', process.env.password, { delay: 100 });

    await page.click('[data-testid="royal_login_button"]', { delay: 1000 });

    // Tunggu hingga masuk ke halaman beranda
    await page.waitForNavigation();

    // Tunggu selama 20 detik
    await new Promise(resolve => setTimeout(resolve, 20000));

    // Dapatkan cookies dari halaman
    const cookies = await page.cookies();

    // Simpan cookies ke dalam file
    fs.writeFileSync('cookies.json', JSON.stringify(cookies));

    // Tutup browser
    await browser.close();
}
async function loginAndCheckStatus() {
    const isLoggedIn = await checkLoginStatus();

    if (isLoggedIn) {
        console.log('Pengguna telah masuk.');
    } else {
        console.log('Pengguna belum masuk. Melakukan login...');
        await doLogin();
        console.log('Login selesai.');
    }
}

async function postToGroup(groupUrl, imageUrl, caption) {
    const browser = await puppeteer.launch({ headless: false }); // Buka browser
    //set user agent

    const page = await browser.newPage(); // Buka halaman baru

    const cookiesString = fs.readFileSync('cookies.json');
    const cookies = JSON.parse(cookiesString);
    await page.setUserAgent(UA);
    // Set cookies di halaman saat ini
    await page.setCookie(...cookies);
    // Navigasi ke grup Facebook
    await page.goto('https://m.facebook.com/', { waitUntil: 'networkidle2' });



    await new Promise(resolve => setTimeout(resolve, 3000)); // Tunggu selama 5 detik menggunakan Promises
    await page.click('div[data-tti-phase="-1"][data-actual-height="40"][data-mcomponent="MContainer"][data-type="container"].m');
    await new Promise(resolve => setTimeout(resolve, 1000));


    for (let image of imageUrl) {
        //download and save file using axios
        await axios.get(image, {
            responseType: 'stream'
        }).then(async (response) => {
            const stream = response.data;
            const buffer = await new Promise((resolve, reject) => {
                const chunks = [];
                stream.on('data', (chunk) => chunks.push(chunk));
                stream.on('end', () => resolve(Buffer.concat(chunks)));
                stream.on('error', (err) => reject(err));
            })

            fs.writeFileSync('./image2.jpg', buffer);
            await new Promise(resolve => setTimeout(resolve, 1000));
        });


        const [fileChooser] = await Promise.all([
            page.waitForFileChooser(),
            page.click('div[role="button"][data-tti-phase="-1"][data-actual-height="31"][data-mcomponent="MContainer"][data-type="container"].m'),
            page.waitForSelector('input[type="file"]'),
        ]);

        const fileInput = await page.$('input[type="file"]');
        await fileInput.uploadFile('./image2.jpg');
        await fileChooser.accept(['./image2.jpg']);
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    await new Promise(resolve => setTimeout(resolve, 1000));

    await page.waitForSelector('button[dir="auto"][class="native-text"]');
    await page.click('button[dir="auto"][class="native-text"]');
    await page.waitForFunction(() => document.activeElement);
    await page.keyboard.type(caption, { delay: 100 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    // await new Promise(resolve => setTimeout(resolve, 1000));
    await page.click('div[data-tti-phase="-1"][data-actual-height="48"][data-mcomponent="MContainer"][data-type="container"][data-focusable="true"].m.nb');
    await new Promise(resolve => setTimeout(resolve, 10000));
    await browser.close();
}
async function postToPage(images, caption) {
    console.log(images)
    const browser = await puppeteer.launch({ headless: false }); // Buka browser
    //set user agent

    const page = await browser.newPage(); // Buka halaman baru

    const cookiesString = fs.readFileSync('cookies.json');
    const cookies = JSON.parse(cookiesString);
    await page.setUserAgent(UA);
    // Set cookies di halaman saat ini
    await page.setCookie(...cookies);
    // Navigasi ke grup Facebook
    await page.goto('https://m.facebook.com/', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 3000)); // Tunggu selama 5 detik menggunakan Promises
    await page.click('div[data-tti-phase="-1"][data-actual-height="36"][data-mcomponent="MContainer"][data-type="container"][data-focusable="true"].m');

    await new Promise(resolve => setTimeout(resolve, 3000));
    for (let image of images) {
        //download and save file using axios
        await axios.get(image, {
            responseType: 'stream'
        }).then(async (response) => {
            const stream = response.data;
            const buffer = await new Promise((resolve, reject) => {
                const chunks = [];
                stream.on('data', (chunk) => chunks.push(chunk));
                stream.on('end', () => resolve(Buffer.concat(chunks)));
                stream.on('error', (err) => reject(err));
            })

            fs.writeFileSync('./image2.jpg', buffer);
            await new Promise(resolve => setTimeout(resolve, 1000));
        });


        const [fileChooser] = await Promise.all([
            page.waitForFileChooser(),

            page.click('div[data-tti-phase="-1"][data-actual-height="33"][data-mcomponent="MContainer"][data-type="container"].m.displayed'),

            page.waitForSelector('input[type="file"]'),
        ]);

        const fileInput = await page.$('input[type="file"]');
        await fileInput.uploadFile('./image2.jpg');
        await fileChooser.accept(['./image2.jpg']);
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    await page.waitForSelector('button[dir="auto"][class="native-text"]');
    await page.click('button[dir="auto"][class="native-text"]');
    await page.waitForFunction(() => document.activeElement);
    await page.keyboard.type(caption, { delay: 100 });
    await new Promise(resolve => setTimeout(resolve, 1000));

    await page.waitForSelector('div[data-tti-phase="-1"][data-actual-height="48"][data-mcomponent="MContainer"][data-type="container"][data-focusable="true"].m.nb');
    await page.click('div[data-tti-phase="-1"][data-actual-height="48"][data-mcomponent="MContainer"][data-type="container"][data-focusable="true"].m.nb');

    await new Promise(resolve => setTimeout(resolve, 10000));
    await browser.close();



    // await new Promise(resolve => setTimeout(resolve, 1000));

    // await page.waitForSelector('button[dir="auto"][class="native-text"]');
    // await page.click('button[dir="auto"][class="native-text"]');
    // await page.waitForFunction(() => document.activeElement);
    // await page.keyboard.type(caption, { delay: 100 });
    // await new Promise(resolve => setTimeout(resolve, 1000));
    // // await new Promise(resolve => setTimeout(resolve, 1000));
    // await page.click('div[data-tti-phase="-1"][data-actual-height="48"][data-mcomponent="MContainer"][data-type="container"][data-focusable="true"].m.nb');
    // await new Promise(resolve => setTimeout(resolve, 10000));
    // await browser.close();
}
function generateShopeeGraphQLRequest(query) {

    const timestamp = Math.floor(Date.now() / 1000);

    const payload = JSON.stringify({ query });

    const signature = crypto
        .createHash('sha256')
        .update(`${appId}${timestamp}${payload}${secret}`)
        .digest('hex');

    const headers = {
        Authorization: `SHA256 Credential=${appId}, Signature=${signature}, Timestamp=${timestamp}`,
        'Content-Type': 'application/json',
    };

    return { payload, headers };
}

async function generateShortLink(long_url) {
    console.log(long_url)
    const url = 'https://open-api.affiliate.shopee.co.id/graphql';
    const query = `mutation{\n    generateShortLink(input:{originUrl:"${long_url}",subIds:["botgroup","s2","s3","s4","s5"]}){\n        shortLink\n    }\n}`;

    const { payload, headers } = generateShopeeGraphQLRequest(query);

    try {
        const response = await axios.post(url, payload, {
            headers: headers
        });

        const shortLink = response.data.data.generateShortLink.shortLink;
        console.log('Short link:', shortLink);
        return shortLink;
    } catch (error) {
        console.error('Error:', error.response.data);
    }
}


async function cariOffer(keyword, sortType = 1, page = 1) {
    const query = `query {
      productOfferV2(
        keyword: "${keyword}", 
        sortType: ${sortType}, 
        page: ${page},
        limit: 20
      ) {
        nodes {      
          commissionRate,      
          imageUrl,      
          offerLink,           
          shopName,      
          periodStartTime,      
          periodEndTime,
          productName
        } 
      }
    }`;

    const { payload, headers } = generateShopeeGraphQLRequest(query);

    try {
        const response = await axios.post('https://open-api.affiliate.shopee.co.id/graphql', payload, { headers });
        return response.data.data.productOfferV2.nodes;
    } catch (error) {
        console.error(error);
        return [];
    }
}
async function getHeaders() {
    let response = await axios.get('https://verista.sgp1.digitaloceanspaces.com/shopee-headers/headers.json');
    return response.data
}


async function generateData() {
    try {
        await prisma.$connect();
        const shopCount = await prisma.shop.count();
        console.log('Jumlah data Shop:', shopCount);
        const listKategori = [
            2518032,
            2518034,
            2507856,
            2507858,
            2507860,
            2507864,
            2518036,
            2518038,
            2507866,
            2518040,
            2507868
        ];

        for (const categoryId of listKategori) {
            const dataProduks = await axios.get(`https://shopee.co.id/api/v4/collection/get_items?by=relevancy&extra_params=%7B%22global_search_session_id%22%3A%22gs-1ef8ceb9-3e42-4e36-8627-356eb5ebe2f0%22%2C%22search_session_id%22%3A%22ss-c4b51792-3aa4-48b0-b0c0-2ebecdbbeeca%22%7D&limit=60&match_id=2509966&newest=0&order=desc&page_type=collection&scenario=PAGE_COLLECTION&version=2&view_session_id=c371a40d-c2ee-45ba-9e7b-4cfde8ee05dc&collection_id=${categoryId}&item_order=0&limit=100&offset=0&source=3`, {
                headers: await getHeaders(),
            });
            console.log(dataProduks);

            const createShopsPromises = dataProduks.data.data.items.map(async (produk) => {
                const imageUrl = produk.item_card_full.images.map((image) => 'https://down-id.img.susercontent.com/file/' + image);
                const link = await generateShortLink(`https://shopee.co.id/product/${produk.item_card_full.shopid}/${produk.item_card_full.itemid}`);
                const caption = `produknya disini : ${link}`;

                try {
                    const existingShop = await prisma.shop.findUnique({
                        where: {
                            itemid: produk.item_card_full.itemid.toString(),
                        },
                    });

                    if (existingShop) {
                        console.log('Item with the same itemid already exists:', existingShop);
                        return null;
                    }

                    const newShop = await prisma.shop.create({
                        data: {
                            shopid: produk.item_card_full.shopid.toString(),
                            itemid: produk.item_card_full.itemid.toString(),
                            images: imageUrl,
                            caption: caption.toString(),
                        },
                    });

                    console.log('New shop created:', newShop);
                    return newShop;
                } catch (error) {
                    console.error(error);
                    return null;
                }
            });

            await Promise.all(createShopsPromises);
        }

        console.log('All shops created successfully.');
    } catch (error) {
        console.error(error);
    } finally {
        const shopCount = await prisma.shop.count();
        console.log('Jumlah data Shop:', shopCount);
        await prisma.$disconnect();
    }

}

const getAndDeleteShop = async () => {
    try {
        // Mengambil satu data acak dari model Shop
        const randomShop = await prisma.shop.findFirst({
            orderBy: {
                id: 'asc', // Mengurutkan secara acak berdasarkan kolom id
            },
        });

        if (randomShop) {
            console.log('Random shop data:', randomShop);

            // Menghapus data yang telah diambil
            await prisma.shop.delete({
                where: { id: randomShop.id },
            });

            console.log('Shop data has been deleted.');

            // Mengembalikan data dalam format JSON
            return JSON.stringify(randomShop);
        } else {
            console.log('No shop data found.');
            return JSON.stringify({ error: 'No shop data found.' });
        }
    } catch (error) {
        console.error(error);
        return JSON.stringify({ error: 'An error occurred.' });
    } finally {
        // await prisma.$disconnect();
    }

};

(async () => {
    // await generateData();
    //get first object of ./data.json
    let condition = true; // kondisi awal
    await prisma.$connect();
    const shopCount = await prisma.shop.count();
    console.log('Jumlah data Shop:', shopCount);

    while (condition) {
        let data = await getAndDeleteShop().then((result) => {
            return JSON.parse(result); // Mengurai data JSON yang dikembalikan
        }).catch(console.error);

        await postToPage(data.images, data.caption)
            .then(() => {
                console.log('Posting di grup selesai.');
                // Perbarui nilai condition berdasarkan kondisi yang sesuai

            })
            .catch(error => {
                console.error('Terjadi kesalahan:', error);
                // Perbarui nilai condition berdasarkan kondisi yang sesuai

                condition = false; // Ubah condition menjadi false untuk menghentikan perulangan

            });
        //wait for 90 seconds
        await new Promise(resolve => setTimeout(resolve, 30 * 60 * 1000));
    }


    // let imageUrl = ['https://down-id.img.susercontent.com/file/573ad8e7359cbe7b34f0e9842a67214d']

    console.log();
    // await postToGroup(groupUrl, imageUrl, caption)
    //     .then(() => {
    //         console.log('Posting di grup selesai.');
    //     })
    //     .catch(error => {
    //         console.error('Terjadi kesalahan:', error);
    //     });
})();



const base_caption =
    [
        "Pilihlah pakaian hijabers yang sesuai dengan gaya mix and match yang kamu sukai. 💖",
        "Tampilkan keindahan outfit hijabersmu dengan kombinasi mix and match yang terbaru! 😍",
        "Ciptakan tampilan hijabers yang unik dengan mix and match outfit yang cerdas. 💕",
        "Tunjukkan gaya fashionmu yang kekinian dengan paduan mix and match outfit hijabers yang trendy. 😊",
        "Eksplorasi berbagai gaya mix and match outfit hijabers untuk mendapatkan penampilan yang memukau! 😍",
        "Kreasi mix and match outfit hijabersmu bisa menjadi inspirasi bagi yang lain. 🌟",
        "Dengan mix and match outfit hijabers yang tepat, kamu bisa menunjukkan kepribadianmu. 😊",
        "Koleksi mix and match outfit hijabersmu harus mencerminkan gaya hidupmu yang modern. 💖",
        "Dapatkan tampilan yang serasi dengan mix and match outfit hijabers yang dipilih dengan teliti. ✨",
        "Kembangkan gaya mix and match outfit hijabersmu dengan eksperimen warna yang menarik. 🎨",
        "Tingkatkan penampilan hijabersmu dengan paduan mix and match outfit yang mengesankan. 💃",
        "Pilihlah aksesori yang tepat untuk melengkapi mix and match outfit hijabersmu yang chic. 💍",
        "Tampil fashionable dengan mix and match outfit hijabers yang simpel namun stylish. 😍",
        "Dapatkan look yang segar dan modern dengan mix and match outfit hijabers yang up-to-date. 💫",
        "Ciptakan perpaduan mix and match outfit hijabers yang memikat dengan pola dan tekstur yang kontras. 🌺",
        "Padukan hijabersmu dengan mix and match outfit yang berani dan inovatif. 💃",
        "Tunjukkan keunikan dirimu dengan mix and match outfit hijabers yang out-of-the-box! 🌈",
        "Dengan mix and match outfit hijabers yang cerdas, kamu bisa tampil anggun di setiap kesempatan. ✨",
        "Pilihlah mix and match outfit hijabers yang memberikan kamu kenyamanan dan percaya diri. 🌸",
        "Eksplorasi berbagai motif dan pola untuk menciptakan mix and match outfit hijabers yang menarik perhatian. 🌟",
        "Kreasi mix and match outfit hijabers yang sederhana namun menawan bisa menjadi signature stylemu. 💖",
        "Dapatkan tampilan yang elegan dan modern dengan mix and match outfit hijabers yang effortless. 😍",
        "Pilihlah paduan mix and match outfit hijabers yang mencerminkan kepribadianmu yang berani. 💫",
        "Tunjukkan bahwa hijabers juga bisa tampil trendy dan fashionable dengan mix and match outfit yang tepat. ✨",
        "Ciptakan gaya mix and match outfit hijabers yang minimalis namun stylish. 🌸",
        "Dapatkan inspirasi dari berbagai fashion blogger untuk mix and match outfit hijabers yang stylish. 🌟",
        "Kombinasikan warna-warna yang kontras untuk menciptakan mix and match outfit hijabers yang eye-catching. 🎨",
        "Dengan mix and match outfit hijabers yang kreatif, kamu bisa mengekspresikan dirimu dengan lebih bebas. 🌈",
        "Tingkatkan kesan femininmu dengan mix and match outfit hijabers yang anggun dan elegan. 💖",
        "Pilihlah mix and match outfit hijabers yang nyaman dipakai sehingga kamu bisa beraktivitas dengan bebas. 😊"
    ]
const group_list = [
    'https://www.facebook.com/groups/920595229237802',
    'https://www.facebook.com/groups/2581157558830492',
    'https://www.facebook.com/groups/757704651601645/',
    'https://www.facebook.com/groups/589377098165983/',
    'https://www.facebook.com/groups/362758794386345',
]