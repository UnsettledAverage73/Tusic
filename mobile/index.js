import 'react-native-url-polyfill/auto';
import 'fast-text-encoding';
import { Buffer } from 'buffer';
import { registerRootComponent } from 'expo';

global.Buffer = Buffer;
global.process = require('process');
global.process.env.NODE_ENV = __DEV__ ? 'development' : 'production';

import App from './App';

registerRootComponent(App);
