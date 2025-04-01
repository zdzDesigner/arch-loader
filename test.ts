import { expect } from 'chai'
import { type JoinResult, getArchs, getArchDescrMore, getArchDescr, parseImport, filterHandler, replaceContent } from './index.ts'

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
  const imports = getArchs('')(tpl)
  if (!imports) return

  expect(imports.length).to.equal(3)
  // 解析import
  parseImport(
    ({ module, frompath, targetpath }: JoinResult): string => {
      expect(module).to.equal('bridge')
      expect(frompath).to.equal('ROOT/arch/util/bridge.js')
      expect(targetpath).to.equal('util/bridge.js')
      // console.log({ module, frompath, targetpath })
      return ''
    },
    { gadFn: getArchDescr(''), gadmFn: getArchDescrMore('') }
  )(imports[0])
  const defaultFile = replaceContent(imports, tpl, { rootPath: '', arch: '' })
  expect(getArchs('')(defaultFile)?.length).to.equal(3)

  // 使用默认import

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

  let imports = getArchs('')(tpl)
  if (!imports) return
  // console.log(imports)
  expect(imports.length).to.equal(2)
}
mergeLine()

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
  if (!imports) return

  parseImport(
    ({ module, frompath, targetpath }: JoinResult): string => {
      expect(module).to.equal('bridge')
      expect(frompath).to.equal('ROOT/xxx/util/bridge.js')
      expect(targetpath).to.equal('util/bridge.js')
      console.log(':', { module, frompath, targetpath })
      return ''
    },
    { gadFn: getArchDescr('xxx'), gadmFn: getArchDescrMore('xxx') }
  )(tpl)

  // console.log(imports)
  expect(imports.length).to.equal(2)
}
archConfig()
