# Game Counter

**Features**
- React
- Webpack
- TypeScript
- Deploy to Github Pages
- Environment and StateMachine architecture

## Development

```sh
git clone git@github.com:ccorcos/game-counter.git
cd game-counter
npm install
npm start
```

An in order to be able to deploy this using Github pages, you'll need to create an push an initial branch to Github:

```sh
git checkout -b gh-pages
git push origin gh-pages
git checkout master
```

## Architecture

- No side-effects at the top level except for index.tsx.
- External effects interface through services defined on the Environment.
- The Environment is plumbed around everywhere.
- StateMachine is a Redux-style state management abstraction with less boilerplate.
