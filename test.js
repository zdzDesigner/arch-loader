const expect = require('chai').expect
const { getArchs, getArchDescrMore, getArchDescr, filterHandler, replaceContent } = require('./index.js')

// console.log({ getArchs, getArchDescrMore, getArchDescr, filterHandler })

const one = () => {

  var tpl = `<template>
  <div class="Runtime">
    <div class="Runtime-content">
      <!-- {{msg}} -->
      <span v-text="text"></span>
      <span class="var" v-text="varValue"></span>
    </div>
  </div>
</template>

<script charset="utf-8">
  import bridge from 'ROOT/arch/util/bridge.js'
   import config from 'ROOT/arch/config/vv.js'
   import  'ROOT/arch/config/config.js'

  import WS, { javaWSURL } from '@/components/WS.js'

  export default WS({
`

  const imports = getArchs(false)(tpl)
  console.log(imports)
  expect(imports.length).to.equal(3)


  const noFile = replaceContent(imports, tpl, false, () => { throw new Error('') })
  // console.log(noFile)
  expect(getArchs(false)(noFile).length).to.equal(3)
  // expect(tpl).to.equal(ret)

  const hasFile = replaceContent(imports, tpl, false, (path) => path)
  // console.log(hasFile)
  expect(getArchs(false)(hasFile)).to.equal(null)

}
one()



const two = () => {

  var tpl = `<template>
  <div class="Runtime">
    <div class="Runtime-content">
      <!-- {{msg}} -->
      <span v-text="text"></span>
      <span class="var" v-text="varValue"></span>
    </div>
  </div>
</template>

<script charset="utf-8">
  import bridge from 'ROOT/arch/util/bridge.js'
   import config from 'ROOT/arch/config/vv.js';  // import  'ROOT/arch/config/config.js'

  import WS, { javaWSURL } from '@/components/WS.js'

  export default WS({
`

  let imports = getArchs(false)(tpl)
  imports = imports.reduce((memo, v) => {
    if (v.match(/\/\//g)) {
      return memo.concat(v.split('//')[0])
    }
    return memo.concat(v)
  }, [])
  console.log(imports)
  // expect(imports.length).to.equal(3)
}
two()

