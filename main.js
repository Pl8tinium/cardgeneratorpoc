// nftPath = './img/nft.png'
nftPath = './img/nftBigHeight.png'
// nftPath = './img/nftBigWidth.png'
// nftPath = './img/nftBigWidth2.png'
avatarPath = './img/avatar.png'
backgroundPath = './img/background.png'
twitterCardOutput = './img/card.png'
cardHeight = 300
cardWidth = 600

info = {
    user: 'Wyclef Jean',
    title: 'I\'ll be gone till november',
    nft: nftPath,
    avatar: avatarPath
}

const sharpWrapper = {
    init: () => this.sharp = require('sharp'),    
    resize: async (img, scale) => {        
        return await this.sharp(img).resize(scale).toBuffer()
    },
    getDimensions: async (img) => {        
        return await this.sharp(img).metadata()
    }
}

const resizeNft = async (nft) => {
    sharpWrapper.init()
    
    // get dimensions
    dimensions = await sharpWrapper.getDimensions(nft)
    
    // depending on the ratio.. h > w scale for width - w < h scale for height
    scaleFor = dimensions.width > dimensions.height ? { height: cardHeight } : { width: cardWidth / 2 }

    resizedImg = await sharpWrapper.resize(nft, scaleFor)

    return resizedImg.toString('base64')    
}

const generateProfileInfoImage = (cardInfo) => {
    cardDescription = `
    ${cardInfo.title}\n\n\n
    ${cardInfo.user}\n
    Found on\nDNS.XYZ
    `
    const textToImage = require('text-to-image');

    return textToImage.generateSync(cardDescription, { maxWidth: cardWidth / 2, customHeight: cardHeight, fontFamily: 'Calibri', verticalAlign: 'center', textAlign: 'center', fontWeight: '900' });
}

const getCenterValuesForImg = async (img) => { 
    // get dimensions
    dimensions = await sharpWrapper.getDimensions(img)

    // calc positions so that the img is centered properly
    positions = { 
        x: cardWidth / 4 + dimensions.width / 2,
        y: cardHeight / 2 - dimensions.height / 2
    }

    return positions
}

const prependBase64Header = (base64Img) => `data:image/png;base64,${resizedImg.toString('base64')}`

const mergeImages = async (resizedNft, avatar, profileInfoImg) => {
    const mergeImages = require('merge-images');
    const { Canvas, Image } = require('canvas');

    avatarPositions = await getCenterValuesForImg(avatar)
    nftPositions = await getCenterValuesForImg(Buffer.from(resizedNft, 'base64'))

    imagesForCard = [
        { src: backgroundPath, x: 0, y: 0 },
        { src: prependBase64Header(resizedNft), x: cardWidth / 2 - nftPositions.x, y: nftPositions.y },
        { src: profileInfoImg, x: cardWidth / 2, y: 0 },
        { src: avatar, x: cardWidth - avatarPositions.x, y: avatarPositions.y - cardHeight / 8 },
    ]
    return await mergeImages(imagesForCard, {
        Canvas: Canvas,
        Image: Image,
        width: cardWidth,
        height: cardHeight
    })
}

const base64ToImg = async (card, cardOutput) => {    
    const imageDataURI = require('image-data-uri');
    await imageDataURI.outputFile(card, cardOutput)
}

const main = async (info) => {    
    // resize image to fit card
    const resizedNft = await resizeNft(info.nft);

    // generate profile information image data uri
    const profileInfoImg = generateProfileInfoImage(info);
    
    // merge the images
    const card = await mergeImages(resizedNft, info.avatar, profileInfoImg);
    
    // output the twitter card, needs to be stored in a structure / under an id the main page can statically link to
    // e.g. the filename will be the id of the user and the id is passed via the cardInfo object 
    await base64ToImg(card, twitterCardOutput)
    // await base64ToImg(prependBase64Header(resizedNft), twitterCardOutput)
}

module.exports.createCard = main;

// uncomment line below to debug without the server
main(info);