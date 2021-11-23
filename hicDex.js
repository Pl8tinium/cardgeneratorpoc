const fetch = require('node-fetch')

const query = `
query Objkt($id: bigint!) {
    hic_et_nunc_token_by_pk(id: $id) {
    artifact_uri
    creator {
        address
        name
    }
    description
    display_uri
    id
    level
    mime
    royalties
    supply
    thumbnail_uri
    metadata
    timestamp
    title
    token_tags(order_by: {id: asc}) {
        tag {
        tag
        }
    }
    swaps(order_by: {id: asc}) {
        price
        timestamp
        status
        amount
        amount_left
        creator {
        address
        name
        }
    }
    trades(order_by: {timestamp: asc}) {
        amount
        buyer {
        address
        name
        }
        seller {
        address
        name
        }
        swap {
        price
        }
        timestamp
    }
    token_holders(where: {quantity: {_gt: "0"}}, order_by: {id: asc}) {
        quantity
        holder {
        address
        name
        }
    }
    hdao_balance
    extra
    }
}
`

async function fetchGraphQL(operationsDoc, operationName, variables) {
    const result = await fetch(
        "https://api.hicdex.com/v1/graphql",
        {
        method: "POST",
        body: JSON.stringify({
            query: operationsDoc,
            variables: variables,
            operationName: operationName
        })
        }
    )

    return await result.json()
}

const extractData = (data) => {
    return { nftHash: data.display_uri.substr(7),
             ownerAddress: data.creator.address,
             title: data.title, 
             description: data.description }
}

async function doFetch(nftId) {
    const { errors, data } = await fetchGraphQL(query, "Objkt", {"id": nftId });
    if (errors) {
        console.error(errors)
    }
    const result = data.hic_et_nunc_token_by_pk
    return extractData(result)
}

module.exports.queryHicDex = doFetch
