const hic = require('./hicDex.js')
const tzP = require('./tzProfiles.js')
const fetch = require('node-fetch')
const request = require('request')
const fs = require('fs')

backgroundPath = './img/background.png'
cardOutputDir = './img/cards/'
ipfsGateway = 'https://ipfs.dns.pizza/ipfs/'
HOST_URL = 'https://dns.xyz'
// ipfsGateway = 'https://gateway.ipfs.io/ipfs/'
cardHeight = 300
cardWidth = 600
avatarHeight = 40
avatarWidth = 40

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

const generateProfileInfoImage = (tzProfileInfo, hicData) => {
    cardDescription = `
    ${hicData.title}\n\n\n
    ${tzProfileInfo.name ?? ''}\n
    Found on\nDNS.XYZ
    `
    const textToImage = require('text-to-image');

    return textToImage.generateSync(cardDescription, { maxWidth: cardWidth / 2, customHeight: cardHeight, fontFamily: 'Roboto', verticalAlign: 'center', textAlign: 'center', fontWeight: '900' });
}

const getCenterValuesForImg = async (img) => { 
    // get dimensions
    dimensions = await sharpWrapper.getDimensions(Buffer.from(img, 'base64'))

    // calc positions so that the img is centered properly
    positions = { 
        x: cardWidth / 4 + dimensions.width / 2,
        y: cardHeight / 2 - dimensions.height / 2
    }

    return positions
}

const prependBase64Header = (base64Img) => `data:image/png;base64,${base64Img.toString('base64')}`

const mergeImages = async (resizedNft, avatar, profileInfoImg) => {
    const mergeImages = require('merge-images');
    const { Canvas, Image } = require('canvas');

    nftPositions = await getCenterValuesForImg(resizedNft)

    let imagesForCard = [
        { src: backgroundPath, x: 0, y: 0 },
        { src: prependBase64Header(resizedNft), x: cardWidth / 2 - nftPositions.x, y: nftPositions.y },    
        { src: profileInfoImg, x: cardWidth / 2, y: 0 },            
    ]

    if (avatar != undefined) {        
        avatarPositions = await getCenterValuesForImg(avatar)
        imagesForCard.push({ src: prependBase64Header(avatar), x: cardWidth - avatarPositions.x, y: avatarPositions.y - cardHeight / 8 })
    }

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

const prepareCardHeader = (nftId, hicData) => {
    return `
    <head>
        <title>${hicData.title}</title>
        <meta name="title" content="${hicData.title}">
        <meta name="description" content="${hicData.description}">
        <meta name="robots" content="max-image-preview:large">

        <!-- Open Graph / Facebook -->
        <meta property="og:type" content="website">
        <meta property="og:url" content="${HOST_URL}/nft/hen/${nftId}">
        <meta property="og:title" content="${hicData.title}">
        <meta property="og:description" content="${hicData.description}">
        <meta property="og:image" content="${HOST_URL}/twittercards/${nftId}">
        <meta property="og:image:secure_url" content="${HOST_URL}/twittercards/${nftId}">
        <meta property="og:image:width" content="600">
        <meta property="og:image:height" content="300">

        <!-- Twitter -->
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="${hicData.title}">        
        <meta name="twitter:description" content="${hicData.description}" />
        <meta name="twitter:image" content="${HOST_URL}/twittercards/${nftId}">
    </head>`
}

const fetchImg = async (imgUri) => {
    const axios = require('axios')
    
    return String(await axios.get(imgUri, {
        responseType: 'arraybuffer'
        })
        .then(response => Buffer.from(response.data, 'binary').toString('base64')))
}

const getAvatar = async (imgUri) => {
    sharpWrapper.init()
    let img = await fetchImg(tzProfileInfo.logoUri)

    return sharpWrapper.resize(Buffer.from(img, 'base64'), { width: avatarWidth, height: avatarHeight }) 
}

const createCard = async (nftLocation) => {
    nftId = nftLocation.substr(14)

    // get nft ipfs hash + owner for fetching avatar data   
    hicData = await hic.queryHicDex(nftId)

    // DEBUG, because the objkt 4524 seems not to own a tzprofile       
    hicData.ownerAddress = 'tz1f7oZfADFuYV1A4iyv3Q7gZ694KZuxy2UP'
    // fetch avatar uri & owner name
    tzProfileInfo = await tzP.getAvatarUri(hicData.ownerAddress)
    
    // download avatar if available
    const avatarImg = tzProfileInfo.logoUri != undefined ? await getAvatar(tzProfileInfo.logoUr) : undefined    
    
    // fetch nft image
    const nftImg = await fetchImg(ipfsGateway + hicData.nftHash)

    // resize image to fit card
    const resizedNft = await resizeNft(Buffer.from(nftImg, 'base64'));

    // generate profile information image data uri
    const profileInfoImg = generateProfileInfoImage(tzProfileInfo, hicData);
    
    // merge the images
    const card = await mergeImages(resizedNft, avatarImg, profileInfoImg);
    
    // output the twitter card
    // await base64ToImg(card, cardOutputDir + nftId + '.png')    
    
    // create card buffer
    const cardBuffer = Buffer.from(card.split(',')[1], 'base64')

    return cardBuffer
}

const getCardHeader = async (nftLocation) => {
    nftId = nftLocation.substr(9)

    // get nft ipfs hash + owner for fetching avatar data   
    hicData = await hic.queryHicDex(nftId)

    // return metadata tags for twitter card
    return prepareCardHeader(nftId, hicData)
}

module.exports.createCard = createCard;
module.exports.getCardHeader = getCardHeader; 

nftLoc = '/nft/hen/4524'
// DEBUG uncomment line below to debug without the server
// main(nftLoc);
