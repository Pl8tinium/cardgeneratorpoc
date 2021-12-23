import hic from "./hicDex";
import tzP from "./tzProfiles";
import { getProfileInfo } from "./ceramic";
import sharp from "sharp";
import { BasicProfile } from "@ceramicstudio/idx-constants";
import { generateSync } from "text-to-image";
import genericMergeImages from "merge-images";
import { Canvas, Image } from "canvas";
import axios from "axios";

const backgroundPath = "./img/background.png";
const ipfsGateway = "https://ipfs.dns.pizza/ipfs/";
const HOST_URL = "https://dns.xyz";
const cardHeight = 300;
const cardWidth = 600;
const avatarHeight = 60;
const avatarWidth = 60;

const sharpWrapper = {
  resize: async (img: any, scale: any) => {
    return await sharp(img).resize(scale).toBuffer();
  },
  getDimensions: async (img: any) => {
    return await sharp(img).metadata();
  },
};

const resizeNft = async (nft: Buffer) => {
  // get dimensions
  const dimensions = await sharpWrapper.getDimensions(nft);
  if (dimensions.height === undefined || dimensions.width === undefined) {
    throw new Error("Could not get dimensions");
  }

  // depending on the ratio.. h > w scale for width - w < h scale for height
  const scaleFor =
    dimensions.width > dimensions.height
      ? { height: cardHeight }
      : { width: cardWidth / 2 };

  const resizedImg = await sharpWrapper.resize(nft, scaleFor);

  return resizedImg.toString("base64");
};

const generateProfileInfoImage = (
  tzProfileInfo: { name: any },
  hicData: any,
  ceramicProfile: BasicProfile | null
) => {
  const cardDescription = `
    \n${hicData.title}\n\n\n
    ${
      ceramicProfile?.name ??
      tzProfileInfo?.name ??
      hicData?.creator?.name ??
      hicData?.creator?.address
    }\n
    Found on DNS.XYZ
    `;

  return generateSync(cardDescription, {
    maxWidth: cardWidth / 2,
    customHeight: cardHeight,
    fontFamily: "Roboto",
    verticalAlign: "center",
    textAlign: "center",
    fontWeight: "900",
  });
};

const getCenterValuesForImg = async (img: string) => {
  // get dimensions
  const dimensions = await sharpWrapper.getDimensions(
    Buffer.from(img, "base64")
  );
  if (dimensions.height === undefined || dimensions.width === undefined) {
    throw new Error("Could not get dimensions");
  }

  // calc positions so that the img is centered properly
  const positions = {
    x: cardWidth / 4 + dimensions.width / 2,
    y: cardHeight / 2 - dimensions.height / 2,
  };

  return positions;
};

const prependBase64Header = (base64Img: { toString: (arg0: string) => any }) =>
  `data:image/png;base64,${base64Img.toString("base64")}`;

const mergeImages = async (
  resizedNft: any,
  avatar: Buffer | undefined,
  profileInfoImg: any
) => {
  const nftPositions = await getCenterValuesForImg(resizedNft);

  const imagesForCard = [
    { src: backgroundPath, x: 0, y: 0 },
    {
      src: prependBase64Header(resizedNft),
      x: cardWidth / 2 - nftPositions.x,
      y: nftPositions.y,
    },
    { src: profileInfoImg, x: cardWidth / 2, y: 0 },
  ];

  if (avatar != undefined) {
    const avatarPositions = await getCenterValuesForImg(
      avatar.toString("base64")
    );
    imagesForCard.push({
      src: prependBase64Header(avatar.toString("base64")),
      x: cardWidth - avatarPositions.x,
      y: avatarPositions.y - cardHeight / 29,
    });
  }

  return await genericMergeImages(imagesForCard, {
    Canvas: Canvas,
    Image: Image,
    width: cardWidth,
    height: cardHeight,
  });
};

const prepareCardHeader = (
  nftId: any,
  hicData: { title: any; description: any }
) => {
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
    </head>`;
};

const fetchImg = async (imgUri: string) => {
  return String(
    await axios
      .get(imgUri, {
        responseType: "arraybuffer",
      })
      .then(
        (response: {
          data:
            | WithImplicitCoercion<string>
            | { [Symbol.toPrimitive](hint: "string"): string };
        }) => Buffer.from(response.data, "binary").toString("base64")
      )
  );
};

const getAvatar = async (imgUri: string) => {
  const img = await fetchImg(imgUri);

  return sharpWrapper.resize(Buffer.from(img, "base64"), {
    width: avatarWidth,
    height: avatarHeight,
  });
};

export const createCard = async (nftLocation: string) => {
  const nftId = nftLocation.substr(14);

  // get nft ipfs hash + owner for fetching avatar data
  const hicData = await hic.queryHicDex(nftId);

  // fetch avatar uri & owner name
  const [tzProfileInfo, ceramicProfile] = await Promise.all([
    tzP.getAvatarUri(hicData.ownerAddress),
    getProfileInfo(hicData.ownerAddress),
  ]);

  // download avatar if available
  const avatarImg = await (ceramicProfile?.image?.original?.src
    ? getAvatar(
        ipfsGateway +
          ceramicProfile.image.original.src.substring("ipfs://".length)
      )
    : tzProfileInfo?.logoUri
    ? getAvatar(tzProfileInfo.logoUri)
    : undefined);

  // fetch nft image
  const nftImg = await fetchImg(ipfsGateway + hicData.nftHash);

  // resize image to fit card
  const resizedNft = await resizeNft(Buffer.from(nftImg, "base64"));

  // generate profile information image data uri
  const profileInfoImg = generateProfileInfoImage(
    tzProfileInfo,
    hicData,
    ceramicProfile
  );

  // merge the images
  const card = await mergeImages(resizedNft, avatarImg, profileInfoImg);

  // output the twitter card
  // await base64ToImg(card, cardOutputDir + nftId + '.png')

  // create card buffer
  const cardBuffer = Buffer.from(card.split(",")[1], "base64");

  return cardBuffer;
};

export const getCardHeader = async (nftLocation: string) => {
  const nftId = nftLocation.substr(9);

  // get nft ipfs hash + owner for fetching avatar data
  const hicData = await hic.queryHicDex(nftId);

  // return metadata tags for twitter card
  return prepareCardHeader(nftId, hicData);
};

export default {
  createCard,
  getCardHeader,
};

// const nftLoc = '/nft/hen/4524'
// DEBUG uncomment line below to debug without the server
// main(nftLoc);
