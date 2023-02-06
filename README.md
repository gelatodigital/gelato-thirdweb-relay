# Gelato x Thirdweb Relay Starter Pack

This is an example repo to get started with a React frontend, utilising [Thirdweb's React SDK](https://portal.thirdweb.com/react), and [Tailwind CSS](https://tailwindcss.com/) to get a fully functional and component based starter pack to start going gasless with Gelato Relay and 1Balance today!

1. Run `npm install` after cloning this repo.
2. Deploy an "NFT drop" contract on Polygon from Thirdweb's dashboard: https://thirdweb.com/thirdweb.eth/DropERC721?via=/explore
3. Make sure to generate a valid 1Balance sponsor API key for your relvantt target contract address, the "NFT Drop" contract address you deployed above on Polygon.
4. Input these addresses where you see `target` and `sponsorAPIKey` within `GaslessNFTApp.tsx`.

You're ready to go! Just fire up the front-end:

```npm start```

and headover to `http://localhost:3000/` if it didn't pop up automatically for you!

