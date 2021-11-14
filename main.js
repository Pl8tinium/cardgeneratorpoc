const textToImage = require('text-to-image');
const mergeImages = require('merge-images');
const { Canvas, Image } = require('canvas');
const imageDataURI = require('image-data-uri')

cardDescription = `
Share this\n
I'll be gone till november\n
Wyclef Jean\n
Found on DNS.XYZ`

twitterCardOutput = './img/card.png'

const main = async () => {
    // generate profile information image data uri
    const profileInfoImgB64 = textToImage.generateSync(cardDescription, { customHeight: 244 });

    imagesForCard = [
        { src: './img/background.png', x: 0, y: 0 },
        { src: './img/nft.png', x: 0, y: 0 },
        { src: profileInfoImgB64, x: 250, y: 0 },
    ]

    // merge the 2 images 
    var twitterCardB64 = await mergeImages(imagesForCard, {
        Canvas: Canvas,
        Image: Image
    })
    
    // output the twitter card
    await imageDataURI.outputFile(twitterCardB64, twitterCardOutput)
}
main();