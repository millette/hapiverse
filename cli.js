#!/usr/bin/env node

/*
Modules from the HapiJS Universe.

Copyright 2016
Robin Millette <robin@millette.info>
<http://robin.millette.info>

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the
[GNU Affero General Public License](LICENSE.md)
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict'
const meow = require('meow')
const updateNotifier = require('update-notifier')
const hapiverse = require('./')

updateNotifier({ pkg: require('./package.json') }).notify()

const cli = meow([
  'Usage',
  '  $ hapiverse [input]',
  '',
  'Options',
  '  --foo  Lorem ipsum. [Default: false]',
  '',
  'Examples',
  '  $ hapiverse',
  '  unicorns & rainbows',
  '  $ hapiverse ponies',
  '  ponies & rainbows'
])

hapiverse(cli.input[0] || 'unicorns')
  .then((response) => {
    console.log(response)
  })
