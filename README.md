# Block Photos - Your photo album on the blockchain!

## This is my 100 Days Of Code project

Read my introduction article about this project: [Building a decentralized Photos app on Blockstack with React](https://nerdic-coder.com/2018/06/22/building-a-decentralized-photos-app-on-blockstack-with-react/)

- Day 0: Getting React project up and running with Ionic 4. Done!
- Day 1: Login flow to Blockstack.
- Day 2: Profile page with Ionic elements.
- Day 3: Converted the project to run in an [Electron](https://electronjs.org/) app.
- Day 4: Blockstack authentication to work in the Electron app.
- Day 5: Continued with Blockstack authentication to work in the Electron app.
- Day 6: Implemented the [React Router](https://reacttraining.com/react-router/) to the project.
- Day 7: Prototype of to photos list and upload process.
- Day 8: Upgraded Electron Forge and other related packages for more stable application.
- Day 9: File picker dialog and show picture in app with base64.
- Day 10: Upload pictures to Blockstack and list them in the app.
- Day 11: Open individual picture in a new view.
- Day 12: Created service class for the Blockstack integration and added a cache for the pictures in local storage
- Day 13: Cleaned up the code and fixed a few bugs in the #BlockPhotos app
- Day 14: Added a delete button to remove pictures.
- Day 15-17: Fixed loaders (#8) and ESLint checks (#17).
- Day 18: Created unit tests for PictureService class #21
- Day 19: Fixed unit tests for component BlockImg #18
- Day 20: Createed unit tests for pages #22 and started building a Jenkins pipeline 

This project was bootstrapped with [Create React App](https://github.com/facebookincubator/create-react-app).

Below you will find some information on how to perform common tasks.<br>
You can find the most recent version of the React script guide [here](https://github.com/facebookincubator/create-react-app/blob/master/packages/react-scripts/template/README.md).

## Testing the project

To test this project do the following...

Installation:
```bash
git clone https://github.com/nerdic-coder/react-photos.git react-photos
cd react-photos
npm install
```

Starting Electron app:
```bash
npm start
```

Build and package Electron app:
```bash
npm run package
```

Test ESLint:
```bash
npm run lint
```
