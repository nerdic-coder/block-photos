## Contribution to Block Photos

To contribute you can either report issues like bugs or good new features.
If you are a developer that think you can solve any of our issues, fork this repo, follow the instructions below to develop and test your changes.
Then create a pull request to this repository develop branch. Good luck!

Installation:

```bash
git clone https://github.com/nerdic-coder/block-photos.git block-photos
cd block-photos
npm install
```

Starting Test server:

```bash
npm run serve
```

Starting Electron app:

```bash
npm start
```

Build and package Electron app:

```bash
npm run package
```

Build and package for web app distribution:

```bash
npm run build:web
```

Build for Android app distribution:

```bash
npm run build:android
```

Build for iOS app distribution:

```bash
npm run build:ios
```

Test Lint:

```bash
npm run lint
```

Run unit tests:

```bash
npm test
```

Run e2e tests:

1. Start the apps dev server:

```bash
npm run serve
```

2. Start selenium

```bash
npm run selenium
```

3. Run the tests

```bash
npm run e2e
```
