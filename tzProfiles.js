const axios = require('axios');

/**
 * Get User claims from their tzprofile
 */
const GetUserClaims = async (walletAddr) => {
    return await axios.post('https://indexer.tzprofiles.com/v1/graphql', {
        query: `query MyQuery { tzprofiles_by_pk(account: \"${walletAddr}\") { valid_claims } }`,
        variables: null,
        operationName: 'MyQuery',
    });
};
  
/**
 * Get User Metadata
 */
const GetUserMetadata = async (walletAddr) => {
    const profileInfo = { 
        logoUri: undefined,
        name: undefined,
    }
    try {
        let claims = await GetUserClaims(walletAddr)
        let validClaims = claims.data.data.tzprofiles_by_pk.valid_claims
        if (validClaims !== null)
            for (const claim of validClaims) {
                let claimJSON = JSON.parse(claim[1])
                if (claimJSON.credentialSubject.alias != undefined)
                    profileInfo.name = claimJSON.credentialSubject.alias
                if (claimJSON.credentialSubject.logo != undefined)        
                    profileInfo.logoUri = claimJSON.credentialSubject.logo
            }            
    } catch (e) {
        console.log('Address seems to not own a tzprofile')
    }

    return profileInfo;
};

// GetUserMetadata('tz1f7oZfADFuYV1A4iyv3Q7gZ694KZuxy2UP')
module.exports.getAvatarUri = GetUserMetadata