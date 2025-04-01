#!/bin/bash

## ts to js
bun build  index.ts --target node --outfile dist/index.esm.js --format esm
bun build  index.ts --target node --outfile dist/index.js     --format cjs
tsc index.ts --declaration --outDir ./dist

