# Game Score Counter

[Live App](https://ccorcos.github.io/game-counter)

A simple application for keeping score in board games.

## Architecture

- No side-effects at the top level except for index.tsx.
- External effects interface through services defined on the Environment.
- The Environment is plumbed around everywhere.
- StateMachine is a Redux-style state management abstraction with less boilerplate.

## Development

```sh
git clone git@github.com:ccorcos/game-counter.git
cd game-counter
npm install
npm start
```
