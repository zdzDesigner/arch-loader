const expect = require('chai').expect
const { getArchs, getArchDescrMore, getArchDescr, parseImport, filterHandler, replaceContent } = require('./index.js')

const multiLine = () => {
  var tpl = `
  <template>
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

  // 解析模板导出import 
  const imports = getArchs(false)(tpl)
  expect(imports.length).to.equal(3)
  // console.log({ imports })

  // 解析import
  parseImport(
    ({ module, frompath, targetpath }) => {
      expect(module).to.equal('bridge')
      expect(frompath).to.equal('ROOT/arch/util/bridge.js')
      expect(targetpath).to.equal('util/bridge.js')
      // console.log({ module, frompath, targetpath })
    },
    { gadFn: getArchDescr(false), gadmFn: getArchDescrMore(false) }
  )(imports[0])

  // 使用默认import
  const defaultFile = replaceContent(imports, tpl, { arch: false }, () => {
    throw new Error('')
  })
  expect(getArchs(false)(defaultFile).length).to.equal(3)

  // const hasFile = replaceContent(imports, tpl, { arch: false }, (path) => {
  //   console.log({path})
  //   return path
  // })
  // console.log(hasFile)
  // expect(getArchs(false)(hasFile)).to.equal(null)
}
multiLine()

const mergeLine = () => {
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
  // console.log(imports)
  expect(imports.length).to.equal(3)
}
// mergeLine()

const archConfig = () => {
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
  import bridge from 'ROOT/xxx/util/bridge.js'
   import config from 'ROOT/xxx/config/vv.js';  // import  'ROOT/xxx/config/config.js'

  import WS, { javaWSURL } from '@/components/WS.js'

  export default WS({
`

  let imports = getArchs('xxx')(tpl)

  parseImport(
    ({ module, frompath, targetpath }) => {
      expect(module).to.equal('bridge')
      expect(frompath).to.equal('ROOT/xxx/util/bridge.js')
      expect(targetpath).to.equal('util/bridge.js')
      console.log(':', { module, frompath, targetpath })
    },
    { gadFn: getArchDescr('xxx'), gadmFn: getArchDescrMore('xxx') }
  )(tpl)

  // console.log(imports)
  expect(imports.length).to.equal(2)
}
// archConfig()
