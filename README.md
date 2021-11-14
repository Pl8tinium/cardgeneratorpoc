# What is this

this is a small test poc for the feature "dynamic twitter card generator"

## What is the goal

The goal is to have profile specific twitter card images displayed on a website. Those individual card images should also be displayed on twitter when a link is shared.

## How does it work

It works by setting up a second server next to the normal site that generates the images on profile changes. The generated images will then be dropped off in a filesystem the main page has access to. The main page links the pictures in its profile metadata for twitter card support, newly generated card images will just overwrite the existing ones.

### Image Editing

"merge-images" module to combine the nft img with an individual text 
https://www.npmjs.com/package/merge-images

"text-to-image" module to convert the individual text to an img data uri
https://www.npmjs.com/package/text-to-image

"image-data-uri" module to convert the img data uri to an actual image
https://www.npmjs.com/package/image-data-uri

## Problems

- Caching problems 
https://www.mitostudios.com/blog/how-to-clear-twitter-featured-image-cache/
https://stackoverflow.com/questions/28207497/how-to-force-cache-purge-of-twitter-cards-bots
