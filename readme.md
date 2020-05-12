# babel-plugin-react-intl-message-hash 🇺🇳

Generates a MD5 hash of the defaultMessage value for the translations key, meaning keys only change when the message changes. It also has the added benefit of avoid duplicate messages.

I built this for a project I work on, no idea if it's helpful for anybody else. Seems like a sensible way to do it to me, but maybe I'm wrong as no ones else has built it yet, as far as I can tell 🤷‍♂️.

## Install

npm

```
$ npm install --save-dev babel-plugin-react-intl-message-hash
```

yarn

```
$ yarn add babel-plugin-react-intl-message-hash -D
```

## Usage

.babelrc

```json
{
  "plugins": [
    "react-intl-message-hash"
  ]
}
```

Use after `babel-plugin-react-intl-auto` for completly auto generated ids.


```json
{
  "plugins": [
    "react-intl-auto",
    "react-intl-message-hash"
  ]
}
```

### Before

```js
import { defineMessages } from 'react-intl'

export default defineMessages({
  hello: {
    id: 'App.Components.Greeting.hello',
    defaultMessage: 'hello {name}'
  }
})
```

### After

With babel-plugin-react-intl-message-hash.

```js
import { defineMessages } from 'react-intl'

export default defineMessages({
  hello: {
    id: 'a516b956',
    defaultMessage: 'hello {name}'
  }
})
```