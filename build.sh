#!/bin/bash

## ts to js
bun build  index.ts --outfile dist/index.esm.js --format esm --target node 
bun build  index.ts --outfile dist/index.js --format cjs --target node 
# 只生成d.ts文件
tsc index.ts --emitDeclarationOnly  --declaration --outDir ./dist

